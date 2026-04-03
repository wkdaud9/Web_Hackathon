import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/models';
import { getUsers, addUser, updateUser as apiUpdateUser } from '../utils/api';

interface AuthContextType {
  currentUser: User | null;
  login: (loginId: string, password: string) => Promise<boolean>;
  register: (
    loginId: string,
    password: string,
    nickname: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (loginId: string, password: string) => {
    const users = getUsers();
    const user = users.find((u: User) => u.loginId === loginId && u.password === password);

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = async (
    loginId: string,
    password: string,
    nickname: string
  ) => {
    const users = getUsers();

    // Check if user already exists
    if (users.some((u: User) => u.loginId === loginId || u.nickname === nickname)) {
      return false;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      loginId,
      password,
      nickname,
      email: `${loginId}@example.com`,
      points: 0,
      createdAt: new Date().toISOString(),
      isProfilePublic: true,
      role: 'user'
    };

    addUser(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    apiUpdateUser(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
