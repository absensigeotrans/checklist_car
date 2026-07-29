"use client";

import { useState, useEffect, useCallback } from "react";
import type { InspectionRecord } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
} from "@/lib/storage";

const STORAGE_KEY = "ptk_inspections";

export function useInspections() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = safeLocalStorageGet(STORAGE_KEY);
    let local: InspectionRecord[] = [];
    if (stored) {
      try {
        local = JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    setRecords(local);
    setLoading(false);

    if (isSupabaseConfigured()) {
      fetchFromSupabase().then((serverRecords) => {
        if (serverRecords.length > 0) {
          const serverIds = new Set(serverRecords.map((r) => r.inspectionId));
          const unsynced = local.filter((r) => !serverIds.has(r.inspectionId));
          const merged = [...unsynced, ...serverRecords];
          setRecords(merged);
          safeLocalStorageSet(STORAGE_KEY, merged);
        }
      });
    }
  }, []);

  const fetchFromSupabase = async (): Promise<InspectionRecord[]> => {
    if (!supabase) return [];
    try {
      const { data } = await supabase
        .from("inspections")
        .select("*")
        .order("inspection_date", { ascending: false });
      if (!data) return [];
      return data.map(mapRowToRecord);
    } catch {
      return [];
    }
  };

  const addRecord = useCallback(
    async (record: InspectionRecord) => {
      const updated = [record, ...records];
      setRecords(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase.from("inspections").insert({
            id: record.inspectionId,
            inspection_date: record.inspectionDate,
            driver_name: record.driver.nik
              ? `${record.driver.name} (NIK: ${record.driver.nik})`
              : record.driver.name,
            driver_nik: record.driver.nik,
            vehicle_type: record.vehicle.type,
            license_plate: record.vehicle.licensePlate,
            mileage_start: record.vehicle.mileageStart,
            mileage_end: record.vehicle.mileageEnd,
            fuel_level: record.condition.fuelLevel,
            notes: record.condition.notes,
            checklist: record.checklist,
            damages: record.condition.damages,
            signature: record.signature,
            attention_needed: record.attentionNeeded,
          });
        } catch (err) {
          console.error("Gagal sinkronisasi ke Supabase:", err);
        }
      }
    },
    [records]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      const updated = records.filter((r) => r.inspectionId !== id);
      setRecords(updated);
      safeLocalStorageSet(STORAGE_KEY, updated);
      if (supabase) {
        try {
          await supabase.from("inspections").delete().eq("id", id);
        } catch (err) {
          console.error("Gagal hapus dari Supabase:", err);
        }
      }
    },
    [records]
  );

  const clearAll = useCallback(async () => {
    setRecords([]);
    safeLocalStorageSet(STORAGE_KEY, []);
    if (supabase) {
      try {
        await supabase.from("inspections").delete().not("id", "is", null);
      } catch (err) {
        console.error("Gagal clear dari Supabase:", err);
      }
    }
  }, []);

  return { records, loading, addRecord, deleteRecord, clearAll };
}

function mapRowToRecord(row: any): InspectionRecord {
  let name = row.driver_name || "";
  let nik = row.driver_nik || "";
  const match = name.match(/^(.+) \(NIK: (.+)\)$/);
  if (match) {
    name = match[1].trim();
    nik = match[2].trim();
  }
  return {
    inspectionId: row.id,
    inspectionDate: row.inspection_date,
    driver: { name, nik },
    vehicle: {
      type: row.vehicle_type || "",
      licensePlate: row.license_plate || "",
      mileageStart: row.mileage_start || 0,
      mileageEnd: row.mileage_end || 0,
    },
    checklist: row.checklist || {},
    condition: {
      damages: row.damages || [],
      fuelLevel: row.fuel_level || 50,
      notes: row.notes || ["", "", ""],
    },
    signature: row.signature || "",
    attentionNeeded: row.attention_needed || false,
  };
}
