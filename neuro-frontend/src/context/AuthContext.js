import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:8080';

  // Initialize state from localStorage on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Add axios request interceptor to ensure Authorization header is always included
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers['Authorization'] = `Bearer ${currentToken}`;
        } else {
          console.warn('⚠️ No authentication token found in localStorage');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add axios response interceptor to handle 401 errors globally
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.error('🔒 Authentication failed (401). Token may have expired. Logging out...');
          // Auto-logout on 401 to clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          // Redirect to login page
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );

    setLoading(false);

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { 
        email, 
        password, 
        role 
      });
      
      const { token, id, username, email: userEmail, role: userRole } = response.data;
      const userData = { id, username, email: userEmail, role: userRole };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      await axios.post('http://localhost:8080/api/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      return { success: true };
    } catch (error) {
      console.error("Registration failed", error);
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, token: localStorage.getItem('token') }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};
