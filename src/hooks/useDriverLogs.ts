"use client";

import { useState, useEffect, useCallback } from "react";
import type { DriverLogEntry } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
} from "@/lib/storage";

const STORAGE_KEY = "ptk_driver_logs";

export function useDriverLogs() {
  const [logs, setLogs] = useState<DriverLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = safeLocalStorageGet(STORAGE_KEY);
    let localLogs: DriverLogEntry[] = [];
    if (stored) {
      try {
        localLogs = JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    setLogs(localLogs);
    setLoading(false);

    if (isSupabaseConfigured()) {
      fetchFromSupabase().then((serverLogs) => {
        if (serverLogs.length > 0) {
          const localIds = new Set(localLogs.map((l) => l.logId));
          const unsynced = localLogs.filter((l) => !localIds.has(l.logId));
          const merged = [...unsynced, ...serverLogs];
          setLogs(merged);
          safeLocalStorageSet(STORAGE_KEY, merged);
        }
      });
    }
  }, []);

  const fetchFromSupabase = async (): Promise<DriverLogEntry[]> => {
    if (!supabase) return [];
    try {
      const { data } = await supabase
        .from("driver_logs")
        .select("*")
        .order("log_date", { ascending: false });
      if (!data) return [];
      return data.map(mapRowToLog);
    } catch {
      return [];
    }
  };

  const addLog = useCallback(
    async (entry: DriverLogEntry) => {
      const updated = [entry, ...logs];
      setLogs(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase.from("driver_logs").insert({
            id: entry.logId,
            driver_name: entry.driverName,
            driver_nik: entry.driverNik,
            license_plate: entry.licensePlate,
            log_date: entry.logDate,
            log_day: entry.logDay,
            work_start: entry.workStart,
            work_end: entry.workEnd,
            km_start: entry.kmStart,
            km_end: entry.kmEnd,
            user_name: entry.userName,
            user_signature: entry.userSignature,
            remark: entry.remark,
          });
        } catch (err) {
          console.error("Gagal sinkronisasi log ke Supabase:", err);
        }
      }
    },
    [logs]
  );

  const updateLog = useCallback(
    async (entry: DriverLogEntry) => {
      const updated = logs.map((l) => (l.logId === entry.logId ? entry : l));
      setLogs(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase
            .from("driver_logs")
            .update({
              driver_name: entry.driverName,
              driver_nik: entry.driverNik,
              license_plate: entry.licensePlate,
              log_date: entry.logDate,
              log_day: entry.logDay,
              work_start: entry.workStart,
              work_end: entry.workEnd,
              km_start: entry.kmStart,
              km_end: entry.kmEnd,
              user_name: entry.userName,
              user_signature: entry.userSignature,
              remark: entry.remark,
            })
            .eq("id", entry.logId);
        } catch (err) {
          console.error("Gagal update log di Supabase:", err);
        }
      }
    },
    [logs]
  );

  const deleteLog = useCallback(
    async (logId: string) => {
      const updated = logs.filter((l) => l.logId !== logId);
      setLogs(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase.from("driver_logs").delete().eq("id", logId);
        } catch (err) {
          console.error("Gagal hapus log dari Supabase:", err);
        }
      }
    },
    [logs]
  );

  const deleteByNik = useCallback(
    async (nik: string) => {
      const updated = logs.filter((l) => l.driverNik !== nik);
      setLogs(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase
            .from("driver_logs")
            .delete()
            .eq("driver_nik", nik);
        } catch (err) {
          console.error("Gagal hapus log driver dari Supabase:", err);
        }
      }
    },
    [logs]
  );

  const clearAll = useCallback(async () => {
    setLogs([]);
    safeLocalStorageSet(STORAGE_KEY, []);
    if (supabase) {
      try {
        await supabase.from("driver_logs").delete().not("id", "is", null);
      } catch (err) {
        console.error("Gagal clear log dari Supabase:", err);
      }
    }
  }, []);

  return {
    logs,
    loading,
    addLog,
    updateLog,
    deleteLog,
    deleteByNik,
    clearAll,
  };
}

function mapRowToLog(row: any): DriverLogEntry {
  return {
    logId: row.id,
    driverName: row.driver_name || "",
    driverNik: row.driver_nik || "",
    licensePlate: row.license_plate || "",
    logDate: row.log_date || "",
    logDay: row.log_day || "",
    workStart: row.work_start || "",
    workEnd: row.work_end || "",
    kmStart: row.km_start || 0,
    kmEnd: row.km_end || 0,
    userName: row.user_name || "",
    userSignature: row.user_signature || "",
    remark: row.remark || "",
  };
}
