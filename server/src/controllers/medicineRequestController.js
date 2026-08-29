const MedicineRequest = require('../models/MedicineRequest');
const Prescription = require('../models/Prescription');

const createMedicineRequest = async (req, res) => {
  try {
    const { prescriptionId, requestedMedicines } = req.body;
    const patientId = req.user.id;

    if (!requestedMedicines || requestedMedicines.length === 0) {
      return res.status(400).json({ message: 'Must request at least one medicine.' });
    }

    // Validate that the prescription belongs to the patient
    const prescription = await Prescription.findOne({ _id: prescriptionId, patientId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or access denied.' });
    }

    // Validate that ALL requested medicines exist on this exact prescription
    const validMedicineNames = prescription.medicines.map(m => m.name.toLowerCase());
    const invalidRequests = requestedMedicines.filter(
      med => !validMedicineNames.includes(med.toLowerCase())
    );

    if (invalidRequests.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid medicines requested. You can only request medicines that are on your prescription.',
        invalidRequests 
      });
    }

    const request = new MedicineRequest({
      patientId,
      prescriptionId,
      requestedMedicines
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    console.error('Create medicine request error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await MedicineRequest.find({ patientId: req.user.id })
      .populate({
        path: 'prescriptionId',
        populate: { path: 'doctorId', select: 'name' }
      })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Get medicine requests error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'fulfilled', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const request = await MedicineRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: 'Request not found.' });

    res.json(request);
  } catch (error) {
    console.error('Update medicine request error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createMedicineRequest, getMyRequests, updateRequestStatus };
