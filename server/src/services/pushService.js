const webpush = require('web-push');

// Initialize with VAPID keys from environment
// These must be generated once and stored in .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@rhcs.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
} else {
  console.warn('VAPID keys not configured. Web push notifications will fail.');
}

/**
 * Send a push notification to a user's subscription
 * @param {Object} subscription - The PushSubscription object stored in the DB
 * @param {Object} payload - The payload to send (e.g., { title, body, url })
 */
const sendPushNotification = async (subscription, payload) => {
  if (!subscription) return;
  
  try {
    const payloadString = JSON.stringify(payload);
    await webpush.sendNotification(subscription, payloadString);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Note: If error.statusCode === 410 (Gone), the subscription has expired or been unsubscribed.
    // In a production app, we would remove the subscription from the DB here.
  }
};

module.exports = {
  sendPushNotification,
};
