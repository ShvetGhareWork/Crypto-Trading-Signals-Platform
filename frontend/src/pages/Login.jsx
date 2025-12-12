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
      // Call login and get user data back
      const userData = await login(email, password);
      
      // Navigate based on role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error toast is already shown in AuthContext
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-crypto-accent to-crypto-gold rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl sm:text-3xl">₿</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-400">Sign in to access your trading signals</p>
        </div>

        {/* Demo Credentials */}
        <div className="card mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-400 mb-3">Quick Demo Login:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 bg-crypto-gold/10 hover:bg-crypto-gold/20 text-crypto-gold text-xs sm:text-sm py-2 px-3 rounded-lg transition-colors font-medium"
            >
              👑 Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user')}
              className="flex-1 bg-crypto-accent/10 hover:bg-crypto-accent/20 text-crypto-accent text-xs sm:text-sm py-2 px-3 rounded-lg transition-colors font-medium"
            >
              👤 User Demo
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card space-y-5 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field text-sm sm:text-base"
              placeholder="admin@cryptosignals.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field text-sm sm:text-base"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-crypto-accent hover:text-crypto-accent-dark font-medium">
              Sign up
            </Link>
          </p>
        </form>

        {/* Info Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Use demo credentials above for quick testing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
