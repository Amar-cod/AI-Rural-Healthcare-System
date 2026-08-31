import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import PatientHistoryPanel from './PatientHistoryPanel';

const priorityConfig = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400', badge: 'bg-[#C1121F]', label: '🚨 Critical' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-600', label: '🔴 High' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', badge: 'bg-amber-500', label: '🟡 Medium' },
  routine: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', badge: 'bg-green-600', label: '🟢 Routine' }
};

const PatientPriorityList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [filterPriority]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const url = filterPriority ? `/doctors/patients?priority=${filterPriority}` : '/doctors/patients';
      const res = await api.get(url);
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async (e, id) => {
    e.stopPropagation(); // prevent row click
    if (!window.confirm("Are you sure you want to escalate this patient to Critical priority?")) return;
    
    try {
      await api.patch(`/doctors/patients/${id}/escalate`, { priority: 'critical' });
      fetchPatients(); // refresh list
    } catch (err) {
      alert('Failed to escalate patient');
    }
  };

  return (
    <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">📋 Patient Priority List</h2>
          <p className="text-sm text-text-secondary mt-1">Your entire patient list, sorted by urgency.</p>
        </div>
        <select 
          className="mt-4 sm:mt-0 border border-border-color rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High Only</option>
          <option value="medium">Medium Only</option>
          <option value="routine">Routine Only</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
          <p className="text-sm text-text-secondary">Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-text-secondary">No patients found in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(patient => {
            const priority = patient.currentPriority || 'routine';
            const pc = priorityConfig[priority];
            const isExpanded = expandedPatientId === patient._id;

            return (
              <div key={patient._id} className={`rounded-xl border-2 overflow-hidden transition-all ${pc.border}`}>
                <div 
                  className={`p-4 cursor-pointer flex flex-wrap gap-4 items-center justify-between ${pc.bg} hover:opacity-90`}
                  onClick={() => setExpandedPatientId(isExpanded ? null : patient._id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-[250px]">
                    {/* Badge */}
                    <div className="flex items-center shrink-0">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold uppercase shadow-sm ${pc.badge}`}>
                        {priority === 'critical' && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                        {pc.label.replace(/[^a-zA-Z]/g, '').trim()}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-700 shadow-sm border border-gray-200">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm sm:text-base">{patient.name}</p>
                          <p className="text-xs text-text-secondary">Updated: {new Date(patient.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-4 ml-auto">
                    {priority !== 'critical' && (
                      <button 
                        onClick={(e) => handleEscalate(e, patient._id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 transition"
                      >
                        Escalate
                      </button>
                    )}
                    <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Drawer */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-white border-t border-border-color">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => window.location.href = `/doctor/telemedicine/${patient._id}-consult?patientId=${patient._id}`}
                        className="bg-brand-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-brand-secondary transition"
                      >
                        🎥 Start Telemedicine Consult
                      </button>
                    </div>
                    <PatientHistoryPanel patientId={patient._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientPriorityList;
