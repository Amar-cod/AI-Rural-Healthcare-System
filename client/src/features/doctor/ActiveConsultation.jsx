import { useState } from 'react';
import api from '../../lib/axios';

const ActiveConsultation = ({ consultationId, patientId, onComplete }) => {
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', instructions: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.dosage) {
      setMedicines([...medicines, newMedicine]);
      setNewMedicine({ name: '', dosage: '', instructions: '' });
    }
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save notes
      if (notes.trim()) {
        await api.patch(`/consultations/${consultationId}/notes`, { notes });
      }

      // Automatically include any pending medicine if they forgot to click Add
      let finalMedicines = [...medicines];
      if (newMedicine.name && newMedicine.dosage) {
        finalMedicines.push(newMedicine);
      }

      // Save prescription if there are medicines
      if (finalMedicines.length > 0) {
        await api.post('/prescriptions', {
          consultationId,
          patientId,
          medicines: finalMedicines
        });
      } else if (!notes.trim()) {
        alert('Please add some notes or medicines before saving.');
        setLoading(false);
        return;
      }

      setSaved(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to save consultation details.');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
        <h3 className="text-lg font-bold text-green-700 mb-2">Consultation Completed</h3>
        <p className="text-green-600 mb-4">Notes and prescriptions have been saved and generated securely.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border-color p-6">
      <h3 className="text-lg font-bold mb-4 border-b pb-2">Active Consultation</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Doctor's Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          rows={4}
          placeholder="Enter observation notes, advice, etc..."
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Prescription (Medicines)</label>
        
        {medicines.length > 0 && (
          <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
            {medicines.map((m, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-200">
                <div>
                  <p className="font-bold text-sm">{m.name} <span className="font-normal text-gray-500">({m.dosage})</span></p>
                  <p className="text-xs text-gray-600">{m.instructions}</p>
                </div>
                <button onClick={() => handleRemoveMedicine(i)} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Medicine Name"
            value={newMedicine.name}
            onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
            className="flex-1 border border-border-color rounded-lg p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Dosage (e.g. 500mg)"
            value={newMedicine.dosage}
            onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})}
            className="w-1/4 border border-border-color rounded-lg p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Instructions (e.g. After meals)"
            value={newMedicine.instructions}
            onChange={(e) => setNewMedicine({...newMedicine, instructions: e.target.value})}
            className="flex-1 border border-border-color rounded-lg p-2 text-sm"
          />
          <button 
            onClick={handleAddMedicine}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border-color">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-secondary transition"
        >
          {loading ? 'Saving...' : 'Save & Complete Consultation'}
        </button>
      </div>
    </div>
  );
};

export default ActiveConsultation;
