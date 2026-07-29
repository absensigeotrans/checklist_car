"use client";

import type { InspectionRecord } from "@/types";

interface AdminMetricsProps {
  records: InspectionRecord[];
}

export default function AdminMetrics({ records }: AdminMetricsProps) {
  const total = records.length;
  const uniquePlates = new Set(records.map((r) => r.vehicle?.licensePlate).filter(Boolean)).size;
  const defective = records.filter((r) => r.attentionNeeded).length;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
      <div className="bg-white rounded-[12px] p-6 border border-border flex flex-col gap-2">
        <h3 className="text-xs font-bold text-text-muted uppercase">Total Pemeriksaan</h3>
        <div className="text-3xl font-bold text-primary-blue">{total}</div>
      </div>
      <div className="bg-white rounded-[12px] p-6 border border-border flex flex-col gap-2">
        <h3 className="text-xs font-bold text-text-muted uppercase">Kendaraan Aktif</h3>
        <div className="text-3xl font-bold text-primary-green">{uniquePlates}</div>
      </div>
      <div className="bg-white rounded-[12px] p-6 border border-border flex flex-col gap-2">
        <h3 className="text-xs font-bold text-text-muted uppercase">Butuh Perhatian</h3>
        <div className="text-3xl font-bold text-primary-red">{defective}</div>
      </div>
    </div>
  );
}
