
import { Resend } from 'resend';

// Initialize Resend with API Key (defaults to process.env.RESEND_API_KEY)
// If no key is provided, we will mock the sending in development.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export interface EmailPayload {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: EmailPayload) {
    // In pure dev/test without keys, just log it.
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from: 'Commodity Platform <onboarding@resend.dev>', // Update this with your verified domain later
            to,
            subject,
            react,
        });
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
