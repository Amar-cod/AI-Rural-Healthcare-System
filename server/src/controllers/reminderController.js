const Reminder = require('../models/Reminder');
const User = require('../models/User');

const getMyReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ patientId: req.user.id })
      .populate('scheduleId')
      .sort({ scheduledTime: 1 });
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateReminderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, patientId: req.user.id },
      { status },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // Save to user object
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    
    res.json({ message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyReminders,
  updateReminderStatus,
  subscribeToPush
};
