export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error("localStorage write error (quota exceeded?)");
    return false;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function safeSessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getStoredNik(): string {
  const saved = safeLocalStorageGet("ptk_active_driver_nik");
  if (saved && typeof saved === "string") {
    return saved.replace(/"/g, "").trim();
  }
  return "";
}

export function setStoredNik(nik: string): void {
  safeLocalStorageSet("ptk_active_driver_nik", nik);
}

export function getStoredDriverName(): string {
  const saved = safeLocalStorageGet("ptk_active_driver_name");
  if (saved && typeof saved === "string") {
    return saved.replace(/"/g, "").trim();
  }
  return "";
}

export function setStoredDriverName(name: string): void {
  safeLocalStorageSet("ptk_active_driver_name", name);
}

export interface RegisteredDriver {
  name: string;
  nik: string;
}

export function getRegisteredDrivers(): RegisteredDriver[] {
  const raw = safeLocalStorageGet("ptk_registered_drivers");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function registerDriverProfile(name: string, nik: string): void {
  const drivers = getRegisteredDrivers();
  const existingIdx = drivers.findIndex(
    (d) => d.nik.toLowerCase() === nik.toLowerCase()
  );
  if (existingIdx >= 0) {
    drivers[existingIdx] = { name, nik };
  } else {
    drivers.unshift({ name, nik });
  }
  safeLocalStorageSet("ptk_registered_drivers", drivers);
}


