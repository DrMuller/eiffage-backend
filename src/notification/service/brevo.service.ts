import * as brevo from '@getbrevo/brevo';
import config from '../../app.config';

export interface EmailPayload {
    to: { email: string; name?: string }[];
    templateId: number;
    params?: Record<string, any>;
    subject?: string;
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    replyTo?: { email: string; name?: string };
    attachment?: { url: string; name: string }[];
}

export const sendTemplateEmail = async (payload: EmailPayload): Promise<boolean> => {
    try {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        // Required fields
        sendSmtpEmail.to = payload.to;
        sendSmtpEmail.templateId = payload.templateId;

        // Optional fields
        if (payload.params) sendSmtpEmail.params = payload.params;
        if (payload.subject) sendSmtpEmail.subject = payload.subject;
        if (payload.cc) sendSmtpEmail.cc = payload.cc;
        if (payload.bcc) sendSmtpEmail.bcc = payload.bcc;
        if (payload.replyTo) sendSmtpEmail.replyTo = payload.replyTo;
        if (payload.attachment) sendSmtpEmail.attachment = payload.attachment;

        // Set sender
        sendSmtpEmail.sender = {
            name: config.brevo.senderName,
            email: config.brevo.senderEmail
        };

        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) {
        console.error('Failed to send email via Brevo:', error);
        return false;
    }
};

// Helper functions for common email templates
// export const sendWelcomeEmail = async (to: string, name?: string, params?: Record<string, any>): Promise<boolean> => {
//     return sendTemplateEmail({
//         to: [{ email: to, name }],
//         templateId: config.brevo.templates.welcome,
//         params
//     });
// };

export const sendPasswordResetEmail = async (to: string, params: { urlReset: string }, name?: string): Promise<boolean> => {
    return await sendTemplateEmail({
        to: [{ email: to, name }],
        templateId: config.brevo.templates.passwordReset,
        params
    });
};

// export const sendAccountVerificationEmail = async (to: string, name?: string, params?: Record<string, any>): Promise<boolean> => {
//     return sendTemplateEmail({
//         to: [{ email: to, name }],
//         templateId: config.brevo.templates.accountVerification,
//         params
//     });
// };

export interface RawEmailPayload {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    replyTo?: { email: string; name?: string };
}

export const sendRawEmail = async (payload: RawEmailPayload): Promise<boolean> => {
    try {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.to = payload.to;
        sendSmtpEmail.subject = payload.subject;
        sendSmtpEmail.htmlContent = payload.htmlContent;

        if (payload.cc) sendSmtpEmail.cc = payload.cc;
        if (payload.bcc) sendSmtpEmail.bcc = payload.bcc;
        if (payload.replyTo) sendSmtpEmail.replyTo = payload.replyTo;

        sendSmtpEmail.sender = {
            name: config.brevo.senderName,
            email: config.brevo.senderEmail
        };

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) {
        console.error('Failed to send raw email via Brevo:', error);
        return false;
    }
};
