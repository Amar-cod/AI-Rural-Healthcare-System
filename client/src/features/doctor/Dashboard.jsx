import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';
import { io } from 'socket.io-client';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    licenseNumber: '',
  });

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    try {
      const res = await api.get('/doctors/profile');
      setProfile(res.data);
      if (res.data?.verificationStatus === 'approved') {
        fetchAppointments();
        fetchQueue(user._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  };

  const fetchQueue = async (doctorId) => {
    try {
      const res = await api.get(`/queue/${doctorId}`);
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  useEffect(() => {
    if (profile?.verificationStatus === 'approved') {
      const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
      
      socket.emit('join_queue_room', user._id);
      
      socket.on('queueUpdated', () => {
        fetchQueue(user._id);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors/apply', formData);
      setProfile(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleUpdateQueueStatus = async (id, status) => {
    try {
      await api.patch(`/queue/${id}/status`, { status });
      fetchQueue(user._id);
    } catch (err) {
      alert('Failed to update queue status');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-accent-soft-green p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-bg-card p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Doctor Dashboard</h1>
            <p className="text-text-secondary mt-1">Welcome back, Dr. {user?.name}</p>
          </div>
          <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md">Logout</button>
        </div>

        {!profile ? (
          <div className="bg-white border border-border-color p-6 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Complete Your Verification</h2>
            <p className="text-text-secondary mb-4">Please provide your medical credentials to be verified by an admin.</p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Specialization</label>
                <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full border border-border-color rounded-md p-2" required placeholder="e.g. General Physician" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Qualifications</label>
                <input type="text" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} className="w-full border border-border-color rounded-md p-2" required placeholder="e.g. MBBS, MD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">License Number</label>
                <input type="text" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full border border-border-color rounded-md p-2" required />
              </div>
              <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-secondary transition">Submit Application</button>
            </form>
          </div>
        ) : profile.verificationStatus !== 'approved' ? (
          <div className="bg-white border border-border-color p-6 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Your Profile Details</h2>
            <div className="mb-4">
              <strong>Status: </strong>
              {profile.verificationStatus === 'pending' && <span className="bg-priority-medium-bg text-priority-medium px-2 py-1 rounded-full text-sm font-semibold uppercase inline-block">Pending</span>}
              {profile.verificationStatus === 'rejected' && <span className="bg-priority-high-bg text-priority-high px-2 py-1 rounded-full text-sm font-semibold uppercase inline-block">Rejected</span>}
            </div>
            <p><strong>Specialization:</strong> {profile.specialization}</p>
            <p><strong>Qualifications:</strong> {profile.qualifications}</p>
            <p><strong>License Number:</strong> {profile.licenseNumber}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Queue */}
            <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
              <h2 className="text-xl font-bold mb-4">Live Patient Queue</h2>
              {queue.length === 0 ? (
                <p className="text-text-secondary">Your queue is currently empty.</p>
              ) : (
                <div className="space-y-3">
                  {queue.map(entry => (
                    <div key={entry._id} className={`p-4 rounded-xl border ${entry.status === 'in-consult' ? 'border-brand-primary bg-blue-50' : 'border-border-color'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold">
                          <span className="text-brand-secondary mr-2">#{entry.position}</span>
                          {entry.patientId?.name}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase ${entry.status === 'in-consult' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        {entry.status === 'waiting' && (
                          <button onClick={() => handleUpdateQueueStatus(entry._id, 'in-consult')} className="text-sm bg-brand-primary text-white px-3 py-1 rounded-md">Start Consult</button>
                        )}
                        {entry.status === 'in-consult' && (
                          <button onClick={() => handleUpdateQueueStatus(entry._id, 'done')} className="text-sm bg-priority-routine text-white px-3 py-1 rounded-md">Complete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
              <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-text-secondary">No appointments booked yet.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div key={apt._id} className="border border-border-color p-4 rounded-xl">
                      <p className="font-bold">{apt.patientId?.name}</p>
                      <p className="text-sm text-text-secondary capitalize">{apt.type} • {apt.date} • {apt.timeSlot}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
