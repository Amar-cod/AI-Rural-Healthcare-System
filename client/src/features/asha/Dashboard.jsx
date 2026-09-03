import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';
import { syncQueue, subscribeToQueue, getQueueCount } from './offlineQueue';
import PatientRegistration from './PatientRegistration';
import VillagePatients from './VillagePatients';

const AshaDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  const [selectedVillage, setSelectedVillage] = useState(null); // id of village
  const [isRegistering, setIsRegistering] = useState(false);

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

  useEffect(() => {
    // Initial queue count
    getQueueCount().then(setQueueCount);

    // Queue listeners
    const unsubscribe = subscribeToQueue(setQueueCount);

    // Network listeners
    const handleOnline = async () => {
      setIsOnline(true);
      const syncedCount = await syncQueue(api);
      if (syncedCount > 0) {
        alert(`Successfully synced ${syncedCount} queued records to the server.`);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRegisterClick = (villageId) => {
    setSelectedVillage(villageId);
    setIsRegistering(true);
  };

  const handleVillageClick = (villageId) => {
    if (selectedVillage === villageId && !isRegistering) {
      setSelectedVillage(null); // toggle off
    } else {
      setSelectedVillage(villageId);
      setIsRegistering(false);
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🏠 ASHA Worker Dashboard
              </h1>
              {isOnline ? (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Online
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="text-gray-400">✗</span> 
                  Offline — {queueCount === 0 ? 'No records pending sync' : `${queueCount} records queued`}
                </span>
              )}
            </div>
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
            {villages.length > 0 && (
              <button 
                onClick={() => handleRegisterClick(villages[0]._id)}
                className="bg-[#8B7FD1] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-opacity-90"
              >
                + Register New Resident
              </button>
            )}
          </div>

          {villages.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">You have no villages assigned yet.</p>
              <p className="text-sm text-gray-400 mt-1">Contact the administrator to be assigned to a village.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {villages.map(v => (
                <div 
                  key={v._id} 
                  onClick={() => handleVillageClick(v._id)}
                  className={`border p-5 rounded-xl transition cursor-pointer bg-white ${
                    selectedVillage === v._id ? 'border-[#8B7FD1] shadow-md ring-2 ring-[#8B7FD1] ring-opacity-20' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{v.name}</h3>
                    <span className="bg-[#F1EEFA] text-[#8B7FD1] px-2 py-1 rounded-md text-xs font-bold">
                      {v.district}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{v.state}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRegisterClick(v._id); }}
                      className="flex-1 text-sm font-bold text-[#8B7FD1] bg-[#F1EEFA] p-2 rounded-lg hover:bg-opacity-80 transition"
                    >
                      + Register
                    </button>
                    <div className="flex-1 text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg flex items-center justify-center">
                      View List
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conditional Rendering of Action Panes */}
        {selectedVillage && isRegistering && (
          <div className="mt-8">
            <PatientRegistration 
              villageId={selectedVillage} 
              onComplete={() => setIsRegistering(false)} 
            />
          </div>
        )}

        {selectedVillage && !isRegistering && (
          <VillagePatients 
            villageId={selectedVillage} 
            villageName={villages.find(v => v._id === selectedVillage)?.name || ''} 
          />
        )}

      </div>
    </div>
  );
};

export default AshaDashboard;
