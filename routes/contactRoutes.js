const express = require("express");
const nodemailer = require("nodemailer");
const { addMessage } = require("../admin/services/contactStore");

const router = express.Router();

const TARGET_EMAIL = "alaf15123456789@gmail.com";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

router.post("/send", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const message = String(req.body?.message || "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  if (message.length < 5 || message.length > 4000) {
    return res.status(400).json({ message: "Message length must be between 5 and 4000 characters." });
  }

  const savedMessage = addMessage({ name, email, message });

  const transporter = getTransporter();
  if (!transporter) {
    return res.json({
      message: "Message saved successfully and visible in admin portal Messages.",
      data: savedMessage
    });
  }

  try {
    await transporter.sendMail({
      from: `Kerala College Hub Contact <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: TARGET_EMAIL,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    });

    return res.json({
      message: "Message sent successfully and saved to admin portal.",
      data: savedMessage
    });
  } catch (error) {
    return res.json({
      message: "Message saved to admin portal. Email delivery failed due to SMTP issue.",
      data: savedMessage
    });
  }
});

module.exports = router;
