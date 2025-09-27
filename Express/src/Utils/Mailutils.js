import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_ADDR,
    pass: process.env.GMAIL_PASS,
  },
});

const sendResetMail = async (email, receiver, token, url) => {
  try {
    const resetLink = `${url}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Your App" <${process.env.GMAIL_ADDR}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h2>Hello ${receiver},</h2>
          <p>You requested to reset your password. Click the button below to continue:</p>

          <a href="${resetLink}" 
             style="display:inline-block; background:#4CAF50; color:white; 
             padding:10px 20px; text-decoration:none; border-radius:5px; 
             margin:20px 0; font-weight:bold;">
             Reset Password
          </a>

          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>

          <hr/>
          <small>This link will expire in 15 minutes. If you didn’t request this, you can ignore it.</small>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(" Reset email sent to:", email);
  } catch (err) {
    console.error(" Error sending reset email:", err);
  }
};


export default sendResetMail
