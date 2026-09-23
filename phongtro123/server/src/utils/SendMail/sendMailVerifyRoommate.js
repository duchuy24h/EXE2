const createMailer = require('./createMailer');
require('dotenv').config();

const SendMailVerifyRoommate = async (email, otp) => {
    try {
        const transport = await createMailer();

        const info = await transport.sendMail({
            from: `"phongtro123" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Xác minh email để dùng tính năng tìm bạn ở ghép',
            text: `Mã OTP để xác minh email của bạn là: ${otp}`,
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Roboto', sans-serif;
                        background-color: #f2f4f8;
                        margin: 0;
                        padding: 0;
                        color: #2d3436;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #2d3436, #636e72);
                        padding: 30px;
                        color: #ffffff;
                        text-align: center;
                    }
                    .header h2 {
                        margin: 0;
                        font-size: 22px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .message {
                        font-size: 16px;
                        margin-bottom: 20px;
                        line-height: 1.6;
                    }
                    .otp-box {
                        text-align: center;
                        background-color: #f1f2f6;
                        border: 1px dashed #2d3436;
                        padding: 20px;
                        font-size: 24px;
                        font-weight: bold;
                        color: #2d3436;
                        border-radius: 10px;
                        letter-spacing: 4px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        padding: 20px;
                        background-color: #f1f2f6;
                        color: #636e72;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Xác minh email</h2>
                    </div>
                    <div class="content">
                        <div class="message">
                            Bạn đang kích hoạt tính năng tìm bạn ở ghép. Dùng mã OTP bên dưới để xác minh email.
                        </div>
                        <div class="otp-box">${otp}</div>
                        <div class="message">
                            Mã OTP có hiệu lực trong vài phút. Nếu bạn không thực hiện thao tác này, hãy bỏ qua email.
                        </div>
                    </div>
                    <div class="footer">
                        Trân trọng,<br/>
                        <strong>phongtro123</strong>
                    </div>
                </div>
            </body>
            </html>
            `,
        });

        console.log('Roommate email verification sent:', info.messageId);
    } catch (error) {
        console.log('Error sending roommate verification email:', error);
    }
};

module.exports = SendMailVerifyRoommate;
