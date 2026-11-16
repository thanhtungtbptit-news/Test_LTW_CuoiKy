import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [token, setToken] = useLocalStorage('token', null);

  const loginUser = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    window.localStorage.setItem('token', jwtToken);
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);