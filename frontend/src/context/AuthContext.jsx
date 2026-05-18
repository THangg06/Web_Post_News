import { createContext, useState, useEffect, useCallback } from "react";
import { getCurrentUser, setCurrentUser, clearCurrentUser } from "../services/auth";
import { getCurrentUserFromServer } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const syncUser = useCallback(async () => {
    try {
      // Try to get user from server session first
      const serverUser = await getCurrentUserFromServer();
      if (serverUser) {
        setCurrentUser(serverUser);
        setCurrentUserState(serverUser);
        setIsLoggedIn(true);
      } else {
        // Fall back to localStorage
        const localUser = getCurrentUser();
        if (localUser) {
          setCurrentUserState(localUser);
          setIsLoggedIn(true);
        } else {
          setCurrentUserState(null);
          setIsLoggedIn(false);
        }
      }
    } catch (e) {
      // Fall back to localStorage if server request fails
      const localUser = getCurrentUser();
      if (localUser) {
        setCurrentUserState(localUser);
        setIsLoggedIn(true);
      } else {
        setCurrentUserState(null);
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const logout = useCallback(() => {
    clearCurrentUser();
    setCurrentUserState(null);
    setIsLoggedIn(false);
  }, []);

  const login = useCallback((user) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    setIsLoggedIn(true);
  }, []);

  const value = {
    currentUser,
    isLoggedIn,
    loading,
    logout,
    login,
    syncUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
