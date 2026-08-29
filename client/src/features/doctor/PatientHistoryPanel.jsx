import { useState, useEffect } from 'react';
import api from '../../lib/axios';

const PatientHistoryPanel = ({ patientId }) => {
  const [history, setHistory] = useState({ consultations: [], prescriptions: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border-color p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Patient History</h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-text-primary mb-2 border-b pb-1">Past Consultations</h4>
          {history.consultations.length === 0 ? (
            <p className="text-sm text-text-secondary">No past consultations.</p>
          ) : (
            <div className="space-y-3">
              {history.consultations.map(c => (
                <div key={c._id} className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="font-medium">{new Date(c.date).toLocaleDateString()}</p>
                  {c.aiSessionId?.symptomsSummary && (
                    <p className="mt-1 text-gray-700"><strong>AI Summary:</strong> {c.aiSessionId.symptomsSummary}</p>
                  )}
                  {c.notes && <p className="mt-1 text-gray-700"><strong>Notes:</strong> {c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-text-primary mb-2 border-b pb-1">Prescriptions</h4>
          {history.prescriptions.length === 0 ? (
            <p className="text-sm text-text-secondary">No past prescriptions.</p>
          ) : (
            <div className="space-y-3">
              {history.prescriptions.map(p => (
                <div key={p._id} className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="font-medium">{new Date(p.createdAt).toLocaleDateString()} - Dr. {p.doctorId?.name}</p>
                  <ul className="list-disc list-inside mt-1">
                    {p.medicines.map((m, i) => (
                      <li key={i}>{m.name} ({m.dosage})</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-text-primary mb-2 border-b pb-1">Reports</h4>
          {history.reports.length === 0 ? (
            <p className="text-sm text-text-secondary">No reports available.</p>
          ) : (
            <div className="space-y-2">
              {history.reports.map(r => (
                <div key={r._id} className="text-sm flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span>{r.title}</span>
                  {r.fileUrl && (
                    <a 
                      href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/reports/${r._id}/download`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-brand-primary hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPanel;
