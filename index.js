const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8000;

// Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Routes
app.post("/mail", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const userName = "there";
  const subject = "Welcome to LOTA AI!";
  const message =
    "Thanks for joining the LOTA AI community! Soon you’ll be able to manage your daily tasks just by speaking — alarms, reminders, and smart actions handled automatically.";

  const htmlTemplate = `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f4f7fb; padding: 25px;">
    <div style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; margin: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">

      <div style="background-color: #0ea5e9; color: white; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">🤖 LOTA AI</h1>
        <p style="margin: 5px 0 0; font-size: 15px;">Your Smart Personal Agent</p>
      </div>

      <div style="padding: 35px 25px;">
        <h2 style="color: #333;">Hey ${userName} 👋</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.7;">
          ${message}
        </p>

        <div style="margin: 35px 0; text-align: center;">
          <a href="https://lota-ai.com" target="_blank" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Visit LOTA AI
          </a>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center;">
          Stay tuned! We'll notify you as soon as LOTA AI launches 🚀
        </p>
      </div>

      <div style="background-color: #f1f5f9; color: #888; text-align: center; padding: 15px; font-size: 13px;">
        © ${new Date().getFullYear()} LOTA AI — All Rights Reserved.
      </div>
    </div>
  </div>
  `;

  try {
    // Send welcome email to the user
    await transporter.sendMail({
      from: `"LOTA AI Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlTemplate,
    });

    // Send notification email to admin (you)
    await transporter.sendMail({
      from: `"LOTA AI Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "📩 New LOTA AI Subscriber!",
      text: `A new user has joined the LOTA AI waitlist: ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>📥 New LOTA AI Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><em>Time:</em> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log(
      `Emails sent successfully: user=${email}, admin=${process.env.ADMIN_EMAIL}`
    );

    res
      .status(200)
      .json({ success: true, message: "Emails sent successfully" });
  } catch (err) {
    console.error("Error while sending mail:", err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
