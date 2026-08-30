const Consultation = require('../models/Consultation');

const getHandedOffSessions = async (req, res) => {
  try {
    // Get all consultations from handed-off AI sessions (general pool + assigned to this doctor)
    const consultations = await Consultation.find({
      aiSessionId: { $ne: null }
    })
      .populate('patientId', 'name email')
      .populate('aiSessionId', 'symptomsSummary redFlags suggestedPriority status messages')
      .sort({ 
        // Custom sort: high=1, medium=2, routine=3
        finalPriority: 1, 
        createdAt: -1 
      });

    // Manual priority sort since MongoDB doesn't natively sort enums by custom order
    const priorityOrder = { high: 0, medium: 1, routine: 2 };
    consultations.sort((a, b) => {
      const aPriority = priorityOrder[a.finalPriority] ?? 2;
      const bPriority = priorityOrder[b.finalPriority] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(consultations);
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const overridePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPriority } = req.body;
    const doctorId = req.user.id;

    if (!['high', 'medium', 'routine'].includes(finalPriority)) {
      return res.status(400).json({ message: 'Invalid priority value.' });
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });

    consultation.finalPriority = finalPriority;
    consultation.doctorId = doctorId; // Claim the consultation
    await consultation.save();

    res.json(consultation);
  } catch (error) {
    console.error('Override priority error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const addNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.id;

    console.log(`--- addNotes CALLED --- consultationId: ${id}, doctorId: ${doctorId}`);

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      console.log('Consultation not found');
      return res.status(404).json({ message: 'Consultation not found.' });
    }

    if (consultation.doctorId && consultation.doctorId.toString() !== doctorId) {
      console.log(`403 Forbidden: consultation.doctorId is ${consultation.doctorId.toString()}, but req.user is ${doctorId}`);
      return res.status(403).json({ message: 'Not authorized to edit notes for this consultation.' });
    }

    consultation.notes = notes;
    consultation.doctorId = doctorId; // Claim it if not already
    await consultation.save();

    console.log('Successfully saved notes');
    res.json(consultation);
  } catch (error) {
    console.error('Add notes error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getHandedOffSessions, overridePriority, addNotes };
