import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@cryptosignals.com');
      setPassword('Admin@123');
    } else {
      setEmail('john@example.com');
      setPassword('User@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-crypto-darker px-4">
      <div className="max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 bg-gradient-to-br from-crypto-accent to-crypto-gold rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-3xl">₿</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to access your trading signals</p>
        </div>

        {/* Demo Credentials */}
        <div className="card mb-6">
          <p className="text-sm text-gray-400 mb-3">Quick Demo Login:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 bg-crypto-gold/10 hover:bg-crypto-gold/20 text-crypto-gold text-sm py-2 rounded-lg transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user')}
              className="flex-1 bg-crypto-accent/10 hover:bg-crypto-accent/20 text-crypto-accent text-sm py-2 rounded-lg transition-colors"
            >
              User Demo
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@cryptosignals.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-crypto-accent hover:text-crypto-accent-dark">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
