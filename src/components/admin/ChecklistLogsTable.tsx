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
    <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">Tanggal</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">Nama Driver</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">Nopol</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">KM</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">BBM</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">Masalah</th>
              <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-center" style={{ width: 250 }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-text-muted px-4 py-8">
                  Tidak ada data checklist ditemukan.
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                let missingCount = 0;
                Object.values(rec.checklist || {}).forEach((i) => {
                  if (i && i.status === "TDK ADA") missingCount++;
                });
                const damagesCount = (rec.condition?.damages || []).length;
                let issueText = "Normal";
                let isIssue = false;
                if (rec.attentionNeeded) {
                  isIssue = true;
                  const parts: string[] = [];
                  if (missingCount > 0) parts.push(`${missingCount} Alat Absen`);
                  if (damagesCount > 0) parts.push(`${damagesCount} Kerusakan`);
                  issueText = parts.join(", ") || "Butuh Perhatian";
                }
                return (
                  <tr key={rec.inspectionId} className="hover:bg-bg-main">
                    <td className="px-4 py-3 border-b border-border text-sm">{formatDateID(rec.inspectionDate)}</td>
                    <td className="px-4 py-3 border-b border-border text-sm"><strong>{escapeHtml(rec.driver?.name || "")}</strong></td>
                    <td className="px-4 py-3 border-b border-border text-sm">{escapeHtml(rec.vehicle?.licensePlate) || "-"}</td>
                    <td className="px-4 py-3 border-b border-border text-sm">
                      Awal: {(rec.vehicle?.mileageStart || 0).toLocaleString()}<br />
                      Akhir: {(rec.vehicle?.mileageEnd || 0).toLocaleString()} KM
                    </td>
                    <td className="px-4 py-3 border-b border-border text-sm">{rec.condition?.fuelLevel || 0}%</td>
                    <td className={`px-4 py-3 border-b border-border text-sm font-bold ${isIssue ? "text-primary-red" : "text-primary-green"}`}>
                      {issueText}
                    </td>
                    <td className="px-4 py-3 border-b border-border text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button className="bg-primary-green text-white px-2 py-1 text-xs rounded-[8px] font-semibold cursor-pointer shadow-sm hover:bg-primary-green-hover transition-all" onClick={() => onDownloadPDF(rec.inspectionId)}>
                          Unduh PDF
                        </button>
                        <button className="bg-primary-blue text-white px-2 py-1 text-xs rounded-[8px] font-semibold cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all" onClick={() => onExportPDF(rec.inspectionId)}>
                          Cetak PDF
                        </button>
                        <button className="bg-bg-sidebar text-text-muted border border-border px-2 py-1 text-xs rounded-[8px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all" onClick={() => onViewDetail(rec.inspectionId)}>
                          Detail
                        </button>
                        <button className="bg-primary-red text-white px-2 py-1 text-xs rounded-[8px] font-semibold cursor-pointer shadow-sm hover:bg-primary-red-hover transition-all" onClick={() => onDelete(rec.inspectionId)}>
                          Hapus
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
