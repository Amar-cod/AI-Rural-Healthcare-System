import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-accent-soft-green p-8">
      <div className="max-w-4xl mx-auto bg-bg-card p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Doctor Dashboard</h1>
        <p className="mb-4">Welcome, Dr. {user?.name}</p>
        <p className="text-sm text-text-secondary mb-4">Your verification status is currently pending.</p>
        <button onClick={logout} className="bg-danger text-white px-4 py-2 rounded-md">Logout</button>
      </div>
    </div>
  );
};

export default DoctorDashboard;
