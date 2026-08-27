import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary">
      <div className="hidden md:flex md:w-1/2 bg-brand-primary items-center justify-center text-white p-12">
        <div>
          <h1 className="text-4xl font-bold mb-4">Rural Healthcare Continuity System</h1>
          <p className="text-lg">Connecting rural patients with verified doctors, providing AI triage, and ensuring continuous care.</p>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-bg-card p-8 rounded-2xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-text-primary">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border-color rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-border-color rounded-md p-2" required />
            </div>
            <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-brand-secondary transition">Login</button>
          </form>
          <div className="mt-4 text-center">
            <a href="/register" className="text-brand-primary text-sm">Need an account? Register here</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
