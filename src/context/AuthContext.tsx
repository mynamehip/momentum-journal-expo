
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  goToLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  continueAsGuest: () => {},
  logout: async () => {},
  goToLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setIsGuest(true);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const goToLogin = () => {
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, continueAsGuest, logout, goToLogin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
