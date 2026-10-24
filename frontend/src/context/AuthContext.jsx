import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getToken, setToken, removeToken, getUser, setUser, removeUser } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setCurrentUser] = useState(getUser());
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  // Sync profile on startup if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await api.getProfile();
          if (res?.data || res?.user) {
            const userData = res.data || res.user;
            setCurrentUser(userData);
            setUser(userData);
          }
        } catch {
          // If token is invalid or expired, reset
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res?.token && res?.user) {
      setToken(res.token);
      setUser(res.user);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      return res.user;
    }
    throw new Error("Respon login tidak valid");
  };

  const register = async (userData) => {
    return await api.register(userData);
  };

  const logout = () => {
    removeToken();
    removeUser();
    setAuthToken(null);
    setCurrentUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    if (res?.data || res?.user) {
      const updated = res.data || res.user;
      setUser(updated);
      setCurrentUser(updated);
      return updated;
    }
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        role: user?.role || "guest",
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
