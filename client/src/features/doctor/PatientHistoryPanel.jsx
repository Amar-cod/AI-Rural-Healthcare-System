import { useState, useEffect } from 'react';
import api from '../../lib/axios';

const PatientHistoryPanel = ({ patientId }) => {
  const [history, setHistory] = useState({ consultations: [], prescriptions: [], reports: [], patientRecords: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('consultations');

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/history/${patientId}`);
      setHistory(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load patient history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading history...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  const tabs = [
    { id: 'consultations', label: 'Consultations', count: history.consultations?.length || 0 },
    { id: 'prescriptions', label: 'Prescriptions', count: history.prescriptions?.length || 0 },
    { id: 'reports', label: 'Reports', count: history.reports?.length || 0 },
    { id: 'asha', label: 'ASHA Field Records', count: history.patientRecords?.length || 0 }
  ];

  const getBaseUrl = () => import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border-color h-full flex flex-col">
      <div className="p-4 border-b border-border-color">
        <h3 className="text-lg font-bold">Patient History</h3>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border-color overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
            }`}
          >
            {tab.label} <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-y-auto flex-1 bg-gray-50/30">
        
        {activeTab === 'consultations' && (
          <div className="space-y-3">
            {history.consultations?.length === 0 ? (
              <p className="text-sm text-text-secondary">No past consultations.</p>
            ) : (
              history.consultations.map(c => (
                <div key={c._id} className="text-sm bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="font-bold text-gray-800">{new Date(c.date).toLocaleDateString()}</p>
                  {c.aiSessionId?.symptomsSummary && (
                    <p className="mt-2 text-gray-700"><strong>AI Summary:</strong> {c.aiSessionId.symptomsSummary}</p>
                  )}
                  {c.notes && <p className="mt-2 text-gray-700"><strong>Notes:</strong> {c.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-3">
            {history.prescriptions?.length === 0 ? (
              <p className="text-sm text-text-secondary">No past prescriptions.</p>
            ) : (
              history.prescriptions.map(p => (
                <div key={p._id} className="text-sm bg-white p-4 rounded-lg border border-brand-secondary/30 shadow-sm border-l-4 border-l-brand-secondary">
                  <p className="font-bold text-gray-800">{new Date(p.createdAt).toLocaleDateString()} - Dr. {p.doctorId?.name}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {p.medicines.map((m, i) => (
                      <li key={i} className="text-gray-700">{m.name} <span className="text-gray-500 text-xs">({m.dosage})</span></li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-2">
            {history.reports?.length === 0 ? (
              <p className="text-sm text-text-secondary">No reports available.</p>
            ) : (
              history.reports.map(r => (
                <div key={r._id} className="text-sm flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="font-medium text-gray-700">{r.title}</span>
                  {r.fileUrl && (
                    <a 
                      href={`${getBaseUrl()}/api/reports/${r._id}/download`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-brand-primary font-semibold hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'asha' && (
          <div className="space-y-4">
            {history.patientRecords?.length === 0 ? (
              <p className="text-sm text-text-secondary">No ASHA field records found for this patient.</p>
            ) : (
              history.patientRecords.map(record => (
                <div key={record._id} className="text-sm bg-white p-4 rounded-lg border border-[#8B7FD1]/30 shadow-sm border-l-4 border-l-[#8B7FD1]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-800">{new Date(record.createdAt).toLocaleDateString()}</p>
                    <span className="bg-[#F1EEFA] text-[#8B7FD1] px-2 py-1 rounded text-xs font-semibold">
                      Collected by: {record.collectedBy?.name || 'ASHA Worker'}
                    </span>
                  </div>
                  
                  {record.symptoms?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-xs uppercase text-gray-500">Symptoms</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.symptoms.map((sym, i) => (
                          <span key={i} className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 text-xs">{sym}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.observations && (
                    <div className="mt-3 text-gray-700">
                      <p className="font-semibold text-xs uppercase text-gray-500">Observations</p>
                      <p className="mt-1">{record.observations}</p>
                    </div>
                  )}

                  {record.attachments?.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-xs uppercase text-gray-500 mb-2">Attachments</p>
                      <div className="flex gap-2">
                        {record.attachments.map((att, i) => (
                          <a 
                            key={i} 
                            href={`${getBaseUrl()}${att.url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium text-xs border border-gray-300 flex items-center gap-1 transition-colors"
                          >
                            {att.type === 'photo' ? '📷 View Photo' : '📄 View Report'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientHistoryPanel;
