import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartbank_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('smartbank_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('smartbank_access_token');
    const storedUser = localStorage.getItem('smartbank_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setAccessToken(token);
    } else {
      setUser(null);
      setAccessToken(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await apiClient.post('/auth/login/', { username, password });
    const { access, refresh, user: userData } = response.data;

    localStorage.setItem('smartbank_access_token', access);
    localStorage.setItem('smartbank_refresh_token', refresh);
    localStorage.setItem('smartbank_user', JSON.stringify(userData));

    setAccessToken(access);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const response = await apiClient.post('/auth/register/', formData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('smartbank_access_token');
    localStorage.removeItem('smartbank_refresh_token');
    localStorage.removeItem('smartbank_user');
    setUser(null);
    setAccessToken(null);
    window.location.href = '/login';
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('smartbank_user', JSON.stringify(newUserData));
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF' || isAdmin;
  const isCustomer = role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        role,
        isAdmin,
        isStaff,
        isCustomer,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
