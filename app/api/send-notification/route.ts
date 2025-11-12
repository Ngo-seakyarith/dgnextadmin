import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '@/app/lib/untils/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        const token = message?.to?.trim();

        if (!token)
            return NextResponse.json(
                { success: false, error: 'Missing FCM token' },
                { status: 400 }
            );

        await messaging.send({
            token,
            notification: { title: message.title, body: message.body },
            android: { priority: 'high' }, // heads-up
            apns: {
                headers: { 'apns-priority': '10' },
                payload: {
                    aps: {
                        sound: message.ios.sound ? 'default' : undefined,
                        badge: message.ios.badge,
                    },
                },
            },
            data: message.data,
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.log('>>> FULL FCM ERROR:', JSON.stringify(err, null, 2));
        const errorMessage = err instanceof Error ? err.message : 'FCM error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}