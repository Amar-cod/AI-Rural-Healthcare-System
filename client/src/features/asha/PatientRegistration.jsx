import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { queueOfflineRequest } from './offlineQueue';
import CameraCapture from './CameraCapture';
import ReportUpload from './ReportUpload';

const PatientRegistration = ({ villageId, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    symptoms: '',
    observations: ''
  });
  
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple debounced duplicate check
  useEffect(() => {
    if (formData.phone.length === 10 && navigator.onLine) {
      const checkDuplicate = async () => {
        try {
          // A quick hack for checking duplicates: fetch village patients and match.
          // Or make a generic search API. Let's just fetch village patients and filter.
          const res = await api.get(`/asha/villages/${villageId}/patients`);
          const match = res.data.find(p => p.phone === formData.phone);
          if (match) setDuplicateMatch(match);
          else setDuplicateMatch(null);
        } catch (err) {
          console.error(err);
        }
      };
      checkDuplicate();
    } else {
      setDuplicateMatch(null);
    }
  }, [formData.phone, villageId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      villageId,
      ...formData,
      symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (navigator.onLine) {
        const res = await api.post('/asha/patients', payload);
        const patientId = res.data.patient._id;

        if (photoBlob) {
          const pData = new FormData();
          pData.append('photo', photoBlob, 'photo.jpg');
          await api.post(`/asha/patients/${patientId}/photo`, pData);
        }
        if (reportFile) {
          const rData = new FormData();
          rData.append('report', reportFile);
          await api.post(`/asha/patients/${patientId}/report`, rData);
        }
        alert('Patient registered successfully!');
      } else {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await queueOfflineRequest({
          url: '/asha/patients',
          method: 'POST',
          data: payload,
          tempId: tempId
        });

        if (photoBlob) {
          const pData = new FormData();
          pData.append('photo', photoBlob, 'photo.jpg');
          await queueOfflineRequest({
            url: `/asha/patients/${tempId}/photo`,
            method: 'POST',
            data: Object.fromEntries(pData.entries()),
            isFormData: true
          });
        }
        
        if (reportFile) {
          const rData = new FormData();
          rData.append('report', reportFile);
          await queueOfflineRequest({
            url: `/asha/patients/${tempId}/report`,
            method: 'POST',
            data: Object.fromEntries(rData.entries()),
            isFormData: true
          });
        }
        
        alert('You are offline. Registration queued for sync!');
      }
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Register Resident</h2>
        <button onClick={onComplete} className="text-gray-500 hover:text-gray-700">✕ Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {duplicateMatch && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm">
            <strong>⚠️ Possible Match Found:</strong> A patient named <strong>{duplicateMatch.name}</strong> already exists with this phone number.
            Submitting this form will update their records.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" required className="border p-2 rounded-lg"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          
          <input type="tel" placeholder="Phone Number (10 digits)" required className="border p-2 rounded-lg"
            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />

          <input type="number" placeholder="Age" required className="border p-2 rounded-lg"
            value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />

          <select className="border p-2 rounded-lg" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <input type="text" placeholder="Symptoms (comma separated, e.g., fever, cough)" className="border p-2 rounded-lg w-full"
            value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} />
        </div>

        <div>
          <textarea placeholder="Observations..." className="border p-2 rounded-lg w-full h-24"
            value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-dashed border-gray-300 p-4 rounded-lg">
            <h3 className="font-bold text-sm text-gray-600 mb-2">Capture Photo</h3>
            <CameraCapture onCapture={(blob) => setPhotoBlob(blob)} />
            {photoBlob && <p className="text-xs text-green-600 mt-2">✓ Photo attached</p>}
          </div>

          <div className="border border-dashed border-gray-300 p-4 rounded-lg">
            <h3 className="font-bold text-sm text-gray-600 mb-2">Upload Report (PDF/Img)</h3>
            <ReportUpload onFileSelect={(file) => setReportFile(file)} />
            {reportFile && <p className="text-xs text-green-600 mt-2">✓ {reportFile.name}</p>}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-[#8B7FD1] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition">
          {isSubmitting ? 'Saving...' : 'Save Resident Record'}
        </button>
      </form>
    </div>
  );
};

export default PatientRegistration;
