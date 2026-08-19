import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAdmin } from './shared/context/AdminContext';

export default function App() {
  const { tokenHash, admin, isLoading, login, logout } = useAdmin();

  useEffect(() => {
    // Apply theme
    const theme = localStorage.getItem('adminTheme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
  }, []);

  if (isLoading) return null;
  const isAuthenticated = Boolean(tokenHash && admin);

  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={login} /> : <Navigate to="/" replace />}
        />
        <Route 
          path="/*" 
          element={isAuthenticated ? <Dashboard onLogout={logout} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
