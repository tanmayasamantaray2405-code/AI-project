import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [page, setPage] = useState<string>('landing');
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth state from local storage on boot
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setPage('dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setPage('landing');
  };

  const handleNavigate = (targetPage: string) => {
    if (targetPage === 'dashboard' && !token) {
      setPage('login');
    } else if (targetPage === 'login' && token) {
      setPage('dashboard');
    } else {
      setPage(targetPage);
    }
  };

  return (
    <>
      {page === 'landing' && (
        <LandingPage onNavigate={handleNavigate} isAuthenticated={!!token} />
      )}
      {page === 'login' && (
        <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      )}
      {page === 'dashboard' && user && (
        <DashboardPage user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
    </>
  );
}
