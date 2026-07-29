"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { UserRole } from "@/types";
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  safeSessionGet,
  safeSessionSet,
  safeSessionRemove,
  getStoredNik,
  setStoredNik,
  getStoredDriverName,
  setStoredDriverName,
} from "@/lib/storage";
import { simpleHash } from "@/lib/utils";
import { ADMIN_PIN_HASH } from "@/types";

interface AuthContextType {
  role: UserRole;
  nik: string;
  driverName: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  selectRole: (role: UserRole) => void;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  setDriverNik: (nik: string, name?: string) => void;
  setDriverProfile: (name: string, nik: string) => void;
  switchDriverNik: () => void;
  clearDriverNik: () => void;
  toggleRolePortal: () => void;
  showRolePortal: boolean;
  setShowRolePortal: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [nik, setNik] = useState("");
  const [driverName, setDriverName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRolePortal, setShowRolePortal] = useState(true);

  useEffect(() => {
    const storedRole = safeLocalStorageGet("ptk_user_role");
    const parsedRole =
      storedRole && typeof storedRole === "string"
        ? (storedRole.replace(/"/g, "") as UserRole)
        : null;
    const adminAuth = safeSessionGet("ptk_admin_auth") === "true";
    const storedNik = getStoredNik();
    const storedName = getStoredDriverName();

    if (parsedRole) setRole(parsedRole);
    if (storedNik) setNik(storedNik);
    if (storedName) setDriverName(storedName);

    if (adminAuth) {
      setIsAdmin(true);
      setShowRolePortal(false);
    } else if (parsedRole === "driver") {
      setShowRolePortal(false);
    }
  }, []);

  const selectRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
    safeLocalStorageSet("ptk_user_role", newRole);
    if (newRole === "driver") {
      const savedNik = getStoredNik();
      const savedName = getStoredDriverName();
      if (!savedNik && !savedName) {
        setShowRolePortal(true);
      } else {
        if (savedNik) setNik(savedNik);
        if (savedName) setDriverName(savedName);
        setShowRolePortal(false);
      }
    }
  }, []);

  const loginAdmin = useCallback((pin: string) => {
    if (simpleHash(pin) === ADMIN_PIN_HASH) {
      setIsAdmin(true);
      setRole("admin");
      safeSessionSet("ptk_admin_auth", "true");
      safeLocalStorageSet("ptk_user_role", "admin");
      setShowRolePortal(false);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    setRole(null);
    safeSessionRemove("ptk_admin_auth");
    safeLocalStorageRemove("ptk_user_role");
    setShowRolePortal(true);
  }, []);

  const setDriverProfile = useCallback((name: string, newNik: string) => {
    setDriverName(name);
    setNik(newNik);
    setStoredDriverName(name);
    setStoredNik(newNik);
    setRole("driver");
    safeLocalStorageSet("ptk_user_role", "driver");
    setShowRolePortal(false);
  }, []);

  const setDriverNik = useCallback(
    (newNik: string, name?: string) => {
      setDriverProfile(name || driverName, newNik);
    },
    [driverName, setDriverProfile]
  );

  const switchDriverNik = useCallback(() => {
    setNik("");
    setDriverName("");
    setStoredNik("");
    setStoredDriverName("");
    setShowRolePortal(true);
  }, []);

  const clearDriverNik = useCallback(() => {
    setNik("");
    setDriverName("");
    setStoredNik("");
    setStoredDriverName("");
  }, []);

  const toggleRolePortal = useCallback(() => {
    setShowRolePortal(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        nik,
        driverName,
        isAdmin,
        isAuthenticated: isAdmin || !!nik,
        selectRole,
        loginAdmin,
        logoutAdmin,
        setDriverNik,
        setDriverProfile,
        switchDriverNik,
        clearDriverNik,
        toggleRolePortal,
        showRolePortal,
        setShowRolePortal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
