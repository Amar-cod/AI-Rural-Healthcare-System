import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

const MedicineRequest = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [presRes, reqRes] = await Promise.all([
        api.get('/prescriptions/mine'),
        api.get('/medicine-requests/mine')
      ]);
      setPrescriptions(presRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handlePrescriptionChange = (e) => {
    setSelectedPrescription(e.target.value);
    setSelectedMedicines([]); // Reset selection when prescription changes
  };

  const handleMedicineToggle = (medName) => {
    if (selectedMedicines.includes(medName)) {
      setSelectedMedicines(selectedMedicines.filter(m => m !== medName));
    } else {
      setSelectedMedicines([...selectedMedicines, medName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPrescription || selectedMedicines.length === 0) return;

    setLoading(true);
    try {
      await api.post('/medicine-requests', {
        prescriptionId: selectedPrescription,
        requestedMedicines: selectedMedicines
      });
      alert('Medicine request submitted successfully!');
      setSelectedPrescription('');
      setSelectedMedicines([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const activePrescription = prescriptions.find(p => p._id === selectedPrescription);

  return (
    <div className="min-h-screen bg-accent-soft-blue p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-bg-card p-6 rounded-2xl shadow-sm">
          <h1 className="text-2xl font-bold text-text-primary">Medicine Requests</h1>
          <button onClick={() => navigate('/patient/dashboard')} className="text-text-secondary hover:text-text-primary">
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Form */}
          <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-4">Request Refill</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Select Prescription</label>
                <select 
                  className="w-full border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={selectedPrescription}
                  onChange={handlePrescriptionChange}
                  required
                >
                  <option value="">-- Choose a prescription --</option>
                  {prescriptions.map(p => (
                    <option key={p._id} value={p._id}>
                      {new Date(p.createdAt).toLocaleDateString()} - Dr. {p.doctorId?.name}
                    </option>
                  ))}
                </select>
              </div>

              {activePrescription && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Select Medicines</label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {activePrescription.medicines.map((m, i) => (
                      <label key={i} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMedicines.includes(m.name)}
                          onChange={() => handleMedicineToggle(m.name)}
                          className="h-4 w-4 text-brand-primary rounded"
                        />
                        <span className="text-sm font-medium">{m.name} <span className="text-gray-500 font-normal">({m.dosage})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !selectedPrescription || selectedMedicines.length === 0}
                className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold hover:bg-brand-secondary transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Past Requests */}
          <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-4">Your Requests</h2>
            {requests.length === 0 ? (
              <p className="text-text-secondary">No medicine requests yet.</p>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req._id} className="border border-border-color p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-text-secondary">{new Date(req.createdAt).toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">Requested from Dr. {req.prescriptionId?.doctorId?.name}</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                      {req.requestedMedicines.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineRequest;
