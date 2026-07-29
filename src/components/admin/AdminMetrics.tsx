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
  const totalKm = driverLogs.reduce((sum, l) => sum + (l.kmEnd - l.kmStart), 0);
  const signedCount = driverLogs.filter((l) => Boolean(l.userSignature)).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-md:gap-2.5 mb-6">
      <div className="bg-white rounded-[16px] p-4 max-md:p-3 border border-border shadow-sm flex items-center gap-3 hover:-translate-y-[2px] transition-all">
        <div className="text-3xl w-[50px] h-[50px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-blue-100 text-primary-blue font-bold">
          🔍
        </div>
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase">Checklist Kendaraan</h3>
          <div className="text-2xl font-bold text-primary-blue">{totalInspections} Laporan</div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] transition-all">
        <div className="text-3xl w-[50px] h-[50px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-green-100 text-primary-green font-bold">
          📋
        </div>
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase">Log Timesheet</h3>
          <div className="text-2xl font-bold text-primary-green">{totalTimesheets} Entri</div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] transition-all">
        <div className="text-3xl w-[50px] h-[50px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600 font-bold">
          ✍️
        </div>
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase">TTD Timesheet</h3>
          <div className="text-2xl font-bold text-purple-600">{signedCount} Terverifikasi</div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] transition-all">
        <div className="text-3xl w-[50px] h-[50px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-yellow-100 text-yellow-700 font-bold">
          📍
        </div>
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase">Total Jarak Fleet</h3>
          <div className="text-2xl font-bold text-text-main">{totalKm.toLocaleString()} KM</div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] transition-all">
        <div className={`text-3xl w-[50px] h-[50px] rounded-[12px] flex items-center justify-center flex-shrink-0 font-bold ${defective > 0 ? "bg-red-100 text-primary-red" : "bg-green-100 text-primary-green"}`}>
          {defective > 0 ? "⚠️" : "✓"}
        </div>
        <div>
          <h3 className="text-xs font-bold text-text-muted uppercase">Temuan Kerusakan</h3>
          <div className={`text-2xl font-bold ${defective > 0 ? "text-primary-red" : "text-primary-green"}`}>
            {defective} Kasus
          </div>
        </div>
      </div>
    </div>
  );
}
