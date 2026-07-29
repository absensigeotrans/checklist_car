export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error("localStorage write error (quota exceeded?)");
    return false;
  }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemove(key: string): void {
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

