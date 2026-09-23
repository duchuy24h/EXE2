const nodemailer = require('nodemailer');
require('dotenv').config();

const getGmailOAuthTransport = async () => {
    const { google } = require('googleapis');

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI || 'https://developers.google.com/oauthplayground';
    const refreshToken = process.env.REFRESH_TOKEN;
    const emailUser = process.env.EMAIL_USER;

    if (!clientId || !clientSecret || !refreshToken || !emailUser) {
        throw new Error('Thiếu Gmail OAuth env: CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, EMAIL_USER');
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const accessToken = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: emailUser,
            clientId,
            clientSecret,
            refreshToken,
            accessToken: accessToken?.token || accessToken,
        },
    });
};

const getSmtpTransport = () => {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
};

const createMailer = async () => {
    const smtpTransport = getSmtpTransport();
    if (smtpTransport) {
        return smtpTransport;
    }

    return getGmailOAuthTransport();
};

module.exports = createMailer;
