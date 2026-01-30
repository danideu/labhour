import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBlockedIps, getLoginAttemptsHistory, unblockIp } from '@/lib/rateLimit';

// GET - Obtener IPs bloqueadas e historial
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'blocked';

        if (type === 'history') {
            const history = await getLoginAttemptsHistory();
            return NextResponse.json(history);
        }

        const blockedIps = await getBlockedIps();
        return NextResponse.json(blockedIps);

    } catch (error) {
        console.error('Error fetching blocked IPs:', error);
        return NextResponse.json({ error: 'Error al obtener IPs bloqueadas' }, { status: 500 });
    }
}

// DELETE - Desbloquear una IP
export async function DELETE(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { ipAddress } = await request.json();

        if (!ipAddress) {
            return NextResponse.json({ error: 'IP requerida' }, { status: 400 });
        }

        await unblockIp(ipAddress);

        return NextResponse.json({
            success: true,
            message: `IP ${ipAddress} desbloqueada correctamente`
        });

    } catch (error) {
        console.error('Error unblocking IP:', error);
        return NextResponse.json({ error: 'Error al desbloquear IP' }, { status: 500 });
    }
}
