const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
let transporter = null;

const initializeEmailService = () => {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const fromName = process.env.GMAIL_FROM_NAME || 'IntelliMatch';

  if (!gmailUser || !gmailPassword) {
    console.warn('[emailService] Gmail credentials not configured in .env file');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword, // 16-character App Password
    },
  });

  console.log('[emailService] Gmail SMTP initialized successfully');
  return transporter;
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (fallback)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = initializeEmailService();
    if (!transport) {
      console.warn('[emailService] Cannot send email - Gmail not configured');
      return null;
    }

    if (!to || !subject || (!html && !text)) {
      console.warn('[emailService] Missing required email fields', { to, subject });
      return null;
    }

    const mailOptions = {
      from: `${process.env.GMAIL_FROM_NAME || 'IntelliMatch'} <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: html || text,
      text: text || html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[emailService] Email sent to ${to} - Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[emailService] Failed to send email:', {
      to,
      subject,
      error: error.message,
    });
    return null;
  }
};

/**
 * Send notification email for application status
 */
const sendApplicationStatusEmail = async (studentEmail, studentName, internshipTitle, status) => {
  const statusMessages = {
    Shortlisted: '🎉 Great news! You have been shortlisted!',
    Rejected: '❌ Unfortunately, you were not selected.',
    Selected: '🏆 Congratulations! You have been selected!',
    Pending: 'Your application is under review.',
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">IntelliMatch</h1>
        <p style="margin: 5px 0 0 0;">Internship Portal</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>${statusMessages[status] || `Your application status: ${status}`}</p>
        <p style="font-size: 16px; margin: 20px 0;">
          <strong>Position:</strong> ${internshipTitle}
        </p>
        <p style="color: #666; font-size: 14px;">
          Please log in to your IntelliMatch account to view more details.
        </p>
      </div>
      <div style="padding: 20px; background: #f0f0f0; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} IntelliMatch. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Application Status Update - ${status} for ${internshipTitle}`,
    html: htmlContent,
    text: `${statusMessages[status]}\n\nPosition: ${internshipTitle}\n\nPlease log in to IntelliMatch to view details.`,
  });
};

/**
 * Send deadline reminder email
 */
const sendDeadlineReminderEmail = async (studentEmail, studentName, internshipTitle, deadline) => {
  const deadlineDate = new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">⏰ Application Deadline Reminder</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>This is a reminder that you have an upcoming internship application deadline!</p>
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>Position:</strong> ${internshipTitle}</p>
          <p style="margin: 10px 0 0 0;"><strong>Deadline:</strong> ${deadlineDate}</p>
        </div>
        <p>Don't miss this opportunity! Log in now to submit or update your application.</p>
      </div>
      <div style="padding: 20px; background: #f0f0f0; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} IntelliMatch. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `⏰ Upcoming Deadline for ${internshipTitle}`,
    html: htmlContent,
    text: `Reminder: Application deadline for ${internshipTitle} is ${deadlineDate}. Don't miss this opportunity!`,
  });
};

/**
 * Send interview reminder email
 */
const sendInterviewReminderEmail = async (studentEmail, studentName, internshipTitle, interviewDate) => {
  const date = new Date(interviewDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = new Date(interviewDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🗓️ Interview Reminder</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your interview is scheduled soon! Be prepared and ready.</p>
        <div style="background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
          <p style="margin: 0;"><strong>Position:</strong> ${internshipTitle}</p>
          <p style="margin: 10px 0 0 0;"><strong>Date & Time:</strong> ${date} at ${time}</p>
        </div>
        <p>Log in to IntelliMatch for interview details and preparation materials.</p>
      </div>
      <div style="padding: 20px; background: #f0f0f0; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} IntelliMatch. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `🗓️ Interview Scheduled for ${internshipTitle}`,
    html: htmlContent,
    text: `Interview Reminder: Your interview for ${internshipTitle} is on ${date} at ${time}.`,
  });
};

module.exports = {
  sendEmail,
  sendApplicationStatusEmail,
  sendDeadlineReminderEmail,
  sendInterviewReminderEmail,
  initializeEmailService,
};
