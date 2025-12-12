import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-crypto-darker">
          <Navbar />
          
          {/* Main Content with responsive padding to account for navbar */}
          <main className="pt-16 sm:pt-20">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <UserDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute adminOnly>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>

          {/* Toast Notifications - Responsive positioning and styling */}
          <Toaster
            position="top-right"
            containerClassName="toast-container"
            toastOptions={{
              duration: 3000,
              // Responsive toast styling
              style: {
                background: '#0a0e27',
                color: '#fff',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem', // 14px
                padding: '0.75rem 1rem',
                maxWidth: '90vw', // Prevent overflow on mobile
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              },
              // Success toast theme
              success: {
                duration: 2500,
                style: {
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(135deg, #0a0e27 0%, #0f1629 100%)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              // Error toast theme
              error: {
                duration: 4000,
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'linear-gradient(135deg, #0a0e27 0%, #1a0f15 100%)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              // Loading toast theme
              loading: {
                style: {
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
              },
            }}
            // Mobile-specific container styles
            containerStyle={{
              top: 'env(safe-area-inset-top, 1rem)',
              right: 'env(safe-area-inset-right, 1rem)',
              bottom: 'env(safe-area-inset-bottom, 1rem)',
              left: 'env(safe-area-inset-left, 1rem)',
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
