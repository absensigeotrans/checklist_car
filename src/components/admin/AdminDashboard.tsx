"use client";

import { useState, useMemo } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useAuth } from "@/context/AuthContext";
import type { InspectionRecord } from "@/types";
import { exportAllToExcel, preparePrintMarkup } from "@/lib/export";
import { formatDateID, escapeHtml } from "@/lib/utils";
import Modal from "../ui/Modal";
import AdminMetrics from "./AdminMetrics";
import ChecklistLogsTable from "./ChecklistLogsTable";

export default function AdminDashboard() {
  const { records, deleteRecord, clearAll } = useInspections();
  const { logoutAdmin } = useAuth();

  const [filterDriver, setFilterDriver] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    return records.filter((rec) => {
      const matchesDriver = (rec.driver?.name || "").toLowerCase().includes(filterDriver.toLowerCase());
      const matchesPlate = (rec.vehicle?.licensePlate || "").toLowerCase().includes(filterPlate.toLowerCase());
      let matchesStatus = true;
      if (filterStatus === "normal") matchesStatus = !rec.attentionNeeded;
      else if (filterStatus === "attention") matchesStatus = rec.attentionNeeded;
      return matchesDriver && matchesPlate && matchesStatus;
    });
  }, [records, filterDriver, filterPlate, filterStatus]);

  const handleViewDetail = (id: string) => {
    const rec = records.find((r) => r.inspectionId === id);
    if (rec) {
      setSelectedRecord(rec);
      setDetailOpen(true);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedRecord) return;
    const markup = preparePrintMarkup(selectedRecord);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Checklist PDF</title><style>@media print{@page{size:A4 portrait;margin:5mm;}}</style></head><body>${markup}</body></html>`);
      win.document.close();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  const handleExportPDF = () => {
    if (!selectedRecord) return;
    const markup = preparePrintMarkup(selectedRecord);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Checklist PDF</title></head><body>${markup}</body></html>`);
      win.document.close();
    }
  };

  return (
    <div>
      <AdminMetrics records={records} />

      {/* Filter Bar */}
      <div className="bg-white rounded-[16px] shadow-md p-6 mb-8 border border-border">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[150px] flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase">Cari Driver</label>
            <input
              type="text"
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              placeholder="Nama driver"
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex-1 min-w-[150px] flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase">Cari Nopol</label>
            <input
              type="text"
              value={filterPlate}
              onChange={(e) => setFilterPlate(e.target.value)}
              placeholder="Contoh: B 1234 PTK"
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex-1 min-w-[150px] flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            >
              <option value="all">Semua Status</option>
              <option value="normal">Normal (Semua Ada)</option>
              <option value="attention">Butuh Perhatian</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            className="bg-primary-blue text-white px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all inline-flex items-center gap-2 text-sm"
            onClick={() => exportAllToExcel(records)}
          >
            <span>📊</span> Ekspor Semua Excel
          </button>
          <button
            className="bg-bg-sidebar text-text-muted border border-border px-4 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all inline-flex items-center gap-2 text-sm"
            onClick={() => {
              if (confirm("⚠️ Peringatan: Anda akan menghapus SELURUH data pemeriksaan dari cloud dan lokal. Lanjutkan?"))
                clearAll();
            }}
          >
            <span>🗑️</span> Hapus Semua Data
          </button>
          <button
            className="bg-primary-red text-white px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-red-hover transition-all inline-flex items-center gap-2 text-sm ml-auto"
            onClick={logoutAdmin}
          >
            <span>🔒</span> Keluar Admin
          </button>
        </div>
      </div>

      <ChecklistLogsTable
        records={filtered}
        onViewDetail={handleViewDetail}
        onDelete={(id) => {
          if (confirm("Hapus data pemeriksaan ini?")) deleteRecord(id);
        }}
        onDownloadPDF={(id) => {
          const rec = records.find((r) => r.inspectionId === id);
          if (rec) {
            setSelectedRecord(rec);
            setTimeout(handleDownloadPDF, 100);
          }
        }}
        onExportPDF={(id) => {
          const rec = records.find((r) => r.inspectionId === id);
          if (rec) {
            setSelectedRecord(rec);
            setTimeout(handleExportPDF, 100);
          }
        }}
      />

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={selectedRecord ? `Detail Checklist - ${selectedRecord.driver?.name || ""} (${selectedRecord.vehicle?.licensePlate || "No Plat"})` : ""}>
        {selectedRecord && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 bg-bg-sidebar p-4 rounded-[12px]">
              <div className="text-sm">
                <strong>Nama Driver:</strong> {escapeHtml(selectedRecord.driver?.name || "")}<br />
                <strong>Kendaraan:</strong> {escapeHtml(selectedRecord.vehicle?.type) || "-"}<br />
                <strong>Pelat Nomor:</strong> {escapeHtml(selectedRecord.vehicle?.licensePlate) || "-"}<br />
                <strong>KM Awal:</strong> {(selectedRecord.vehicle?.mileageStart || 0).toLocaleString()} KM<br />
                <strong>KM Akhir:</strong> {(selectedRecord.vehicle?.mileageEnd || 0).toLocaleString()} KM (Jarak: {((selectedRecord.vehicle?.mileageEnd || 0) - (selectedRecord.vehicle?.mileageStart || 0)).toLocaleString()} KM)
              </div>
              <div className="text-sm">
                <strong>Tanggal:</strong> {formatDateID(selectedRecord.inspectionDate)}<br />
                <strong>Status BBM:</strong> {selectedRecord.condition?.fuelLevel || 0}%<br />
                <strong>Catatan Tambahan:</strong><br />
                1. {escapeHtml(selectedRecord.condition?.notes?.[0]) || "-"}<br />
                2. {escapeHtml(selectedRecord.condition?.notes?.[1]) || "-"}<br />
                3. {escapeHtml(selectedRecord.condition?.notes?.[2]) || "-"}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 border-b border-border pb-1">Kerusakan Body</h3>
              {(!selectedRecord.condition?.damages || selectedRecord.condition.damages.length === 0) ? (
                <span className="text-primary-green font-medium">✓ Tidak ada laporan kerusakan fisik (Normal).</span>
              ) : (
                <ul className="pl-5 text-primary-red font-medium text-sm">
                  {selectedRecord.condition.damages.map((d, i) => (
                    <li key={i}>[Body {d.part.replace("body_", "").replace("_", " ").toUpperCase()}] {escapeHtml(d.description)} (Koordinat: x={d.x}%, y={d.y}%)</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 border-b border-border pb-1">Perlengkapan yang TIDAK ADA</h3>
              {(() => {
                const missing = Object.entries(selectedRecord.checklist || {}).filter(([, item]) => item && item.status === "TDK ADA");
                return missing.length === 0 ? (
                  <span className="text-primary-green font-medium">✓ Semua perlengkapan lengkap (ADA).</span>
                ) : (
                  <ul className="pl-5 text-primary-red font-medium text-sm">
                    {missing.map(([num, item]) => (
                      <li key={num}>{num}. {item.item} ({item.note || "tanpa catatan"})</li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 border-b border-border pb-1">Tanda Tangan Driver</h3>
              {selectedRecord.signature && (
                <img src={selectedRecord.signature} alt="TTD" className="max-h-[100px] border border-border bg-white p-1 rounded-[8px]" />
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
          <button className="bg-primary-green text-white px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-green-hover transition-all inline-flex items-center gap-2" onClick={handleDownloadPDF}>
            <span>📥</span> Unduh PDF
          </button>
          <button className="bg-primary-blue text-white px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all inline-flex items-center gap-2" onClick={handleExportPDF}>
            <span>📄</span> Cetak PDF
          </button>
          <button className="bg-bg-sidebar text-text-muted border border-border px-4 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all" onClick={() => setDetailOpen(false)}>
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
}
