import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { execute } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No se ha proporcionado una imagen' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG, GIF o WebP' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 5MB' }, { status: 400 });
        }

        // Create unique filename
        const ext = file.name.split('.').pop();
        const filename = `avatar_${session.id}_${Date.now()}.${ext}`;
        const avatarPath = `/avatars/${filename}`;

        // Ensure avatars directory exists
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        await mkdir(avatarsDir, { recursive: true });

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(path.join(avatarsDir, filename), buffer);

        // Update user avatar_url in database
        await execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarPath, session.id]);

        return NextResponse.json({
            success: true,
            avatarUrl: avatarPath,
            message: 'Avatar actualizado correctamente'
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json({ error: 'Error al subir avatar' }, { status: 500 });
    }
}
