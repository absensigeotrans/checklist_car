"use client";

import { useState, useMemo } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useDriverLogs } from "@/hooks/useDriverLogs";
import { useAuth } from "@/context/AuthContext";
import type { InspectionRecord, DriverLogEntry } from "@/types";
import { exportAllToExcel, exportMonthlyLogExcel, preparePrintMarkup, prepareTimesheetPrintMarkup } from "@/lib/export";
import { useRegisteredDrivers } from "@/hooks/useRegisteredDrivers";
import { formatDateID, formatDateShort, escapeHtml } from "@/lib/utils";
import Modal from "../ui/Modal";
import AdminMetrics from "./AdminMetrics";
import ChecklistLogsTable from "./ChecklistLogsTable";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function AdminDashboard() {
  const { records, deleteRecord, clearAll: clearAllInspections } = useInspections();
  const { logs: driverLogs, deleteLog, clearAll: clearAllLogs } = useDriverLogs();
  const { logoutAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<"checklist" | "timesheet" | "accounts">("checklist");

  // Registered drivers from Supabase (synced across devices)
  const { drivers: registeredDrivers, deleteDriver } = useRegisteredDrivers();

  // Filters for Checklist
  const [filterDriver, setFilterDriver] = useState("");
  const [filterDriverDropdown, setFilterDriverDropdown] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters for Timesheet
  const [tsFilterDriver, setTsFilterDriver] = useState("");
  const [tsFilterDriverDropdown, setTsFilterDriverDropdown] = useState("");
  const [tsFilterPlate, setTsFilterPlate] = useState("");
  const [tsFilterMonth, setTsFilterMonth] = useState<number | "all">("all");
  const [selectedLog, setSelectedLog] = useState<DriverLogEntry | null>(null);
  const [tsDetailOpen, setTsDetailOpen] = useState(false);

  const handleDeleteDriver = async (nik: string) => {
    // Clear filters if deleted driver was selected
    if (tsFilterDriverDropdown === registeredDrivers.find((d) => d.nik === nik)?.name) {
      setTsFilterDriverDropdown("");
      setTsFilterDriver("");
    }
    if (filterDriverDropdown === registeredDrivers.find((d) => d.nik === nik)?.name) {
      setFilterDriverDropdown("");
      setFilterDriver("");
    }
    await deleteDriver(nik);
  };

  const filteredInspections = useMemo(() => {
    return records.filter((rec) => {
      const matchesDriver = (rec.driver?.name || "")
        .toLowerCase()
        .includes(filterDriver.toLowerCase());
      const matchesPlate = (rec.vehicle?.licensePlate || "")
        .toLowerCase()
        .includes(filterPlate.toLowerCase());
      let matchesStatus = true;
      if (filterStatus === "normal") matchesStatus = !rec.attentionNeeded;
      else if (filterStatus === "attention") matchesStatus = rec.attentionNeeded;
      return matchesDriver && matchesPlate && matchesStatus;
    });
  }, [records, filterDriver, filterPlate, filterStatus]);

  const filteredLogs = useMemo(() => {
    return driverLogs.filter((log) => {
      const matchesDriver =
        (log.driverName || "").toLowerCase().includes(tsFilterDriver.toLowerCase()) ||
        (log.driverNik || "").toLowerCase().includes(tsFilterDriver.toLowerCase());
      const matchesPlate = (log.licensePlate || "")
        .toLowerCase()
        .includes(tsFilterPlate.toLowerCase());

      let matchesMonth = true;
      if (tsFilterMonth !== "all") {
        const d = new Date(log.logDate);
        matchesMonth = d.getMonth() + 1 === tsFilterMonth;
      }
      return matchesDriver && matchesPlate && matchesMonth;
    });
  }, [driverLogs, tsFilterDriver, tsFilterPlate, tsFilterMonth]);

  const handleViewDetail = (id: string) => {
    const rec = records.find((r) => r.inspectionId === id);
    if (rec) {
      setSelectedRecord(rec);
      setDetailOpen(true);
    }
  };

  const handleViewTsDetail = (log: DriverLogEntry) => {
    setSelectedLog(log);
    setTsDetailOpen(true);
  };

  const handlePrintTimesheetPDF = (logToPrint?: DriverLogEntry) => {
    const targetLog = logToPrint || selectedLog;
    const name = targetLog ? targetLog.driverName : (tsFilterDriver || "Driver");
    const nik = targetLog ? targetLog.driverNik : "";
    const m = tsFilterMonth === "all" ? (new Date().getMonth() + 1) : tsFilterMonth;
    const y = new Date().getFullYear();

    const logsForDriver = driverLogs.filter((l) => {
      const isMatch = targetLog
        ? l.driverNik === targetLog.driverNik || l.driverName === targetLog.driverName
        : true;
      const dateObj = new Date(l.logDate);
      return isMatch && dateObj.getMonth() + 1 === m && dateObj.getFullYear() === y;
    });

    const markup = prepareTimesheetPrintMarkup(
      logsForDriver.length > 0 ? logsForDriver : filteredLogs,
      name,
      nik,
      m,
      y
    );

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>Timesheet PDF - ${name}</title><style>@media print{@page{size:A4 portrait;margin:4mm;}}</style></head><body>${markup}</body></html>`);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 300);
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
      {/* Header & Metrics */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main">
            ⚙️ Panel Control Admin
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Pantau seluruh checklist kendaraan dan log timesheet armada PTK.
          </p>
        </div>
        <button
          className="bg-primary-red text-white px-4 py-2.5 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-red-hover transition-all inline-flex items-center gap-2 text-sm"
          onClick={logoutAdmin}
        >
          <span>🔒</span> Keluar Admin
        </button>
      </div>

      <AdminMetrics records={records} driverLogs={driverLogs} />

      {/* Admin Subtabs */}
      <div className="flex gap-2 border-b-2 border-border mb-6 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className={`bg-none border-none px-6 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all whitespace-nowrap ${
            activeTab === "checklist"
              ? "text-primary-blue border-b-[3px] border-primary-blue"
              : "text-text-muted hover:text-text-main"
          }`}
          onClick={() => setActiveTab("checklist")}
        >
          🔍 Checklist Kendaraan ({records.length})
        </button>
        <button
          type="button"
          className={`bg-none border-none px-6 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all whitespace-nowrap ${
            activeTab === "timesheet"
              ? "text-primary-blue border-b-[3px] border-primary-blue"
              : "text-text-muted hover:text-text-main"
          }`}
          onClick={() => setActiveTab("timesheet")}
        >
          📋 Rekap Timesheet Driver ({driverLogs.length})
        </button>
        <button
          type="button"
          className={`bg-none border-none px-6 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all whitespace-nowrap ${
            activeTab === "accounts"
              ? "text-primary-blue border-b-[3px] border-primary-blue"
              : "text-text-muted hover:text-text-main"
          }`}
          onClick={() => setActiveTab("accounts")}
        >
          👤 Akun Driver ({registeredDrivers.length})
        </button>
      </div>

      {/* TAB 1: Checklist Kendaraan */}
      {activeTab === "checklist" && (
        <>
          <div className="bg-white rounded-[16px] shadow-md p-6 mb-8 border border-border">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[180px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Pilih Driver</label>
                <select
                  value={filterDriverDropdown}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterDriverDropdown(val);
                    setFilterDriver(val);
                  }}
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] bg-white"
                >
                  <option value="">Semua Driver</option>
                  {registeredDrivers.map((d) => (
                    <option key={d.nik} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Cari Nama</label>
                <input
                  type="text"
                  value={filterDriver}
                  onChange={(e) => {
                    setFilterDriver(e.target.value);
                    setFilterDriverDropdown("");
                  }}
                  placeholder="Ketik nama driver..."
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
                />
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Cari Nopol</label>
                <input
                  type="text"
                  value={filterPlate}
                  onChange={(e) => setFilterPlate(e.target.value)}
                  placeholder="Contoh: B 1234 PTK..."
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
                />
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] bg-white"
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
                onClick={() => exportAllToExcel(filteredInspections)}
              >
                <span>📊</span> Ekspor Checklist Excel
              </button>
              <button
                className="bg-bg-sidebar text-text-muted border border-border px-4 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all inline-flex items-center gap-2 text-sm"
                onClick={() => {
                  if (confirm("⚠️ Peringatan: Anda akan menghapus SELURUH data pemeriksaan dari cloud dan lokal. Lanjutkan?"))
                    clearAllInspections();
                }}
              >
                <span>🗑️</span> Hapus Semua Data Checklist
              </button>
            </div>
          </div>

          <ChecklistLogsTable
            records={filteredInspections}
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
        </>
      )}

      {/* TAB 2: Rekap Timesheet Driver */}
      {activeTab === "timesheet" && (
        <>
          <div className="bg-white rounded-[16px] shadow-md p-6 mb-8 border border-border">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[180px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Pilih Driver</label>
                <select
                  value={tsFilterDriverDropdown}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTsFilterDriverDropdown(val);
                    setTsFilterDriver(val);
                  }}
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] bg-white"
                >
                  <option value="">Semua Driver</option>
                  {registeredDrivers.map((d) => (
                    <option key={d.nik} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Cari Nama / NIK</label>
                <input
                  type="text"
                  value={tsFilterDriver}
                  onChange={(e) => {
                    setTsFilterDriver(e.target.value);
                    setTsFilterDriverDropdown("");
                  }}
                  placeholder="Nama atau NIK..."
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
                />
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Cari Nopol</label>
                <input
                  type="text"
                  value={tsFilterPlate}
                  onChange={(e) => setTsFilterPlate(e.target.value)}
                  placeholder="No Polisi..."
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
                />
              </div>
              <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Filter Bulan</label>
                <select
                  value={tsFilterMonth}
                  onChange={(e) =>
                    setTsFilterMonth(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] bg-white"
                >
                  <option value="all">Semua Bulan</option>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                className={`px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm transition-all inline-flex items-center gap-2 text-sm ${
                  tsFilterDriverDropdown
                    ? "bg-primary-blue text-white hover:bg-primary-blue-hover"
                    : "bg-border text-text-muted cursor-not-allowed opacity-60"
                }`}
                onClick={() => {
                  if (!tsFilterDriverDropdown) {
                    alert("⚠️ Pilih driver terlebih dahulu dari dropdown 'Pilih Driver' sebelum mencetak PDF.");
                    return;
                  }
                  handlePrintTimesheetPDF();
                }}
              >
                <span>📄</span> Cetak / PDF Timesheet
              </button>
              <button
                className={`px-4 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm transition-all inline-flex items-center gap-2 text-sm ${
                  tsFilterDriverDropdown
                    ? "bg-primary-green text-white hover:bg-primary-green-hover"
                    : "bg-border text-text-muted cursor-not-allowed opacity-60"
                }`}
                onClick={() => {
                  if (!tsFilterDriverDropdown) {
                    alert("⚠️ Pilih driver terlebih dahulu dari dropdown 'Pilih Driver' sebelum mengekspor Excel.");
                    return;
                  }
                  exportMonthlyLogExcel(filteredLogs);
                }}
              >
                <span>📊</span> Ekspor Timesheet Excel
              </button>
              <button
                className="bg-bg-sidebar text-text-muted border border-border px-4 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all inline-flex items-center gap-2 text-sm"
                onClick={() => {
                  if (
                    confirm(
                      "⚠️ Peringatan: Anda akan menghapus SELURUH data log timesheet driver. Lanjutkan?"
                    )
                  )
                    clearAllLogs();
                }}
              >
                <span>🗑️</span> Hapus Semua Data Timesheet
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Tanggal</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Nama Driver</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">NIK</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Nopol</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Jam Kerja</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">KM (Awal - Akhir)</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Jarak</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Pemakai</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border text-center">TTD</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-text-muted px-3 py-8">
                        Belum ada data log timesheet driver.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr key={l.logId} className="hover:bg-bg-main">
                        <td className="px-3 py-3 border-b border-border text-xs font-semibold">
                          {formatDateShort(l.logDate)} ({l.logDay})
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs font-bold text-text-main">
                          {escapeHtml(l.driverName)}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs text-text-muted">
                          {l.driverNik || "-"}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs font-semibold">
                          {l.licensePlate || "-"}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {l.workStart} - {l.workEnd}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {l.kmStart.toLocaleString()} - {l.kmEnd.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs font-bold text-primary-blue">
                          {(l.kmEnd - l.kmStart).toLocaleString()} KM
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {escapeHtml(l.userName)}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs text-center">
                          {l.userSignature ? (
                            <img
                              src={l.userSignature}
                              alt="TTD"
                              className="max-h-[32px] max-w-[70px] object-contain mx-auto border border-border bg-white p-0.5 rounded"
                            />
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewTsDetail(l)}
                              className="bg-blue-100 text-primary-blue hover:bg-primary-blue hover:text-white px-2 py-1 rounded font-semibold text-xs transition-all"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Hapus log timesheet ini?")) deleteLog(l.logId);
                              }}
                              className="bg-red-100 text-primary-red hover:bg-primary-red hover:text-white px-2 py-1 rounded font-semibold text-xs transition-all"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Checklist Detail Modal */}
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

      {/* Timesheet Detail Modal */}
      {tsDetailOpen && selectedLog && (
        <Modal
          isOpen={tsDetailOpen}
          onClose={() => setTsDetailOpen(false)}
          title={`Detail Log Timesheet - ${selectedLog.driverName}`}
          maxWidth="500px"
        >
          <div className="flex flex-col gap-4 text-left">
            <div className="bg-bg-sidebar p-4 rounded-[12px] grid grid-cols-2 gap-3 text-xs">
              <div>
                <strong>Tanggal:</strong> {formatDateShort(selectedLog.logDate)} ({selectedLog.logDay})<br />
                <strong>Nama Driver:</strong> {escapeHtml(selectedLog.driverName)}<br />
                <strong>NIK:</strong> {selectedLog.driverNik || "-"}<br />
                <strong>No Polisi:</strong> {selectedLog.licensePlate || "-"}
              </div>
              <div>
                <strong>Jam Kerja:</strong> {selectedLog.workStart} - {selectedLog.workEnd}<br />
                <strong>KM Awal:</strong> {selectedLog.kmStart.toLocaleString()}<br />
                <strong>KM Akhir:</strong> {selectedLog.kmEnd.toLocaleString()}<br />
                <strong>Jarak Tempuh:</strong> <span className="text-primary-blue font-bold">{(selectedLog.kmEnd - selectedLog.kmStart).toLocaleString()} KM</span>
              </div>
            </div>

            <div className="text-xs">
              <strong>Pemakai / User:</strong> {escapeHtml(selectedLog.userName)}<br />
              <strong>Keterangan:</strong> {escapeHtml(selectedLog.remark) || "-"}
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase mb-2">
                Tanda Tangan Digital Driver
              </h4>
              {selectedLog.userSignature ? (
                <div className="border border-border p-2 rounded-[10px] bg-white text-center">
                  <img
                    src={selectedLog.userSignature}
                    alt="TTD"
                    className="max-h-[120px] object-contain mx-auto"
                  />
                </div>
              ) : (
                <span className="text-text-muted text-xs font-medium">Belum ada tanda tangan.</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="bg-primary-blue text-white px-4 py-2 rounded-[10px] font-semibold text-xs cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all inline-flex items-center gap-1.5"
                onClick={() => handlePrintTimesheetPDF(selectedLog)}
              >
                <span>📄</span> Cetak PDF Timesheet
              </button>
              <button
                type="button"
                className="bg-bg-sidebar text-text-muted border border-border px-4 py-2 rounded-[10px] font-semibold text-xs cursor-pointer hover:bg-border hover:text-text-main transition-all"
                onClick={() => setTsDetailOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* TAB 3: Akun Driver Terdaftar */}
      {activeTab === "accounts" && (
        <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-text-main">👤 Daftar Akun Driver Terdaftar</h2>
              <p className="text-xs text-text-muted mt-0.5">Akun driver yang telah mendaftar dan dapat login ke sistem. Hapus akun untuk mencabut akses login driver.</p>
            </div>
            <span className="text-xs font-semibold text-white bg-primary-blue px-3 py-1.5 rounded-full">
              {registeredDrivers.length} Akun
            </span>
          </div>

          {registeredDrivers.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <div className="text-5xl mb-3">👤</div>
              <div className="text-base font-semibold">Belum ada driver terdaftar.</div>
              <div className="text-xs mt-1">Driver perlu mendaftar melalui portal login driver.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-left w-8">#</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-left">Nama Driver</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-left">NIK</th>
                    <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredDrivers.map((driver, idx) => (
                    <tr key={driver.nik} className="border-b border-border last:border-0 hover:bg-bg-sidebar/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-text-muted font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center font-bold text-sm shrink-0">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm text-text-main">{driver.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-text-muted bg-bg-sidebar px-2 py-0.5 rounded-[6px]">{driver.nik}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary-red border border-primary-red/30 bg-primary-red/5 px-3 py-1.5 rounded-[8px] cursor-pointer hover:bg-primary-red hover:text-white transition-all"
                          onClick={() => {
                            if (confirm(`Hapus akun driver "${driver.name}" (NIK: ${driver.nik})? Aksi ini tidak dapat dibatalkan.`))
                              handleDeleteDriver(driver.nik);
                          }}
                        >
                          🗑️ Hapus Akun
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
