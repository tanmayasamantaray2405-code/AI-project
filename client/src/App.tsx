import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [page, setPage] = useState<string>('landing');
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth state and theme from local storage on boot
  useEffect(() => {
    // Apply saved theme immediately to prevent flicker
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
      document.documentElement.classList.add('dark');
    } else if (darkMode === 'false') {
      document.documentElement.classList.remove('dark');
    } else {
      // Default: check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }

    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        setPage('dashboard');
      } catch {
        // Corrupt localStorage data — clear it
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
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
