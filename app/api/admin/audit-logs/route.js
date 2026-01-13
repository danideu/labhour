import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const actionType = searchParams.get('actionType');
        const entityType = searchParams.get('entityType');
        const limit = parseInt(searchParams.get('limit')) || 100;
        const offset = parseInt(searchParams.get('offset')) || 0;

        const logs = getAuditLogs({
            userId: userId ? parseInt(userId) : null,
            actionType,
            entityType,
            limit,
            offset
        });

        return NextResponse.json(logs);

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Error al obtener logs de auditoría' }, { status: 500 });
    }
}
