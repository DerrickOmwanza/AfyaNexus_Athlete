"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: "athlete" | "coach" | "nutritionist";
  specialization?: string | null;
  coach_id?: number | null;
  nutritionist_id?: number | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUserProfile: (nextUser: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  specialization?: string;
  coach_id?: number | null;
  nutritionist_id?: number | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("afyanexus_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string) => {
    const { data } = await api.post("/auth/login", { email, password, role });
    window.localStorage.setItem("afyanexus_token", data.token);
    window.localStorage.setItem("afyanexus_user", JSON.stringify(data.user));
    setUser(data.user);
    router.push(`/dashboard/${data.user.role}`);
  };

  const register = async (formData: RegisterData) => {
    await api.post("/auth/register", formData);
    router.push("/login?registered=true");
  };

  const logout = () => {
    window.localStorage.removeItem("afyanexus_token");
    window.localStorage.removeItem("afyanexus_user");
    setUser(null);
    router.push("/login");
  };

  const setUserProfile = (nextUser: User) => {
    window.localStorage.setItem("afyanexus_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
