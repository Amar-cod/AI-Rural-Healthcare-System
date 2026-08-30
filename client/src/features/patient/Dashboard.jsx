import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';
import { io } from 'socket.io-client';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [queueEntry, setQueueEntry] = useState(null);
  const [history, setHistory] = useState({ consultations: [], prescriptions: [], reports: [] });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    if (user?._id) {
      fetchHistory();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/history/${user._id}`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleJoinQueue = async (appointment) => {
    try {
      const res = await api.post('/queue/join', {
        doctorId: appointment.doctorId._id,
        appointmentId: appointment._id
      });
      setQueueEntry(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join queue');
    }
  };

  const handleDownload = async (reportId, reportTitle) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob', // Important for downloading files
      });
      
      // Create a blob from the response data
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Set a clean filename based on the title
      const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `${cleanTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download the report. The file may be missing or you do not have permission.');
    }
  };

  useEffect(() => {
    if (queueEntry) {
      const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
      
      socket.emit('join_queue_room', queueEntry.doctorId);
      
      socket.on('queueUpdated', async () => {
        // Queue changed, let's re-fetch the queue to find our exact position
        try {
          const res = await api.get(`/queue/${queueEntry.doctorId}`);
          const myEntry = res.data.find(q => q._id === queueEntry._id);
          if (myEntry) {
            setQueueEntry(myEntry);
          } else {
            // We are no longer in the active queue (maybe status changed to done)
            setQueueEntry(null);
          }
        } catch (err) {
          console.error('Failed to refresh queue status', err);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [queueEntry]);

  return (
    <div className="min-h-screen bg-accent-soft-blue p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-bg-card p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Patient Dashboard</h1>
            <p className="text-text-secondary mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="space-x-3">
            <button onClick={() => navigate('/patient/ai-assistant')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
              🩺 AI Symptom Check
            </button>
            <button onClick={() => navigate('/patient/find-doctor')} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary transition">
              Find a Doctor
            </button>
            <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-text-secondary">No upcoming appointments.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map(apt => (
                  <div key={apt._id} className="border border-border-color p-4 rounded-xl">
                    <p className="font-bold">Dr. {apt.doctorId?.name}</p>
                    <p className="text-sm text-text-secondary capitalize">{apt.type} • {apt.date} • {apt.timeSlot}</p>
                    <p className="text-xs font-semibold text-priority-routine mt-1 uppercase">Status: {apt.status}</p>
                    
                    {!queueEntry && (
                      <button 
                        onClick={() => handleJoinQueue(apt)}
                        className="mt-3 w-full bg-brand-primary text-white py-1 rounded-md text-sm hover:bg-brand-secondary transition"
                      >
                        Join Today's Queue
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Queue Status */}
          <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-4">Live Queue Status</h2>
            {!queueEntry ? (
              <p className="text-text-secondary">You are not currently in a queue.</p>
            ) : (
              <div className="text-center p-6 bg-accent-soft-blue rounded-xl border border-blue-200">
                <p className="text-lg font-medium text-text-secondary mb-2">Your Position in Line</p>
                <p className="text-5xl font-bold text-brand-primary mb-4">#{queueEntry.position}</p>
                <div className="inline-block px-4 py-1 bg-white rounded-full text-sm font-semibold uppercase text-brand-secondary shadow-sm mb-4">
                  {queueEntry.status === 'waiting' ? 'Waiting' : 'In Consultation'}
                </div>
                {queueEntry.status === 'in-consult' && (
                  <button 
                    onClick={() => navigate(`/patient/telemedicine/${queueEntry.consultationId || queueEntry._id}`)}
                    className="block w-full bg-brand-primary text-white py-2 rounded-lg font-bold hover:bg-brand-secondary transition"
                  >
                    🎥 Join Telemedicine Call
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Medical History & Prescriptions */}
        <div className="mt-8 bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Medical History & Records</h2>
            <button 
              onClick={() => navigate('/patient/medicine-request')}
              className="bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition"
            >
              💊 Request Medicine Refill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold border-b pb-2 mb-4">Past Prescriptions</h3>
              {history.prescriptions.length === 0 ? (
                <p className="text-sm text-text-secondary">No prescriptions yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.prescriptions.map(p => (
                    <div key={p._id} className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <p className="font-bold text-sm mb-1">{new Date(p.createdAt).toLocaleDateString()} - Dr. {p.doctorId?.name}</p>
                      <ul className="list-disc list-inside text-xs text-gray-700">
                        {p.medicines.map((m, i) => <li key={i}>{m.name}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold border-b pb-2 mb-4">Downloadable Reports</h3>
              {history.reports.length === 0 ? (
                <p className="text-sm text-text-secondary">No reports available.</p>
              ) : (
                <div className="space-y-3">
                  {history.reports.map(r => (
                    <div key={r._id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{r.title}</p>
                        <p className="text-xs text-text-secondary">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      {r.fileUrl && (
                        <button 
                          onClick={() => handleDownload(r._id, r.title)}
                          className="text-brand-primary text-sm font-bold hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
