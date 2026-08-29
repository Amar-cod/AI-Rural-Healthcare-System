import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    licenseNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/doctors/profile');
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors/apply', formData);
      setProfile(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-accent-soft-green p-8">
      <div className="max-w-4xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Doctor Dashboard</h1>
          <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md">Logout</button>
        </div>
        
        <p className="mb-6 text-lg">Welcome, Dr. {user?.name}</p>

        {!profile ? (
          <div className="bg-white border border-border-color p-6 rounded-lg">
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
        ) : (
          <div className="bg-white border border-border-color p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Your Profile Details</h2>
            <div className="mb-4">
              <strong>Status: </strong>
              {profile.verificationStatus === 'pending' && <span className="bg-priority-medium-bg text-priority-medium px-2 py-1 rounded-full text-sm font-semibold uppercase inline-block">Pending</span>}
              {profile.verificationStatus === 'approved' && <span className="bg-priority-routine-bg text-priority-routine px-2 py-1 rounded-full text-sm font-semibold uppercase inline-block">Approved</span>}
              {profile.verificationStatus === 'rejected' && <span className="bg-priority-high-bg text-priority-high px-2 py-1 rounded-full text-sm font-semibold uppercase inline-block">Rejected</span>}
            </div>
            <p><strong>Specialization:</strong> {profile.specialization}</p>
            <p><strong>Qualifications:</strong> {profile.qualifications}</p>
            <p><strong>License Number:</strong> {profile.licenseNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
