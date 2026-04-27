const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const notify = async ({ userId, type, title, message, metadata = {}, sendEmail: shouldSendEmail = true }) => {
  // Validate required fields
  if (!userId) {
    console.warn('[notificationService] Missing userId - notification not created');
    return null;
  }

  if (!type || !title || !message) {
    console.warn('[notificationService] Missing required fields - notification not created', {
      userId,
      type,
      title,
      message,
    });
    return null;
  }

  try {
    // Create database notification
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      metadata,
    });

    console.log(`[notificationService] Notification created: ${notification._id}`);

    // Send email notification if enabled and user email available
    if (shouldSendEmail) {
      try {
        const user = await User.findById(userId).select('email name');
        if (user && user.email) {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">IntelliMatch</h1>
                <p style="margin: 5px 0 0 0;">Internship Portal</p>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <p>Hi <strong>${user.name || 'there'}</strong>,</p>
                <h2 style="color: #333; margin: 20px 0;">${title}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
                <p style="margin-top: 30px; color: #999; font-size: 12px;">
                  Type: <strong>${type}</strong>
                </p>
              </div>
              <div style="padding: 20px; background: #f0f0f0; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
                <p>© ${new Date().getFullYear()} IntelliMatch. All rights reserved.</p>
              </div>
            </div>
          `;

          await sendEmail({
            to: user.email,
            subject: title,
            html: htmlContent,
            text: message,
          });

          console.log(`[notificationService] Email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.warn('[notificationService] Failed to send email notification:', emailError.message);
        // Continue - email failure shouldn't stop notification creation
      }
    }

    return notification;
  } catch (err) {
    console.error('[notificationService] Failed to create notification:', {
      userId,
      type,
      title,
      message,
      error: err.message,
    });
    return null;
  }
};

module.exports = {
  notify,
};
