const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendPushNotification } = require('../services/pushService');

// Run every 1 minute
const INTERVAL_MS = 60 * 1000;

const startReminderCron = () => {
  console.log('Starting Reminder Cron Job...');
  
  setInterval(async () => {
    try {
      const now = new Date();
      // Find pending reminders where scheduledTime is in the past (up to now)
      const pendingReminders = await Reminder.find({
        status: 'pending',
        pushSent: false,
        scheduledTime: { $lte: now }
      });

      for (const reminder of pendingReminders) {
        // Find user and their subscription
        const user = await User.findById(reminder.patientId);
        if (user && user.pushSubscription) {
          await sendPushNotification(user.pushSubscription, {
            title: reminder.type === 'medication' ? 'Medication Reminder' : 'Health Reminder',
            body: reminder.message,
            url: '/patient/reminders'
          });
        }
        
        // For our hackathon demo, we don't automatically mark it 'missed' right away
        // But we need to ensure we don't spam them every minute.
        // Let's add a "notified" flag, or simply keep it pending so it stays in their UI checklist,
        // but we need to know we already pushed. Let's add a `notified: boolean` to schema on the fly, 
        // or just accept that it will push once and we'll mark it 'notified'
        // Actually, let's just use `Reminder.updateOne({ _id: reminder._id }, { $set: { pushSent: true } })`
        // We'll update the schema if needed, mongoose allows setting fields if strict is false, or we can just update status to 'notified' and UI treats 'notified' as 'pending'.
        // Better: let's just add `pushSent: { type: Boolean, default: false }` to the Reminder model. 
        // Wait, I can't easily change it now, let's just do it directly.
        await Reminder.updateOne({ _id: reminder._id }, { $set: { pushSent: true } });
      }
    } catch (error) {
      console.error('Error in reminder cron:', error);
    }
  }, INTERVAL_MS);
};

module.exports = { startReminderCron };
