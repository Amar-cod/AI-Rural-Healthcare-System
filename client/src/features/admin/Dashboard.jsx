import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [villages, setVillages] = useState([]);
  const [ashaWorkers, setAshaWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newVillage, setNewVillage] = useState({ name: '', district: '', state: '' });
  const [newAsha, setNewAsha] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, villagesRes, ashaRes] = await Promise.all([
        api.get('/admin/doctors'),
        api.get('/admin/villages'),
        api.get('/admin/asha-workers')
      ]);
      setApplications(appsRes.data);
      setVillages(villagesRes.data);
      setAshaWorkers(ashaRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/doctors/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCreateVillage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/villages', newVillage);
      setNewVillage({ name: '', district: '', state: '' });
      fetchData();
      alert('Village created');
    } catch (err) {
      alert('Failed to create village');
    }
  };

  const handleCreateAsha = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/asha-workers', newAsha);
      setNewAsha({ name: '', email: '', password: '', phone: '' });
      fetchData();
      alert('ASHA Worker created');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ASHA worker');
    }
  };

  const handleAssignAsha = async (villageId, ashaWorkerId) => {
    if (!ashaWorkerId) return;
    try {
      await api.post(`/admin/villages/${villageId}/assign`, { ashaWorkerId });
      fetchData();
      alert('Assigned successfully');
    } catch (err) {
      alert('Failed to assign');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent-soft-amber p-8 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-soft-amber p-4 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} className="mt-4 sm:mt-0 w-full sm:w-auto bg-danger text-white px-5 py-2 rounded-lg font-bold">Logout</button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Villages Management */}
        <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
          <h2 className="text-xl font-bold mb-4">Manage Villages</h2>
          
          <form onSubmit={handleCreateVillage} className="mb-6 flex flex-col sm:flex-row gap-2">
            <input type="text" placeholder="Village Name" value={newVillage.name} onChange={e => setNewVillage({...newVillage, name: e.target.value})} className="border p-2 rounded-lg flex-1 text-sm" required />
            <input type="text" placeholder="District" value={newVillage.district} onChange={e => setNewVillage({...newVillage, district: e.target.value})} className="border p-2 rounded-lg flex-1 text-sm" required />
            <input type="text" placeholder="State" value={newVillage.state} onChange={e => setNewVillage({...newVillage, state: e.target.value})} className="border p-2 rounded-lg flex-1 text-sm" required />
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
          </form>

          <div className="space-y-3">
            {villages.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-text-secondary text-sm">No villages created yet.</p>
              </div>
            ) : (
              villages.map(v => (
                <div key={v._id} className="p-3 bg-gray-50 border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div>
                    <p className="font-bold">{v.name}</p>
                    <p className="text-xs text-gray-500">{v.district}, {v.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className="border p-1 text-sm rounded bg-white w-40"
                      onChange={(e) => handleAssignAsha(v._id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Assign ASHA...</option>
                      {ashaWorkers.map(a => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  {v.assignedAshaWorkerIds && v.assignedAshaWorkerIds.length > 0 && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      Assigned: {v.assignedAshaWorkerIds.map(a => a.name).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ASHA Workers Management */}
        <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
          <h2 className="text-xl font-bold mb-4">ASHA Workers</h2>
          
          <form onSubmit={handleCreateAsha} className="mb-6 grid grid-cols-2 gap-2">
            <input type="text" placeholder="Name" value={newAsha.name} onChange={e => setNewAsha({...newAsha, name: e.target.value})} className="border p-2 rounded-lg text-sm" required />
            <input type="text" placeholder="Phone" value={newAsha.phone} onChange={e => setNewAsha({...newAsha, phone: e.target.value})} className="border p-2 rounded-lg text-sm" required />
            <input type="email" placeholder="Email (Login)" value={newAsha.email} onChange={e => setNewAsha({...newAsha, email: e.target.value})} className="border p-2 rounded-lg text-sm" required />
            <input type="password" placeholder="Password" value={newAsha.password} onChange={e => setNewAsha({...newAsha, password: e.target.value})} className="border p-2 rounded-lg text-sm" required />
            <button type="submit" className="col-span-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Register ASHA Worker</button>
          </form>

          <div className="space-y-3">
            {ashaWorkers.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-text-secondary text-sm">No ASHA workers registered yet.</p>
              </div>
            ) : (
              ashaWorkers.map(a => (
                <div key={a._id} className="p-3 bg-gray-50 border rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.email} | {a.phone}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Doctor Applications */}
      <div className="max-w-6xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
        <h2 className="text-xl font-semibold mb-4">Doctor Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-color text-sm text-gray-600">
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
                    <td className="p-3 font-semibold">{app.userId?.name}</td>
                    <td className="p-3 text-sm">{app.userId?.email}</td>
                    <td className="p-3 text-sm">{app.specialization}<br/><span className="text-xs text-text-secondary">{app.qualifications}</span></td>
                    <td className="p-3 text-sm">{app.licenseNumber}</td>
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
