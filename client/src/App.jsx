import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './features/auth/Login';
import Register from './features/auth/Register';
import PatientDashboard from './features/patient/Dashboard';
import FindDoctor from './features/patient/FindDoctor';
import AIAssistant from './features/patient/AIAssistant';
import DoctorDashboard from './features/doctor/Dashboard';
import AdminDashboard from './features/admin/Dashboard';
import TelemedicineRoom from './features/telemedicine/TelemedicineRoom';
import MedicineRequest from './features/patient/MedicineRequest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>} />

          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/find-doctor" element={<FindDoctor />} />
            <Route path="/patient/ai-assistant" element={<AIAssistant />} />
            <Route path="/patient/telemedicine/:id" element={<TelemedicineRoom />} />
            <Route path="/patient/medicine-request" element={<MedicineRequest />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/telemedicine/:id" element={<TelemedicineRoom />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
