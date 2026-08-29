const Prescription = require('../models/Prescription');
const User = require('../models/User');
const { generatePrescriptionPDF } = require('../services/pdfService');

const createPrescription = async (req, res) => {
  try {
    const { consultationId, patientId, medicines } = req.body;
    const doctorId = req.user.id;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'Medicines list cannot be empty.' });
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

    // Generate PDF (fire and forget or await, depending on needs. Await is safer for returning url)
    // To make the file downloadable immediately, we wait for PDF generation
    // Alternatively, we could attach the fileUrl to a Report object.
    
    // In our system, let's create a Report for this Prescription
    const Report = require('../models/Report');
    
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
