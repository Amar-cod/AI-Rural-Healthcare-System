import { useState, useEffect } from 'react';
import api from '../../lib/axios';

const VillagePatients = ({ villageId, villageName }) => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [villageId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/asha/villages/${villageId}/patients`);
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.healthId && p.healthId.toLowerCase().includes(search.toLowerCase())) ||
    (p.phone && p.phone.includes(search))
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          Residents in {villageName}
        </h2>
        <input 
          type="text" 
          placeholder="Search by name, phone or ID..." 
          className="border border-gray-300 p-2 rounded-lg w-full sm:w-64 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center p-8 text-gray-500">Loading residents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No residents found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Health ID</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Age/Gender</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                  <td className="py-3 px-4 font-bold text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-sm">{p.healthId || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-600">{p.phone || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-600">{p.age ? `${p.age}y` : '-'} / {p.gender ? p.gender.charAt(0) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VillagePatients;
