import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';

const AshaDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const res = await api.get('/asha/villages');
      setVillages(res.data);
    } catch (err) {
      console.error('Failed to fetch assigned villages:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EEFA] p-8 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7FD1] mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EEFA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏠 ASHA Worker Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
          </div>
          <button onClick={logout} className="mt-4 sm:mt-0 bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600 transition">
            Logout
          </button>
        </div>

        {/* My Villages */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">My Villages</h2>
            <button className="bg-[#8B7FD1] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-opacity-90">
              + Register New Resident
            </button>
          </div>

          {villages.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">You have no villages assigned yet.</p>
              <p className="text-sm text-gray-400 mt-1">Contact the administrator to be assigned to a village.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {villages.map(v => (
                <div key={v._id} className="border border-gray-200 p-5 rounded-xl hover:shadow-md transition cursor-pointer bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{v.name}</h3>
                    <span className="bg-[#F1EEFA] text-[#8B7FD1] px-2 py-1 rounded-md text-xs font-bold">
                      {v.district}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{v.state}</p>
                  <div className="text-sm font-semibold text-gray-700 bg-gray-50 p-3 rounded-lg flex justify-between">
                    <span>Residents</span>
                    <span className="text-[#8B7FD1]">0</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AshaDashboard;
