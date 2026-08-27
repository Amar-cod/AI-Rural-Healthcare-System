import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-accent-soft-blue p-8">
      <div className="max-w-4xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Patient Dashboard</h1>
        <p className="mb-4">Welcome, {user?.name}</p>
        <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md">Logout</button>
      </div>
    </div>
  );
};

export default PatientDashboard;
