import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingModal, setBookingModal] = useState(null);
  const [formData, setFormData] = useState({ date: '', timeSlot: '', type: 'checkup' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        doctorId: bookingModal._id, // User._id inside doctor profile
        type: formData.type,
        date: formData.date,
        timeSlot: formData.timeSlot
      });
      alert('Appointment requested successfully!');
      setBookingModal(null);
      navigate('/patient/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.specialization.toLowerCase().includes(search.toLowerCase()) || 
    d.userId?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-accent-soft-blue p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Find a Doctor</h1>
          <button onClick={() => navigate('/patient/dashboard')} className="text-brand-primary underline">Back to Dashboard</button>
        </div>

        <input 
          type="text" 
          placeholder="Search by name or specialization..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 rounded-xl shadow-sm border border-border-color mb-8"
        />

        {loading ? <div className="text-center p-8">Loading doctors...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => (
              <div key={doctor._id} className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
                <h2 className="text-xl font-bold text-text-primary mb-1">Dr. {doctor.userId?.name}</h2>
                <p className="text-brand-secondary font-medium mb-3">{doctor.specialization}</p>
                <p className="text-sm text-text-secondary mb-1"><strong>Qualifications:</strong> {doctor.qualifications}</p>
                <p className="text-sm text-text-secondary mb-4"><strong>Languages:</strong> {doctor.userId?.language || 'English'}</p>
                <button 
                  onClick={() => setBookingModal(doctor.userId)}
                  className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-secondary transition"
                >
                  Book Appointment
                </button>
              </div>
            ))}
            {filteredDoctors.length === 0 && <div className="col-span-full text-center p-8 text-text-secondary">No approved doctors found.</div>}
          </div>
        )}

        {/* Booking Modal */}
        {bookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Book Appointment with Dr. {bookingModal.name}</h2>
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border rounded p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time Slot</label>
                  <select value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})} className="w-full border rounded p-2" required>
                    <option value="">Select a time slot</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Consultation Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded p-2">
                    <option value="checkup">General Checkup</option>
                    <option value="telemedicine">Telemedicine / Video Call</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setBookingModal(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                  <button type="submit" className="flex-1 bg-brand-primary text-white py-2 rounded-md hover:bg-brand-secondary">Confirm</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindDoctor;
