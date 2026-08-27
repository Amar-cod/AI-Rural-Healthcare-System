import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(formData);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary items-center justify-center p-8">
      <div className="bg-bg-card p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-text-primary">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">I am a</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-border-color rounded-md p-2">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-border-color rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-border-color rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-border-color rounded-md p-2" required />
          </div>
          <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-secondary transition">Register</button>
        </form>
        <div className="mt-4 text-center">
            <a href="/login" className="text-brand-primary text-sm">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
