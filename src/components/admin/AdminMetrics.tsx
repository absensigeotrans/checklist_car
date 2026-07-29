"use client";

import type { InspectionRecord, DriverLogEntry } from "@/types";

interface AdminMetricsProps {
  records: InspectionRecord[];
  driverLogs: DriverLogEntry[];
}

export default function AdminMetrics({ records, driverLogs }: AdminMetricsProps) {
  const totalInspections = records.length;
  const defective = records.filter((r) => r.attentionNeeded).length;

  const totalTimesheets = driverLogs.length;
  const totalKm = driverLogs.reduce((sum, l) => sum + Math.max(0, l.kmEnd - l.kmStart), 0);
  const signedCount = driverLogs.filter((l) => Boolean(l.userSignature)).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-md:gap-2.5 mb-6">
      {/* 1. Checklist Kendaraan */}
      <div className="bg-white rounded-[16px] p-4 max-md:p-3.5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5">
        <div className="text-2xl w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100 font-bold shadow-xs">
          🔍
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
            Checklist Kendaraan
          </h3>
          <div className="text-xl max-md:text-lg font-black text-text-main mt-0.5">
            {totalInspections} <span className="text-xs font-semibold text-text-muted">Laporan</span>
          </div>
        </div>
      </div>

      {/* 2. Log Timesheet */}
      <div className="bg-white rounded-[16px] p-4 max-md:p-3.5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5">
        <div className="text-2xl w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold shadow-xs">
          📋
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
            Log Timesheet
          </h3>
          <div className="text-xl max-md:text-lg font-black text-text-main mt-0.5">
            {totalTimesheets} <span className="text-xs font-semibold text-text-muted">Entri</span>
          </div>
        </div>
      </div>

      {/* 3. TTD Verified */}
      <div className="bg-white rounded-[16px] p-4 max-md:p-3.5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5">
        <div className="text-2xl w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-purple-50 text-purple-600 border border-purple-100 font-bold shadow-xs">
          ✍️
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
            TTD Verified
          </h3>
          <div className="text-xl max-md:text-lg font-black text-purple-700 mt-0.5">
            {signedCount} <span className="text-xs font-semibold text-text-muted">Driver</span>
          </div>
        </div>
      </div>

      {/* 4. Total Jarak Fleet */}
      <div className="bg-white rounded-[16px] p-4 max-md:p-3.5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5">
        <div className="text-2xl w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 border border-amber-100 font-bold shadow-xs">
          📍
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
            Total Jarak Fleet
          </h3>
          <div className="text-xl max-md:text-lg font-black text-text-main mt-0.5">
            {totalKm.toLocaleString()} <span className="text-xs font-semibold text-text-muted">KM</span>
          </div>
        </div>
      </div>

      {/* 5. Temuan Kerusakan */}
      <div className="bg-white rounded-[16px] p-4 max-md:p-3.5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5 col-span-2 sm:col-span-1">
        <div
          className={`text-2xl w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 font-bold shadow-xs ${
            defective > 0
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}
        >
          {defective > 0 ? "⚠️" : "✓"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider truncate">
            Temuan Kerusakan
          </h3>
          <div
            className={`text-xl max-md:text-lg font-black mt-0.5 ${
              defective > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {defective} <span className="text-xs font-semibold text-text-muted">Kasus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
