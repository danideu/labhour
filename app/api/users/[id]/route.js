import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return false;
    }
    return true;
}

export async function PUT(request, { params }) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const { name, email, password, role } = await request.json();

        // Check if user exists
        const existingUser = await queryOne('SELECT * FROM users WHERE id = ?', [id]);

        if (!existingUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // If updating email, check uniqueness
        if (email !== existingUser.email) {
            const duplicateEmail = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
            if (duplicateEmail) {
                return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
            }
        }

        let updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?';
        let args = [name, email, role];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            args.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        args.push(id);

        await execute(updateQuery, args);

        return NextResponse.json({ success: true, message: 'Usuario actualizado' });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    const session = await getSession();
    if (parseInt(id) === session.id) {
        return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    try {
        // Check references
        const result = await queryOne('SELECT count(*) as count FROM time_entries WHERE user_id = ?', [id]);

        if (result.count > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar el usuario porque tiene registros de tiempo asociados. Considere desactivarlo en su lugar.'
            }, { status: 400 });
        }

        await execute('DELETE FROM users WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Usuario eliminado' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
    }
}
