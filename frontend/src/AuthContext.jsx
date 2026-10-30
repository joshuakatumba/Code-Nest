import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('codenest_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginUser = async (email, password) => {
    const result = await api.login({ email, password });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const signupUser = async (name, email, password) => {
    const result = await api.signup({ name, email, password });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        signupUser,
        logoutUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
