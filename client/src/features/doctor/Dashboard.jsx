import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';
import { io } from 'socket.io-client';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedConsultation, setExpandedConsultation] = useState(null);
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
        fetchConsultations();
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

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      setConsultations(res.data);
    } catch (err) {
      console.error('Failed to fetch consultations', err);
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

  const handleOverridePriority = async (consultationId, newPriority) => {
    try {
      await api.patch(`/consultations/${consultationId}/priority`, { finalPriority: newPriority });
      fetchConsultations();
    } catch (err) {
      alert('Failed to update priority');
    }
  };

  const priorityConfig = {
    high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', badge: 'bg-red-600', label: '🔴 High' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-500', label: '🟡 Medium' },
    routine: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', badge: 'bg-green-600', label: '🟢 Routine' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent-soft-green p-8 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-soft-green p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-bg-card p-6 rounded-2xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Doctor Dashboard</h1>
            <p className="text-text-secondary mt-1">Welcome back, Dr. {user?.name}</p>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <button onClick={logout} className="w-full md:w-auto bg-danger text-white px-4 py-2 rounded-md">Logout</button>
          </div>
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
          <div className="space-y-6">
            {/* AI Priority Queue — the centerpiece */}
            <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
              <h2 className="text-xl font-bold mb-4">🧠 AI Triage Priority Queue</h2>
              <p className="text-sm text-text-secondary mb-4">Patient sessions triaged by AI, sorted by urgency. You can override the priority.</p>
              {consultations.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-text-secondary">No patient sessions waiting for review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map(c => {
                    const session = c.aiSessionId;
                    const pc = priorityConfig[c.finalPriority] || priorityConfig.routine;
                    const isExpanded = expandedConsultation === c._id;

                    return (
                      <div key={c._id} className={`rounded-xl border-2 overflow-hidden ${pc.border}`}>
                        {/* Header */}
                        <div 
                          className={`p-4 cursor-pointer flex items-center justify-between ${pc.bg}`}
                          onClick={() => setExpandedConsultation(isExpanded ? null : c._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase ${pc.badge}`}>
                              {c.finalPriority}
                            </span>
                            <div>
                              <p className="font-bold text-text-primary">{c.patientId?.name}</p>
                              <p className="text-xs text-text-secondary">{new Date(c.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-lg">{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && session && (
                          <div className="p-4 bg-white border-t border-border-color space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-text-primary mb-1">AI Summary:</p>
                              <p className="text-sm text-text-secondary">{session.symptomsSummary || 'No summary available'}</p>
                            </div>

                            {session.redFlags && session.redFlags.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Red Flags:</p>
                                <ul className="list-disc list-inside text-sm text-red-600">
                                  {session.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                                </ul>
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-semibold text-text-primary mb-1">AI Suggested Priority: 
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-white text-xs font-bold uppercase ${priorityConfig[session.suggestedPriority]?.badge}`}>
                                  {session.suggestedPriority}
                                </span>
                              </p>
                            </div>

                            {/* Override Priority */}
                            <div className="pt-3 border-t border-border-color">
                              <p className="text-sm font-semibold text-text-primary mb-2">Override Priority:</p>
                              <div className="flex space-x-2 mb-4">
                                {['high', 'medium', 'routine'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => handleOverridePriority(c._id, p)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                      c.finalPriority === p 
                                        ? `${priorityConfig[p].badge} text-white`
                                        : `${priorityConfig[p].bg} ${priorityConfig[p].text} border ${priorityConfig[p].border} hover:opacity-80`
                                    }`}
                                  >
                                    {priorityConfig[p].label}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => window.location.href = `/doctor/telemedicine/${c._id}?patientId=${c.patientId?._id || c.patientId}`}
                                className="w-full bg-brand-primary text-white py-2 rounded-lg font-bold hover:bg-brand-secondary transition"
                              >
                                🎥 Start Telemedicine Consult
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Queue */}
              <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
                <h2 className="text-xl font-bold mb-4">Live Patient Queue</h2>
                {queue.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-text-secondary">Your queue is currently empty.</p>
                  </div>
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
                  <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-text-secondary">No appointments booked yet.</p>
                  </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
