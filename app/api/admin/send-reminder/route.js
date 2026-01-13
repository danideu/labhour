import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
// Email sending placeholder - would need nodemailer setup
// import { sendEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { userId, message } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        const reminderMessage = message?.trim() || 'Recuerda fichar tu entrada.';

        // Create in-app notification
        await createNotification({
            userId,
            type: 'CLOCK_IN_REMINDER',
            title: 'Recordatorio de fichaje',
            message: reminderMessage,
            referenceId: null
        });

        // Email sending would go here
        // await sendEmail({
        //     to: userEmail,
        //     subject: 'Recordatorio de fichaje - LabHour',
        //     body: reminderMessage
        // });

        return NextResponse.json({
            success: true,
            message: 'Recordatorio enviado correctamente'
        });

    } catch (error) {
        console.error('Error sending reminder:', error);
        return NextResponse.json({ error: 'Error al enviar recordatorio' }, { status: 500 });
    }
}
