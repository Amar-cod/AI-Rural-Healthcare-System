const Prescription = require('../models/Prescription');
const User = require('../models/User');
const MedicationSchedule = require('../models/MedicationSchedule');
const Reminder = require('../models/Reminder');
const { generatePrescriptionPDF } = require('../services/pdfService');

const createPrescription = async (req, res) => {
  try {
    console.log('--- createPrescription CALLED ---');
    console.log('req.body:', req.body);
    
    const { consultationId, patientId, medicines } = req.body;
    const doctorId = req.user.id;

    if (!medicines || medicines.length === 0) {
      console.log('Validation failed: No medicines');
      return res.status(400).json({ message: 'Medicines list cannot be empty.' });
    }
    
    if (!consultationId || !patientId) {
      console.log('Validation failed: Missing IDs', { consultationId, patientId });
      return res.status(400).json({ message: 'Missing consultation or patient ID.' });
    }

    const prescription = new Prescription({
      consultationId,
      patientId,
      doctorId,
      medicines
    });

    await prescription.save();

    const patient = await User.findById(patientId);
    const doctor = await User.findById(doctorId);

    // Generate MedicationSchedules and Reminders
    const schedules = [];
    const reminders = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // start today

    for (const med of medicines) {
      const duration = parseInt(med.durationDays) || 5;
      const freq = med.frequency || '1x/day';
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration - 1);
      
      const schedule = new MedicationSchedule({
        patientId,
        prescriptionId: prescription._id,
        medicineName: med.name,
        dosage: med.dosage,
        frequency: freq,
        startDate,
        endDate
      });
      await schedule.save();
      schedules.push(schedule);

      // Determine times based on frequency
      let dailyTimes = [];
      if (freq === '1x/day') dailyTimes = [9]; // 9 AM
      else if (freq === '2x/day') dailyTimes = [9, 21]; // 9 AM, 9 PM
      else if (freq === '3x/day') dailyTimes = [9, 14, 21]; // 9 AM, 2 PM, 9 PM
      else dailyTimes = [9];

      for (let i = 0; i < duration; i++) {
        for (const hour of dailyTimes) {
          const reminderTime = new Date(startDate);
          reminderTime.setDate(reminderTime.getDate() + i);
          reminderTime.setHours(hour, 0, 0, 0);

          // Only create reminder if it's in the future (or today)
          // If we created it right now and it's already past the hour today, it might immediately trigger or be shown as missed.
          // For simplicity, we just create all.
          
          reminders.push({
            patientId,
            scheduleId: schedule._id,
            type: 'medication',
            message: `Take ${med.name} (${med.dosage})`,
            scheduledTime: reminderTime,
            status: 'pending'
          });
        }
      }
    }
    
    if (reminders.length > 0) {
      await Reminder.insertMany(reminders);
    }

    let fileUrl = null;
    try {
      fileUrl = await generatePrescriptionPDF(prescription, patient, doctor);
      
      const report = new Report({
        patientId,
        doctorId,
        consultationId,
        title: `Prescription on ${new Date().toLocaleDateString()}`,
        content: `Prescription with ${medicines.length} medicines generated.`,
        fileUrl
      });
      await report.save();
    } catch (pdfErr) {
      console.error('Error generating PDF:', pdfErr);
      // We still return success for prescription creation even if PDF fails
    }

    res.status(201).json({ prescription, fileUrl });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error('Get my prescriptions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createPrescription, getMyPrescriptions };
