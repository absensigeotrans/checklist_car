"use client";

import type { InspectionRecord } from "@/types";
import { formatDateID, escapeHtml } from "@/lib/utils";

interface ChecklistLogsTableProps {
  records: InspectionRecord[];
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadPDF: (id: string) => void;
  onExportPDF: (id: string) => void;
}

export default function ChecklistLogsTable({
  records,
  onViewDetail,
  onDelete,
  onDownloadPDF,
  onExportPDF,
}: ChecklistLogsTableProps) {
  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-bg-sidebar/80 border-b border-border">
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                Tanggal & Waktu
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                Nama Driver
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                Nopol / Unit
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                Odometer (KM)
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                BBM
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                Kondisi Fisik
              </th>
              <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5 text-center">
                Aksi & Laporan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-text-muted px-4 py-12">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="font-semibold text-sm">Tidak ada data checklist ditemukan.</div>
                  <div className="text-xs text-text-muted mt-1">
                    Coba atur ulang kata kunci pencarian atau filter status.
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                let missingCount = 0;
                Object.values(rec.checklist || {}).forEach((i) => {
                  if (i && i.status === "TDK ADA") missingCount++;
                });
                const damagesCount = (rec.condition?.damages || []).length;
                let isIssue = Boolean(rec.attentionNeeded);
                const issueParts: string[] = [];
                if (missingCount > 0) issueParts.push(`${missingCount} Alat Absen`);
                if (damagesCount > 0) issueParts.push(`${damagesCount} Kerusakan Body`);
                const issueText = issueParts.join(", ") || (isIssue ? "Butuh Perhatian" : "Normal");

                const driverName = rec.driver?.name || "Driver";
                const initial = driverName.charAt(0).toUpperCase();
                const mileageDiff = (rec.vehicle?.mileageEnd || 0) - (rec.vehicle?.mileageStart || 0);

                return (
                  <tr key={rec.inspectionId} className="hover:bg-bg-sidebar/40 transition-colors">
                    {/* Tanggal */}
                    <td className="px-4 py-3.5 text-xs text-text-main font-medium whitespace-nowrap">
                      {formatDateID(rec.inspectionDate)}
                    </td>

                    {/* Nama Driver */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-primary-blue flex items-center justify-center font-extrabold text-xs shrink-0 border border-blue-200">
                          {initial}
                        </div>
                        <span className="font-bold text-xs text-text-main">
                          {escapeHtml(driverName)}
                        </span>
                      </div>
                    </td>

                    {/* Nopol */}
                    <td className="px-4 py-3.5">
                      <div className="inline-flex flex-col gap-0.5">
                        <span className="bg-slate-100 text-slate-800 font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] border border-slate-200 shadow-2xs">
                          {escapeHtml(rec.vehicle?.licensePlate) || "-"}
                        </span>
                        {rec.vehicle?.type && (
                          <span className="text-[10px] text-text-muted font-medium">
                            {escapeHtml(rec.vehicle.type)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Odometer */}
                    <td className="px-4 py-3.5 text-xs">
                      <div className="font-semibold text-text-main">
                        {(rec.vehicle?.mileageStart || 0).toLocaleString()} → {(rec.vehicle?.mileageEnd || 0).toLocaleString()} KM
                      </div>
                      <div className="text-[11px] text-primary-blue font-bold">
                        +{mileageDiff.toLocaleString()} KM
                      </div>
                    </td>

                    {/* BBM */}
                    <td className="px-4 py-3.5 text-xs font-bold text-text-main">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                          <div
                            className={`h-full ${
                              (rec.condition?.fuelLevel || 0) <= 25
                                ? "bg-rose-500"
                                : (rec.condition?.fuelLevel || 0) <= 50
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, rec.condition?.fuelLevel || 0))}%` }}
                          />
                        </div>
                        <span>{rec.condition?.fuelLevel || 0}%</span>
                      </div>
                    </td>

                    {/* Kondisi Fisik Status Badge */}
                    <td className="px-4 py-3.5">
                      {isIssue ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {issueText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                          ✓ Normal
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          title="Unduh File PDF Checklist"
                          className="bg-primary-blue text-white hover:bg-blue-700 px-2.5 py-1.5 rounded-[8px] font-semibold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                          onClick={() => onDownloadPDF(rec.inspectionId)}
                        >
                          <span>📥</span> Unduh
                        </button>

                        <button
                          type="button"
                          title="Lihat Detail Inspeksi & Cetak"
                          className="bg-bg-sidebar text-text-muted hover:bg-border hover:text-text-main border border-border px-2.5 py-1.5 rounded-[8px] font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                          onClick={() => onViewDetail(rec.inspectionId)}
                        >
                          <span>👁️</span> Detail
                        </button>

                        <button
                          type="button"
                          title="Hapus Data Inspeksi"
                          className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 px-2 py-1.5 rounded-[8px] font-semibold text-xs transition-all cursor-pointer"
                          onClick={() => onDelete(rec.inspectionId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
