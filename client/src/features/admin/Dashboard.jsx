import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/admin/doctors');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/doctors/${id}/status`, { status });
      fetchApplications(); // refresh list
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent-soft-amber p-8 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-soft-amber p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <button onClick={logout} className="w-full sm:w-auto bg-danger text-white px-4 py-2 rounded-md">Logout</button>
        </div>
        
        <p className="mb-6 text-lg">Welcome, {user?.name}</p>

        <h2 className="text-xl font-semibold mb-4">Doctor Applications</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-color">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Specialization</th>
                <th className="p-3">License</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-text-secondary">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="border-b border-border-color hover:bg-gray-50">
                    <td className="p-3">{app.userId?.name}</td>
                    <td className="p-3">{app.userId?.email}</td>
                    <td className="p-3">{app.specialization}<br/><span className="text-xs text-text-secondary">{app.qualifications}</span></td>
                    <td className="p-3">{app.licenseNumber}</td>
                    <td className="p-3">
                      {app.verificationStatus === 'pending' && <span className="bg-priority-medium-bg text-priority-medium px-2 py-1 rounded-full text-xs font-semibold uppercase inline-block">Pending</span>}
                      {app.verificationStatus === 'approved' && <span className="bg-priority-routine-bg text-priority-routine px-2 py-1 rounded-full text-xs font-semibold uppercase inline-block">Approved</span>}
                      {app.verificationStatus === 'rejected' && <span className="bg-priority-high-bg text-priority-high px-2 py-1 rounded-full text-xs font-semibold uppercase inline-block">Rejected</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {app.verificationStatus !== 'approved' && (
                          <button onClick={() => handleUpdateStatus(app._id, 'approved')} className="bg-priority-routine text-white px-3 py-1 rounded-md text-sm whitespace-nowrap">Approve</button>
                        )}
                        {app.verificationStatus !== 'rejected' && (
                          <button onClick={() => handleUpdateStatus(app._id, 'rejected')} className="bg-danger text-white px-3 py-1 rounded-md text-sm whitespace-nowrap">Reject</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
