import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios with baseURL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('intellimatch_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem('intellimatch_user', JSON.stringify(userData));
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const logout = () => {
    localStorage.removeItem('intellimatch_user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Where each role lands after signing in
export const homePathFor = (role) => {
  if (role === 'student') return '/student-dashboard';
  if (role === 'company') return '/company-dashboard';
  return '/admin-dashboard';
};
