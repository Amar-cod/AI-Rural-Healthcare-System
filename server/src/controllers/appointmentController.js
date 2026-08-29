const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

const createAppointment = async (req, res) => {
  try {
    const { doctorId, type, date, timeSlot } = req.body;
    const patientId = req.user.id;

    const existingAppointment = await Appointment.findOne({ doctorId, date, timeSlot });
    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot already booked.' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile || doctorProfile.verificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Invalid or unapproved doctor.' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      type,
      date,
      timeSlot
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Time slot already booked.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getAppointments = async (req, res) => {
  try {
    const role = req.user.role;
    const query = role === 'patient' ? { patientId: req.user.id } : { doctorId: req.user.id };
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ date: 1, timeSlot: 1 });
      
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createAppointment, getAppointments };
