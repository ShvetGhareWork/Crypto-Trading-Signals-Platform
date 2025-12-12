import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-crypto-accent to-crypto-gold rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">₿</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-crypto-accent to-crypto-gold bg-clip-text text-transparent hidden xs:inline">
              CryptoSignals
            </span>
            {/* Mobile short name */}
            <span className="text-lg font-bold bg-gradient-to-r from-crypto-accent to-crypto-gold bg-clip-text text-transparent xs:hidden">
              CS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="text-gray-300 hover:text-crypto-accent transition-colors text-sm lg:text-base"
                >
                  {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                </Link>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="text-gray-400 text-xs">Welcome,</p>
                    <p className="text-crypto-accent font-semibold">{user.name}</p>
                  </div>
                  
                  {isAdmin && (
                    <span className="badge bg-crypto-gold/20 text-crypto-gold text-xs">
                      ADMIN
                    </span>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-crypto-accent transition-colors text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-crypto-accent hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              // Close Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pt-2 pb-4 space-y-3 bg-crypto-darker/95 backdrop-blur-lg border-t border-white/5">
          {user ? (
            <>
              {/* User Info Card */}
              <div className="card py-3 px-4 bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Logged in as</p>
                    <p className="text-sm font-semibold text-crypto-accent">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <span className="badge bg-crypto-gold/20 text-crypto-gold text-xs">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>

              {/* Dashboard Link */}
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                onClick={closeMobileMenu}
                className="block w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-crypto-accent hover:bg-white/5 transition-all text-sm font-medium"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>{isAdmin ? 'Admin Dashboard' : 'Dashboard'}</span>
                </div>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 rounded-lg text-crypto-danger hover:bg-crypto-danger/10 transition-all text-sm font-medium"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Login Link */}
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="block w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-crypto-accent hover:bg-white/5 transition-all text-sm font-medium"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </div>
              </Link>
              
              {/* Register Button */}
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="block w-full btn-primary text-sm text-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
