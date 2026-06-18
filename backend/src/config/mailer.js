const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSigningLink = async ({ toEmail, signerName, documentName, signingUrl }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'DocSign <noreply@docsign.com>',
    to: toEmail,
    subject: `You have been requested to sign: ${documentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">📄 DocSign — Signature Request</h2>
        <p>Hello${signerName ? ' ' + signerName : ''},</p>
        <p>You have been requested to sign the document: <strong>${documentName}</strong>.</p>
        <p>Click the button below to review and sign the document. This link expires in <strong>48 hours</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingUrl}"
             style="background-color: #16a34a; color: white; padding: 12px 28px;
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
            ✍️ Sign Document
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          If you were not expecting this request, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">DocSign — Secure Digital Signatures</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendSigningLink };
