const express = require("express");
const cors = require("cors");
const SibApiV3Sdk = require("@sendinblue/client");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8000;

// Initialize Brevo (Sendinblue) API
const brevo = new SibApiV3Sdk.TransactionalEmailsApi();
brevo.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Helper function to verify email using Abstract API
async function verifyEmail(email) {
  try {
    const response = await fetch(
      `https://emailreputation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`
    );

    const data = await response.json();
    console.log("📬 Email verification result:", data);

    // Accept only valid, deliverable emails
    return data.email_deliverability.status_detail === "valid_email";
  } catch (error) {
    console.error("Error verifying email:", error.message);
    return false;
  }
}

app.post("/mail", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  // Step 1: Verify email
  const isValid = await verifyEmail(email);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: "Invalid or undeliverable email address",
    });
  }

  // Save Email To Google Sheets
  await fetch(
    "https://script.google.com/macros/s/AKfycbzc4FwSKgUlM4UM2bzWa33JxbaSAzbH-HxuAPln1lqioO6qZk_dE9HzroeYoXSLX6Vcsw/exec",
    {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }
  );

  // Step 2: Prepare email
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
          <a href="https://lotaai.vercel.app" target="_blank" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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
    // Send welcome email
    await brevo.sendTransacEmail({
      sender: { email: process.env.FROM_EMAIL, name: "LOTA AI Team" },
      to: [{ email }],
      subject,
      htmlContent: htmlTemplate,
    });

    // Send admin notification
    await brevo.sendTransacEmail({
      sender: { email: process.env.FROM_EMAIL, name: "LOTA AI Bot" },
      to: [{ email: process.env.ADMIN_EMAIL }],
      subject: "📩 New LOTA AI Subscriber!",
      htmlContent: `
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
