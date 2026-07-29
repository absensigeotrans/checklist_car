"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getRegisteredDrivers,
  safeLocalStorageSet,
  type RegisteredDriver,
} from "@/lib/storage";

const LS_KEY = "ptk_registered_drivers";

export function useRegisteredDrivers() {
  const [drivers, setDrivers] = useState<RegisteredDriver[]>(() =>
    getRegisteredDrivers()
  );

  // On mount: fetch from Supabase and merge with localStorage
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("registered_drivers")
      .select("name, nik")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        const serverDrivers: RegisteredDriver[] = data.map((r: any) => ({
          name: r.name,
          nik: r.nik,
        }));
        // Merge: server is source of truth, add local-only entries too
        const localDrivers = getRegisteredDrivers();
        const serverNiks = new Set(serverDrivers.map((d) => d.nik));
        const localOnly = localDrivers.filter((d) => !serverNiks.has(d.nik));
        const merged = [...serverDrivers, ...localOnly];
        setDrivers(merged);
        safeLocalStorageSet(LS_KEY, merged);
      });
  }, []);

  // Register a driver — syncs to Supabase
  const registerDriver = useCallback(
    async (name: string, nik: string): Promise<void> => {
      // Update local state & localStorage immediately
      setDrivers((prev) => {
        const existingIdx = prev.findIndex(
          (d) => d.nik.toLowerCase() === nik.toLowerCase()
        );
        let updated: RegisteredDriver[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = { name, nik };
        } else {
          updated = [{ name, nik }, ...prev];
        }
        safeLocalStorageSet(LS_KEY, updated);
        return updated;
      });

      // Sync to Supabase
      if (supabase) {
        try {
          await supabase
            .from("registered_drivers")
            .upsert({ name, nik }, { onConflict: "nik" });
        } catch (err) {
          console.error("Failed to sync driver registration to Supabase:", err);
        }
      }
    },
    []
  );

  // Delete a driver account — syncs to Supabase
  const deleteDriver = useCallback(async (nik: string): Promise<void> => {
    setDrivers((prev) => {
      const updated = prev.filter((d) => d.nik !== nik);
      safeLocalStorageSet(LS_KEY, updated);
      return updated;
    });

    if (supabase) {
      try {
        await supabase.from("registered_drivers").delete().eq("nik", nik);
      } catch (err) {
        console.error("Failed to delete driver from Supabase:", err);
      }
    }
  }, []);

  return { drivers, registerDriver, deleteDriver };
}
