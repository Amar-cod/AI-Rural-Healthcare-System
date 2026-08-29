const QueueEntry = require('../models/QueueEntry');
const Appointment = require('../models/Appointment');
const { getIO } = require('../socket');

const joinQueue = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.body;
    const patientId = req.user.id;

    // Check if already in a queue
    const existingEntry = await QueueEntry.findOne({ patientId, status: { $in: ['waiting', 'in-consult'] } });
    if (existingEntry) {
      return res.status(400).json({ message: 'You are already in a queue.' });
    }

    const count = await QueueEntry.countDocuments({ doctorId, status: 'waiting' });

    const entry = await QueueEntry.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      position: count + 1
    });

    // Notify doctor and other patients about the new queue state
    const io = getIO();
    io.to(`queue_${doctorId}`).emit('queueUpdated', { message: 'New patient joined' });

    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const queue = await QueueEntry.find({ doctorId, status: { $in: ['waiting', 'in-consult'] } })
      .populate('patientId', 'name email')
      .sort({ position: 1 });

    res.json(queue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const entry = await QueueEntry.findById(id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    // Authorization check
    if (entry.doctorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    entry.status = status;
    await entry.save();

    const io = getIO();
    io.to(`queue_${entry.doctorId}`).emit('queueUpdated', { message: 'Patient status changed' });

    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { joinQueue, getQueue, updateQueueStatus };
