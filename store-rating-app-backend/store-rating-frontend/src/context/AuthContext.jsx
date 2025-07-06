import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (token) {
      // Extract role from token (assuming JWT payload contains role)
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);
    } else {
      setRole(null);
    }
  }, [token]);

  function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
