"use client";

import { useState, useMemo } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useDriverLogs } from "@/hooks/useDriverLogs";
import { useAuth } from "@/context/AuthContext";
import type { InspectionRecord, DriverLogEntry } from "@/types";
import {
  exportAllToExcel,
  exportMonthlyLogExcel,
  preparePrintMarkup,
  prepareTimesheetPrintMarkup,
  downloadChecklistPDFDirect,
} from "@/lib/export";
import { useRegisteredDrivers } from "@/hooks/useRegisteredDrivers";
import { formatDateID, formatDateShort, escapeHtml } from "@/lib/utils";
import Modal from "../ui/Modal";
import AdminMetrics from "./AdminMetrics";
import ChecklistLogsTable from "./ChecklistLogsTable";
import ChecklistPDFPreview from "./ChecklistPDFPreview";

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
  const [detailModalTab, setDetailModalTab] = useState<"summary" | "pdf">("summary");

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

  const handleViewDetail = (id: string, initialTab: "summary" | "pdf" = "summary") => {
    const rec = records.find((r) => r.inspectionId === id);
    if (rec) {
      setSelectedRecord(rec);
      setDetailModalTab(initialTab);
      setDetailOpen(true);
    }
  };

  const handleViewTsDetail = (log: DriverLogEntry) => {
    setSelectedLog(log);
    setTsDetailOpen(true);
  };

  const handlePrintTimesheetPDF = (logToPrint?: DriverLogEntry) => {
    const targetLog = logToPrint || selectedLog;
    const name = targetLog
      ? targetLog.driverName
      : tsFilterDriverDropdown || tsFilterDriver || "Driver";
    const nik = targetLog
      ? targetLog.driverNik
      : registeredDrivers.find((d) => d.name === tsFilterDriverDropdown)?.nik || "";
    const m = tsFilterMonth === "all" ? new Date().getMonth() + 1 : tsFilterMonth;
    const y = new Date().getFullYear();

    const logsForDriver = driverLogs.filter((l) => {
      const isMatch = targetLog
        ? l.driverNik === targetLog.driverNik || l.driverName === targetLog.driverName
        : tsFilterDriverDropdown
        ? l.driverName === tsFilterDriverDropdown
        : tsFilterDriver
        ? l.driverName.toLowerCase().includes(tsFilterDriver.toLowerCase()) ||
          l.driverNik.toLowerCase().includes(tsFilterDriver.toLowerCase())
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

    const fileName = `Timesheet_${name.replace(/\s+/g, "_")}_${String(m).padStart(2, "0")}_${y}`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: white; }
    @media print {
      @page { size: A4 landscape; margin: 3mm; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
${markup}
<script>
  window.onload = function() {
    window.focus();
    setTimeout(function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 2000);
    }, 400);
  };
<\/script>
</body>
</html>`);
      win.document.close();
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedRecord) return;
    const markup = preparePrintMarkup(selectedRecord);
    const fileName = `Checklist_${selectedRecord.driver.name.replace(
      /\s+/g,
      "_"
    )}_${selectedRecord.vehicle.licensePlate.replace(/\s+/g, "_")}`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: white; }
    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
${markup}
<script>
  window.onload = function() {
    window.focus();
    setTimeout(function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 2000);
    }, 400);
  };
<\/script>
</body>
</html>`);
      win.document.close();
    }
  };

  const handleExportPDF = () => {
    if (!selectedRecord) return;
    handleDownloadPDF();
  };

  const resetChecklistFilters = () => {
    setFilterDriver("");
    setFilterDriverDropdown("");
    setFilterPlate("");
    setFilterStatus("all");
  };

  const resetTimesheetFilters = () => {
    setTsFilterDriver("");
    setTsFilterDriverDropdown("");
    setTsFilterPlate("");
    setTsFilterMonth("all");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Admin */}
      <div className="bg-white rounded-[20px] p-6 max-md:p-4 border border-border shadow-xs flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-primary-red/10 text-primary-red flex items-center justify-center text-2xl font-bold shrink-0 border border-primary-red/20 shadow-2xs">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl max-md:text-lg font-black text-text-main">
                Panel Control Admin PTK
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Cloud Synced
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Pantau pemeriksaan fisik kendaraan, log timesheet harian driver, dan kelola akun armada.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 px-4 py-2.5 rounded-[12px] font-bold cursor-pointer transition-all inline-flex items-center gap-2 text-xs shadow-2xs"
          onClick={logoutAdmin}
        >
          <span>🔒</span> Keluar Admin
        </button>
      </div>

      {/* 2. Admin Executive Metrics */}
      <AdminMetrics records={records} driverLogs={driverLogs} />

      {/* 3. Subtabs Navigation (Segmented Control) */}
      <div className="bg-bg-sidebar/60 p-1.5 rounded-[16px] border border-border flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-[12px] font-bold text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2 ${
            activeTab === "checklist"
              ? "bg-white text-primary-blue shadow-sm border border-border"
              : "text-text-muted hover:text-text-main hover:bg-white/50"
          }`}
          onClick={() => setActiveTab("checklist")}
        >
          <span>🔍</span> Checklist Kendaraan
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "checklist"
                ? "bg-blue-100 text-primary-blue"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {records.length}
          </span>
        </button>

        <button
          type="button"
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-[12px] font-bold text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2 ${
            activeTab === "timesheet"
              ? "bg-white text-primary-blue shadow-sm border border-border"
              : "text-text-muted hover:text-text-main hover:bg-white/50"
          }`}
          onClick={() => setActiveTab("timesheet")}
        >
          <span>📋</span> Rekap Timesheet Driver
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "timesheet"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {driverLogs.length}
          </span>
        </button>

        <button
          type="button"
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-[12px] font-bold text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2 ${
            activeTab === "accounts"
              ? "bg-white text-primary-blue shadow-sm border border-border"
              : "text-text-muted hover:text-text-main hover:bg-white/50"
          }`}
          onClick={() => setActiveTab("accounts")}
        >
          <span>👤</span> Akun Driver Terdaftar
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "accounts"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {registeredDrivers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Checklist Kendaraan */}
      {activeTab === "checklist" && (
        <div className="space-y-6">
          {/* Filter Control Box */}
          <div className="bg-white rounded-[16px] shadow-xs p-5 border border-border">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h3 className="text-sm font-bold text-text-main">
                  Filter & Filter Laporan Checklist
                </h3>
              </div>
              {(filterDriver || filterPlate || filterStatus !== "all" || filterDriverDropdown) && (
                <button
                  type="button"
                  onClick={resetChecklistFilters}
                  className="text-xs text-primary-blue hover:underline font-semibold cursor-pointer"
                >
                  ↺ Reset Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dropdown Driver */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Pilih Driver
                </label>
                <select
                  value={filterDriverDropdown}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterDriverDropdown(val);
                    setFilterDriver(val);
                  }}
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 bg-white font-medium"
                >
                  <option value="">-- Semua Driver Terdaftar --</option>
                  {registeredDrivers.map((d) => (
                    <option key={d.nik} value={d.name}>
                      {d.name} ({d.nik})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cari Nama Manual */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Ketik Nama Driver
                </label>
                <input
                  type="text"
                  value={filterDriver}
                  onChange={(e) => {
                    setFilterDriver(e.target.value);
                    setFilterDriverDropdown("");
                  }}
                  placeholder="Ketik nama..."
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 font-medium"
                />
              </div>

              {/* Cari Nopol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  No. Polisi
                </label>
                <input
                  type="text"
                  value={filterPlate}
                  onChange={(e) => setFilterPlate(e.target.value)}
                  placeholder="Contoh: B 1234 PTK"
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 font-medium"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Status Temuan
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 bg-white font-medium"
                >
                  <option value="all">Semua Status</option>
                  <option value="normal">✓ Normal (Lengkap & Mulus)</option>
                  <option value="attention">⚠️ Butuh Perhatian (Rusak/Absen)</option>
                </select>
              </div>
            </div>

            {/* Export & Bulk Action Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-3.5 py-2 rounded-[10px] font-bold cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5 text-xs"
                  onClick={() => exportAllToExcel(filteredInspections)}
                >
                  <span>📊</span> Ekspor Rekap Excel
                </button>
                <span className="text-xs text-text-muted font-medium">
                  Menampilkan <strong>{filteredInspections.length}</strong> dari {records.length} laporan
                </span>
              </div>

              <button
                type="button"
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-[10px] font-semibold cursor-pointer transition-all inline-flex items-center gap-1"
                onClick={() => {
                  if (
                    confirm(
                      "⚠️ Peringatan: Anda akan menghapus SELURUH data pemeriksaan dari cloud dan lokal. Lanjutkan?"
                    )
                  )
                    clearAllInspections();
                }}
              >
                <span>🗑️</span> Hapus Semua Checklist
              </button>
            </div>
          </div>

          <ChecklistLogsTable
            records={filteredInspections}
            onViewDetail={handleViewDetail}
            onDelete={(id) => {
              if (confirm("Hapus data pemeriksaan ini?")) deleteRecord(id);
            }}
            onDownloadPDF={(id) => handleViewDetail(id, "pdf")}
            onExportPDF={(id) => handleViewDetail(id, "pdf")}
          />
        </div>
      )}

      {/* TAB 2: Rekap Timesheet Driver */}
      {activeTab === "timesheet" && (
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] shadow-xs p-5 border border-border">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <h3 className="text-sm font-bold text-text-main">
                  Filter & Cetak Official Timesheet PDF
                </h3>
              </div>
              {(tsFilterDriver || tsFilterPlate || tsFilterMonth !== "all" || tsFilterDriverDropdown) && (
                <button
                  type="button"
                  onClick={resetTimesheetFilters}
                  className="text-xs text-primary-blue hover:underline font-semibold cursor-pointer"
                >
                  ↺ Reset Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dropdown Driver (Required for PDF) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-primary-blue uppercase tracking-wider flex items-center gap-1">
                  Pilih Driver Cetak PDF <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tsFilterDriverDropdown}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTsFilterDriverDropdown(val);
                    setTsFilterDriver(val);
                  }}
                  className="w-full border-2 border-primary-blue/30 rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 bg-white font-bold text-text-main"
                >
                  <option value="">-- Pilih Driver Cetak --</option>
                  {registeredDrivers.map((d) => (
                    <option key={d.nik} value={d.name}>
                      {d.name} (NIK: {d.nik})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cari Nama / NIK */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Cari Nama / NIK
                </label>
                <input
                  type="text"
                  value={tsFilterDriver}
                  onChange={(e) => {
                    setTsFilterDriver(e.target.value);
                    setTsFilterDriverDropdown("");
                  }}
                  placeholder="Ketik Nama atau NIK..."
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 font-medium"
                />
              </div>

              {/* Cari Nopol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  No. Polisi
                </label>
                <input
                  type="text"
                  value={tsFilterPlate}
                  onChange={(e) => setTsFilterPlate(e.target.value)}
                  placeholder="Contoh: B 1234 PTK"
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 font-medium"
                />
              </div>

              {/* Filter Bulan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Periode Bulan
                </label>
                <select
                  value={tsFilterMonth}
                  onChange={(e) =>
                    setTsFilterMonth(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-border rounded-[10px] px-3 py-2 outline-none text-xs focus:border-primary-blue focus:ring-2 focus:ring-blue-100 bg-white font-medium"
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

            {/* PDF & Excel Action Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-[10px] font-extrabold cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5 text-xs ${
                    tsFilterDriverDropdown
                      ? "bg-primary-blue text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!tsFilterDriverDropdown) {
                      alert(
                        "⚠️ Harap pilih driver dari dropdown 'Pilih Driver Cetak PDF' sebelum melakukan ekspor."
                      );
                      return;
                    }
                    handlePrintTimesheetPDF();
                  }}
                >
                  <span>📄</span> Cetak / PDF Official Timesheet
                </button>

                <button
                  type="button"
                  className={`px-3.5 py-2 rounded-[10px] font-bold cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5 text-xs ${
                    tsFilterDriverDropdown
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!tsFilterDriverDropdown) {
                      alert(
                        "⚠️ Harap pilih driver dari dropdown 'Pilih Driver Cetak PDF' sebelum melakukan ekspor Excel."
                      );
                      return;
                    }
                    exportMonthlyLogExcel(filteredLogs);
                  }}
                >
                  <span>📊</span> Ekspor Excel Timesheet
                </button>
              </div>

              <button
                type="button"
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-[10px] font-semibold cursor-pointer transition-all inline-flex items-center gap-1"
                onClick={() => {
                  if (
                    confirm(
                      "⚠️ Peringatan: Anda akan menghapus SELURUH data log timesheet driver. Lanjutkan?"
                    )
                  )
                    clearAllLogs();
                }}
              >
                <span>🗑️</span> Hapus Semua Timesheet
              </button>
            </div>
          </div>

          {/* Timesheet Data Table */}
          <div className="bg-white rounded-[16px] shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-bg-sidebar/80 border-b border-border">
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Tanggal
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Nama Driver & NIK
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Nopol
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Jam Kerja
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      KM (Awal → Akhir)
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Jarak
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5">
                      Pemakai (User)
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5 text-center">
                      TTD User
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3.5 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-text-muted px-4 py-12">
                        <div className="text-4xl mb-2">📋</div>
                        <div className="font-semibold text-sm">Belum ada data log timesheet driver.</div>
                        <div className="text-xs text-text-muted mt-1">
                          Driver mengisi timesheet melalui menu Rekap Timesheet Harian.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => {
                      const initial = (l.driverName || "D").charAt(0).toUpperCase();
                      const dist = Math.max(0, l.kmEnd - l.kmStart);
                      return (
                        <tr key={l.logId} className="hover:bg-bg-sidebar/40 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-text-main font-semibold whitespace-nowrap">
                            {formatDateShort(l.logDate)}
                            <span className="block text-[10px] text-text-muted font-normal">
                              ({l.logDay})
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shrink-0 border border-emerald-200">
                                {initial}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-text-main">
                                  {escapeHtml(l.driverName)}
                                </div>
                                <div className="text-[10px] text-text-muted font-mono">
                                  NIK: {l.driverNik || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="bg-slate-100 text-slate-800 font-mono font-bold text-xs px-2 py-0.5 rounded-[6px] border border-slate-200">
                              {l.licensePlate || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-xs font-medium text-text-main whitespace-nowrap">
                            {l.workStart} - {l.workEnd}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-text-main whitespace-nowrap">
                            {l.kmStart.toLocaleString()} → {l.kmEnd.toLocaleString()}
                          </td>

                          <td className="px-4 py-3.5 text-xs font-extrabold text-primary-blue whitespace-nowrap">
                            +{dist.toLocaleString()} KM
                          </td>

                          <td className="px-4 py-3.5 text-xs font-semibold text-text-main">
                            {escapeHtml(l.userName)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {l.userSignature ? (
                              <img
                                src={l.userSignature}
                                alt="TTD"
                                className="max-h-[30px] max-w-[65px] object-contain mx-auto border border-border bg-white p-0.5 rounded-[6px] shadow-2xs"
                              />
                            ) : (
                              <span className="text-text-muted text-xs font-medium">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewTsDetail(l)}
                                className="bg-bg-sidebar text-text-muted hover:bg-border hover:text-text-main border border-border px-2.5 py-1.5 rounded-[8px] font-semibold text-xs transition-all cursor-pointer"
                              >
                                Detail
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Hapus log timesheet ini?")) deleteLog(l.logId);
                                }}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 px-2 py-1.5 rounded-[8px] font-semibold text-xs transition-all cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: Akun Driver Terdaftar */}
      {activeTab === "accounts" && (
        <div className="bg-white rounded-[16px] shadow-xs p-6 border border-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <span>👤</span> Daftar Akun Driver Terdaftar (Cloud Synced)
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Kelola akun driver yang memiliki hak akses login. Hapus akun untuk mencabut akses login.
              </p>
            </div>
            <span className="text-xs font-bold text-primary-blue bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Total {registeredDrivers.length} Driver
            </span>
          </div>

          {registeredDrivers.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <div className="text-4xl mb-2">👤</div>
              <div className="text-sm font-semibold">Belum ada akun driver terdaftar.</div>
              <div className="text-xs mt-1">Driver dapat mendaftar dari halaman portal login driver.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-border">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-bg-sidebar/80 border-b border-border">
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3 w-10 text-center">
                      #
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3">
                      Nama Lengkap Driver
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3">
                      NIK Driver
                    </th>
                    <th className="text-text-muted font-bold uppercase text-[11px] tracking-wider px-4 py-3 text-center">
                      Aksi Pengelolaan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registeredDrivers.map((driver, idx) => (
                    <tr key={driver.nik} className="hover:bg-bg-sidebar/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-text-muted font-bold text-center">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs text-text-main">
                            {driver.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-[6px]">
                          {driver.nik}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-3 py-1.5 rounded-[8px] cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs"
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus akun driver "${driver.name}" (NIK: ${driver.nik})? Aksi ini tidak dapat dibatalkan.`
                              )
                            )
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

      {/* Checklist Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="960px"
        title={
          selectedRecord
            ? `Detail Laporan Checklist - ${selectedRecord.driver?.name || ""} (${selectedRecord.vehicle?.licensePlate || "No Plat"})`
            : ""
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* Modal Segmented Tab Navigation */}
            <div className="bg-bg-sidebar/90 p-1.5 rounded-[12px] border border-border flex gap-1.5">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-[10px] font-bold text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2 ${
                  detailModalTab === "summary"
                    ? "bg-white text-primary-blue shadow-2xs border border-border"
                    : "text-text-muted hover:text-text-main hover:bg-white/50"
                }`}
                onClick={() => setDetailModalTab("summary")}
              >
                <span>📌</span> Ringkasan Rinci Temuan
              </button>

              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-[10px] font-bold text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2 ${
                  detailModalTab === "pdf"
                    ? "bg-white text-primary-blue shadow-2xs border border-border"
                    : "text-text-muted hover:text-text-main hover:bg-white/50"
                }`}
                onClick={() => setDetailModalTab("pdf")}
              >
                <span>📄</span> Preview Dokumen PDF Resmi
              </button>
            </div>

            {/* TAB 1: Ringkasan Rinci */}
            {detailModalTab === "summary" && (
              <div className="space-y-5 text-left text-xs">
                {/* Header Identity Card */}
                <div className="bg-bg-sidebar p-4 rounded-[14px] border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div>
                      <span className="text-text-muted">Nama Driver:</span>{" "}
                      <strong className="text-text-main font-bold">
                        {escapeHtml(selectedRecord.driver?.name || "")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Jenis Kendaraan:</span>{" "}
                      <strong>{escapeHtml(selectedRecord.vehicle?.type) || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Plat Nomor:</span>{" "}
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded-[4px] border border-slate-200">
                        {escapeHtml(selectedRecord.vehicle?.licensePlate) || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <span className="text-text-muted">Waktu Inspeksi:</span>{" "}
                      <strong>{formatDateID(selectedRecord.inspectionDate)}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Odometer:</span>{" "}
                      <strong>
                        {(selectedRecord.vehicle?.mileageStart || 0).toLocaleString()} →{" "}
                        {(selectedRecord.vehicle?.mileageEnd || 0).toLocaleString()} KM
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Level BBM:</span>{" "}
                      <strong className="text-primary-blue font-bold">
                        {selectedRecord.condition?.fuelLevel || 0}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Kerusakan Body Box */}
                <div className="bg-white p-4 rounded-[14px] border border-border space-y-2">
                  <h4 className="font-bold text-text-main text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🚗</span> Temuan Kerusakan Body (Fisik)
                  </h4>
                  {!selectedRecord.condition?.damages || selectedRecord.condition.damages.length === 0 ? (
                    <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-[10px] border border-emerald-200 font-semibold text-xs">
                      ✓ Tidak ada temuan kerusakan fisik (Kondisi Body Mulus).
                    </div>
                  ) : (
                    <ul className="bg-rose-50 text-rose-700 p-3 rounded-[10px] border border-rose-200 space-y-1 text-xs">
                      {selectedRecord.condition.damages.map((d, i) => (
                        <li key={i} className="font-semibold">
                          • [Body {d.part.replace("body_", "").replace("_", " ").toUpperCase()}] {escapeHtml(d.description)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Perlengkapan Hilang Box */}
                <div className="bg-white p-4 rounded-[14px] border border-border space-y-2">
                  <h4 className="font-bold text-text-main text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🧰</span> Kelengkapan Alat (1-27)
                  </h4>
                  {(() => {
                    const missing = Object.entries(selectedRecord.checklist || {}).filter(
                      ([, item]) => item && item.status === "TDK ADA"
                    );
                    return missing.length === 0 ? (
                      <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-[10px] border border-emerald-200 font-semibold text-xs">
                        ✓ Seluruh 27 item perlengkapan kendaraan LENGKAP (ADA).
                      </div>
                    ) : (
                      <ul className="bg-rose-50 text-rose-700 p-3 rounded-[10px] border border-rose-200 space-y-1 text-xs font-semibold">
                        {missing.map(([num, item]) => (
                          <li key={num}>
                            • Item {num}. {item.item} ({item.note || "tanpa keterangan"})
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                {/* Catatan Driver */}
                <div className="bg-white p-4 rounded-[14px] border border-border space-y-1">
                  <h4 className="font-bold text-text-main text-xs uppercase tracking-wider mb-1">
                    📝 Catatan Driver
                  </h4>
                  <p className="text-text-muted font-medium">
                    1. {escapeHtml(selectedRecord.condition?.notes?.[0]) || "-"}<br />
                    2. {escapeHtml(selectedRecord.condition?.notes?.[1]) || "-"}<br />
                    3. {escapeHtml(selectedRecord.condition?.notes?.[2]) || "-"}
                  </p>
                </div>

                {/* Signature Preview */}
                {selectedRecord.signature && (
                  <div className="bg-white p-3 rounded-[14px] border border-border space-y-1.5">
                    <h4 className="font-bold text-text-main text-xs uppercase tracking-wider">
                      Tanda Tangan Driver
                    </h4>
                    <img
                      src={selectedRecord.signature}
                      alt="TTD"
                      className="max-h-[90px] border border-border bg-white p-1 rounded-[8px] object-contain"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                  <button
                    type="button"
                    className="bg-primary-blue text-white px-4 py-2.5 rounded-[10px] font-bold cursor-pointer shadow-2xs hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 text-xs"
                    onClick={() => setDetailModalTab("pdf")}
                  >
                    <span>📄</span> Lihat Preview PDF Dokumen
                  </button>
                  <button
                    type="button"
                    className="bg-bg-sidebar text-text-muted border border-border px-4 py-2.5 rounded-[10px] font-bold cursor-pointer hover:bg-border hover:text-text-main transition-all text-xs"
                    onClick={() => setDetailOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Preview Dokumen PDF Resmi */}
            {detailModalTab === "pdf" && (
              <ChecklistPDFPreview
                record={selectedRecord}
                onPrintWindow={handleDownloadPDF}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Timesheet Detail Modal */}
      {tsDetailOpen && selectedLog && (
        <Modal
          isOpen={tsDetailOpen}
          onClose={() => setTsDetailOpen(false)}
          title={`Detail Log Timesheet - ${selectedLog.driverName}`}
          maxWidth="500px"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="bg-bg-sidebar p-4 rounded-[12px] border border-border grid grid-cols-2 gap-3">
              <div>
                <strong className="text-text-muted">Tanggal:</strong> {formatDateShort(selectedLog.logDate)} ({selectedLog.logDay})<br />
                <strong className="text-text-muted">Nama Driver:</strong> {escapeHtml(selectedLog.driverName)}<br />
                <strong className="text-text-muted">NIK:</strong> {selectedLog.driverNik || "-"}<br />
                <strong className="text-text-muted">No Polisi:</strong> {selectedLog.licensePlate || "-"}
              </div>
              <div>
                <strong className="text-text-muted">Jam Kerja:</strong> {selectedLog.workStart} - {selectedLog.workEnd}<br />
                <strong className="text-text-muted">KM Awal:</strong> {selectedLog.kmStart.toLocaleString()}<br />
                <strong className="text-text-muted">KM Akhir:</strong> {selectedLog.kmEnd.toLocaleString()}<br />
                <strong className="text-text-muted">Jarak Tempuh:</strong>{" "}
                <span className="text-primary-blue font-extrabold">
                  +{Math.max(0, selectedLog.kmEnd - selectedLog.kmStart).toLocaleString()} KM
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-[12px] border border-border space-y-1">
              <div>
                <strong className="text-text-muted">Pemakai / User:</strong>{" "}
                <span className="font-bold text-text-main">{escapeHtml(selectedLog.userName)}</span>
              </div>
              <div>
                <strong className="text-text-muted">Keterangan Tambahan:</strong>{" "}
                <span>{escapeHtml(selectedLog.remark) || "-"}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Tanda Tangan Digital Driver
              </h4>
              {selectedLog.userSignature ? (
                <div className="border border-border p-2 rounded-[10px] bg-white text-center">
                  <img
                    src={selectedLog.userSignature}
                    alt="TTD"
                    className="max-h-[110px] object-contain mx-auto"
                  />
                </div>
              ) : (
                <span className="text-text-muted text-xs font-medium">Belum ada tanda tangan.</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="bg-primary-blue text-white px-4 py-2 rounded-[10px] font-bold text-xs cursor-pointer shadow-2xs hover:bg-blue-700 transition-all inline-flex items-center gap-1.5"
                onClick={() => handlePrintTimesheetPDF(selectedLog)}
              >
                <span>📄</span> Cetak PDF Timesheet
              </button>
              <button
                type="button"
                className="bg-bg-sidebar text-text-muted border border-border px-4 py-2 rounded-[10px] font-bold text-xs cursor-pointer hover:bg-border hover:text-text-main transition-all"
                onClick={() => setTsDetailOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
