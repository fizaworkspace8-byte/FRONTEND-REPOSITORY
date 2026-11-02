import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken, setRefreshToken, clearAuthStorage } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  function login(newToken, newUser, refreshToken = null) {
    setAccessToken(newToken);
    setRefreshToken(refreshToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    await api
      .post('/auth/logout', { refreshToken, all: true })
      .catch(() => {});
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}