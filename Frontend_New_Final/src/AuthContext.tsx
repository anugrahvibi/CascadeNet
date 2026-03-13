import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export type Role = 'Dam Controller' | 'NDRF' | 'District Collector' | 'Highway Department' | 'Developer' | 'Public' | null;

interface AuthContextType {
  role: Role;
  phoneNumber: string | null;
  login: (role?: Role, phone?: string) => Role;
  logout: () => void;
  setRoleDirectly: (role: Role) => void;
  simulationMode: 'NORMAL' | 'FLOOD';
  toggleSimulation: () => void;
  affectedZone: string;
  setAffectedZone: (zone: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    return localStorage.getItem('cascade_role') as Role || null;
  });
  const [phoneNumber, setPhoneNumber] = useState<string | null>(() => {
    return localStorage.getItem('cascade_phone') || null;
  });
  const navigate = useNavigate();

  const login = (r?: Role, phone?: string): Role => {
    // Determine the role to login with
    const registeredRole = localStorage.getItem('registered_role') as Role;

    // If no role is provided at login, use the registered one
    const loginRole = r || registeredRole || 'Public';

    setRole(loginRole);
    localStorage.setItem('cascade_role', loginRole || '');

    if (phone) {
      setPhoneNumber(phone);
      localStorage.setItem('cascade_phone', phone);
    }

    if (!registeredRole && loginRole) {
      localStorage.setItem('registered_role', loginRole);
    }
    return loginRole;
  };

  const [simulationMode, setSimulationMode] = useState<'NORMAL' | 'FLOOD'>('NORMAL');
  const [affectedZone, setAffectedZone] = useState<string>('All Zones');

  const setRoleDirectly = (r: Role) => {
    setRole(r);
    if (r) localStorage.setItem('cascade_role', r);
    else localStorage.removeItem('cascade_role');
  };

  const toggleSimulation = () => {
    setSimulationMode(prev => prev === 'NORMAL' ? 'FLOOD' : 'NORMAL');
  };

  const logout = () => {
    setRole(null);
    setPhoneNumber(null);
    localStorage.removeItem('cascade_role');
    localStorage.removeItem('cascade_phone');
    navigate('/', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ role, phoneNumber, login, logout, setRoleDirectly, simulationMode, toggleSimulation, affectedZone, setAffectedZone }}>
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
