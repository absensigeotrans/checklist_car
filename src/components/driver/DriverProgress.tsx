"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useDriverLogs } from "@/hooks/useDriverLogs";
import { useAuth } from "@/context/AuthContext";
import { getStoredNik, getStoredDriverName } from "@/lib/storage";
import { escapeHtml, formatDateShort } from "@/lib/utils";
import type { DriverLogEntry, InspectionRecord } from "@/types";
import { prepareTimesheetPrintMarkup } from "@/lib/export";
import Modal from "../ui/Modal";

const INDO_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

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

export default function DriverProgress() {
  const {
    nik: authNik,
    driverName: authDriverName,
    switchDriverNik,
    toggleRolePortal,
  } = useAuth();
  const { records } = useInspections();
  const { logs, addLog, updateLog } = useDriverLogs();

  const activeNik = authNik || getStoredNik();
  const activeDriverName = authDriverName || getStoredDriverName();

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeSubtab, setActiveSubtab] = useState<"log" | "checklist">("log");

  // Modal Signature State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [editingTargetDate, setEditingTargetDate] = useState<string>("");
  const [editingDayName, setEditingDayName] = useState<string>("");
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  // Form Fields State inside Modal
  const [modalPlate, setModalPlate] = useState("");
  const [modalWorkStart, setModalWorkStart] = useState("08:00");
  const [modalWorkEnd, setModalWorkEnd] = useState("17:00");
  const [modalKmStart, setModalKmStart] = useState<number | "">(0);
  const [modalKmEnd, setModalKmEnd] = useState<number | "">(0);
  const [modalUserName, setModalUserName] = useState("");
  const [modalRemark, setModalRemark] = useState("");
  const [modalSignature, setModalSignature] = useState("");

  const driverLogs = useMemo(
    () =>
      logs.filter((l) => {
        const date = new Date(l.logDate);
        const matchesNik = activeNik ? l.driverNik === activeNik : true;
        return (
          matchesNik &&
          date.getMonth() + 1 === filterMonth &&
          date.getFullYear() === filterYear
        );
      }),
    [logs, activeNik, filterMonth, filterYear]
  );

  const driverInspections = useMemo(
    () =>
      records.filter((r) => {
        const date = new Date(r.inspectionDate);
        const matchesNik = activeNik ? r.driver.nik === activeNik : true;
        return (
          matchesNik &&
          date.getMonth() + 1 === filterMonth &&
          date.getFullYear() === filterYear
        );
      }),
    [records, activeNik, filterMonth, filterYear]
  );

  const latestInfo =
    driverLogs.length > 0
      ? {
          name: driverLogs[0].driverName,
          plate: driverLogs[0].licensePlate,
        }
      : driverInspections.length > 0
      ? {
          name: driverInspections[0].driver.name,
          plate: driverInspections[0].vehicle.licensePlate,
        }
      : null;

  const displayName = activeDriverName || latestInfo?.name || "Semua Driver";

  // Generate full calendar days (1 to end of month)
  const fullMonthRows = useMemo(() => {
    const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
    const result = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(filterYear, filterMonth - 1, d);
      const dateStr = `${filterYear}-${String(filterMonth).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      const dayName = INDO_DAYS[dateObj.getDay()];

      // Find matching log for this date
      const matchedLog = driverLogs.find((l) => {
        return l.logDate.startsWith(dateStr) || l.logDate === dateStr;
      });

      result.push({
        dayNumber: d,
        dateStr,
        dayName,
        log: matchedLog || null,
      });
    }

    return result;
  }, [filterYear, filterMonth, driverLogs]);

  const metrics = useMemo(() => {
    const filledLogs = driverLogs.length;
    const totalKm = driverLogs.reduce(
      (sum, l) => sum + (l.kmEnd - l.kmStart),
      0
    );
    const totalInspections = driverInspections.length;
    const signedCount = fullMonthRows.filter(
      (r) => r.log && r.log.userSignature
    ).length;
    return { filledLogs, totalKm, totalInspections, signedCount };
  }, [driverLogs, driverInspections, fullMonthRows]);

  // Open modal to sign or edit signature for a specific date
  const handleOpenSignatureModal = (dateStr: string, dayName: string, log: DriverLogEntry | null) => {
    setEditingTargetDate(dateStr);
    setEditingDayName(dayName);
    if (log) {
      setExistingLogId(log.logId);
      setModalPlate(log.licensePlate || latestInfo?.plate || "");
      setModalWorkStart(log.workStart || "08:00");
      setModalWorkEnd(log.workEnd || "17:00");
      setModalKmStart(log.kmStart || 0);
      setModalKmEnd(log.kmEnd || 0);
      setModalUserName(log.userName || displayName);
      setModalRemark(log.remark || "");
      setModalSignature(log.userSignature || "");
    } else {
      setExistingLogId(null);
      setModalPlate(latestInfo?.plate || "");
      setModalWorkStart("08:00");
      setModalWorkEnd("17:00");
      setModalKmStart(0);
      setModalKmEnd(0);
      setModalUserName(displayName !== "Semua Driver" ? displayName : "");
      setModalRemark("");
      setModalSignature("");
    }
    setShowSignatureModal(true);
  };

  // Submit Signature & Timesheet Entry
  const handleSaveSignature = () => {
    if (!modalSignature) {
      alert("Harap goreskan tanda tangan Anda pada canvas terlebih dahulu!");
      return;
    }

    const kmS = Number(modalKmStart) || 0;
    const kmE = Number(modalKmEnd) || 0;

    if (existingLogId) {
      // Update existing log
      const existing = logs.find((l) => l.logId === existingLogId);
      if (existing) {
        updateLog({
          ...existing,
          licensePlate: modalPlate,
          workStart: modalWorkStart,
          workEnd: modalWorkEnd,
          kmStart: kmS,
          kmEnd: kmE,
          userName: modalUserName,
          userSignature: modalSignature,
          remark: modalRemark,
        });
      }
    } else {
      // Create new log entry for this date
      const newEntry: DriverLogEntry = {
        logId: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        driverName: activeDriverName || "Driver " + (activeNik || ""),
        driverNik: activeNik || "9999",
        licensePlate: modalPlate || "B 1234 PTK",
        logDate: editingTargetDate,
        logDay: editingDayName,
        workStart: modalWorkStart,
        workEnd: modalWorkEnd,
        kmStart: kmS,
        kmEnd: kmE,
        userName: modalUserName || activeDriverName,
        userSignature: modalSignature,
        remark: modalRemark,
      };
      addLog(newEntry);
    }

    setShowSignatureModal(false);
  };

  const handlePrintTimesheetPDF = () => {
    const markup = prepareTimesheetPrintMarkup(
      driverLogs,
      displayName,
      activeNik,
      filterMonth,
      filterYear
    );
    const fileName = `Timesheet_${displayName.replace(/\s+/g, "_")}_${String(filterMonth).padStart(2, "0")}_${filterYear}`;
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
      @page { size: A4 landscape; margin: 6mm; }
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


  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-bg-sidebar p-5 rounded-[16px] border border-border mb-6">
        <div className="flex items-center gap-4">
          <div className="w-[50px] h-[50px] rounded-full bg-primary-blue text-white flex items-center justify-center text-2xl font-bold shadow-sm">
            {displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">
              {displayName}
            </h2>
            <span className="text-sm text-text-muted font-semibold">
              {activeNik ? (
                <>
                  NIK: <strong className="text-primary-blue">{activeNik}</strong>
                </>
              ) : (
                "Rekap Armada PTK"
              )}
              {latestInfo?.plate && (
                <>
                  {" "}| Nopol Terakhir: <strong>{latestInfo.plate}</strong>
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-0 min-w-[120px]">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="border-2 border-border rounded-[12px] px-3 py-2 text-sm outline-none focus:border-primary-blue bg-white font-semibold"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0 max-w-[100px]">
            <input
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="border-2 border-border rounded-[12px] px-3 py-2 text-sm outline-none focus:border-primary-blue bg-white font-semibold"
            />
          </div>
          {activeNik ? (
            <button
              type="button"
              className="bg-bg-sidebar text-text-muted border border-border px-3 py-2 rounded-[12px] font-semibold cursor-pointer text-sm hover:bg-border hover:text-text-main transition-all"
              onClick={switchDriverNik}
            >
              <span>🔄</span> Ganti Akun Driver
            </button>
          ) : (
            <button
              type="button"
              className="bg-primary-blue text-white px-3 py-2 rounded-[12px] font-semibold cursor-pointer text-sm hover:bg-primary-blue-hover transition-all"
              onClick={toggleRolePortal}
            >
              <span>🔑</span> Masuk Akun Driver
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-md:gap-2.5 mb-6">
        <div className="bg-white rounded-[12px] p-4 max-md:p-3 border border-border shadow-sm flex items-center gap-3 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-blue-100 text-primary-blue">
            📅
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Total Log Terisi
            </h4>
            <p className="text-2xl font-bold text-text-main">
              {metrics.filledLogs} / {fullMonthRows.length} Hari
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-green-100 text-primary-green">
            ✍️
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">
              TTD Terverifikasi
            </h4>
            <p className="text-2xl font-bold text-primary-green">
              {metrics.signedCount} Hari
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
            📍
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Total Jarak Tempuh
            </h4>
            <p className="text-2xl font-bold text-text-main">
              {metrics.totalKm.toLocaleString()} KM
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-yellow-100 text-yellow-700">
            📋
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Checklist Kendaraan
            </h4>
            <p className="text-2xl font-bold text-text-main">
              {metrics.totalInspections} Kali
            </p>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          type="button"
          className={`bg-none border-none px-5 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all ${
            activeSubtab === "log"
              ? "text-primary-blue border-b-[3px] border-primary-blue"
              : "text-text-muted"
          }`}
          onClick={() => setActiveSubtab("log")}
        >
          📋 Rekap Timesheet Harian ({MONTH_NAMES[filterMonth - 1]} {filterYear})
        </button>
        <button
          type="button"
          className={`bg-none border-none px-5 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all ${
            activeSubtab === "checklist"
              ? "text-primary-blue border-b-[3px] border-primary-blue"
              : "text-text-muted"
          }`}
          onClick={() => setActiveSubtab("checklist")}
        >
          🔍 Rekap Checklist Kendaraan
        </button>
      </div>

      {/* Log Sheet / Timesheet Table (Full 1 to End Month Grid) */}
      {activeSubtab === "log" && (
        <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-base font-bold text-text-main">
              Rekapitulasi Timesheet Harian Driver
            </h3>
            <button
              type="button"
              className="bg-primary-blue text-white px-4 py-2 rounded-[10px] font-semibold text-xs cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all inline-flex items-center gap-1.5"
              onClick={handlePrintTimesheetPDF}
            >
              <span>📄</span> Cetak / PDF Timesheet
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border text-center"
                    style={{ width: 60 }}
                  >
                    Tgl
                  </th>
                  <th
                    className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border"
                    style={{ width: 80 }}
                  >
                    Hari
                  </th>
                  <th
                    className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border"
                    style={{ width: 110 }}
                  >
                    Nopol
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Jam Kerja
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    KM (Awal - Akhir)
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Jarak
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Pemakai
                  </th>
                  <th
                    className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border text-center"
                    style={{ width: 120 }}
                  >
                    TTD
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Ket
                  </th>
                </tr>
              </thead>
              <tbody>
                {fullMonthRows.map((row) => {
                  const l = row.log;
                  const hasLog = Boolean(l);

                  return (
                    <tr
                      key={row.dateStr}
                      className={`hover:bg-blue-50/50 transition-all ${
                        hasLog ? "bg-white" : "bg-gray-50/40 text-text-muted"
                      }`}
                    >
                      <td className="px-3 py-3 border-b border-border text-xs text-center font-bold text-text-main">
                        {row.dayNumber}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs font-semibold">
                        {row.dayName}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">
                        {l?.licensePlate || "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">
                        {l ? `${l.workStart} - ${l.workEnd}` : "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">
                        {l
                          ? `${l.kmStart.toLocaleString()} - ${l.kmEnd.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs font-bold text-primary-blue">
                        {l ? `${(l.kmEnd - l.kmStart).toLocaleString()} KM` : "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">
                        {l ? escapeHtml(l.userName) : "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs text-center">
                        {l?.userSignature ? (
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={l.userSignature}
                              alt="TTD"
                              className="max-h-[32px] max-w-[80px] object-contain border border-border rounded bg-white p-0.5"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignatureModal(row.dateStr, row.dayName, l)
                              }
                              className="text-[10px] text-primary-blue hover:underline font-semibold cursor-pointer"
                            >
                              ✏️ Ubah TTD
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenSignatureModal(row.dateStr, row.dayName, l)
                            }
                            className="bg-green-100 text-primary-green hover:bg-primary-green hover:text-white px-2.5 py-1 rounded-[8px] font-bold text-xs cursor-pointer border border-green-300 transition-all inline-flex items-center gap-1"
                          >
                            <span>✍️</span> TTD
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">
                        {l ? escapeHtml(l.remark) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checklist Table */}
      {activeSubtab === "checklist" && (
        <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Tanggal
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Kendaraan
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Nopol
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    KM
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    BBM
                  </th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">
                    Temuan
                  </th>
                </tr>
              </thead>
              <tbody>
                {driverInspections.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-text-muted px-3 py-8"
                    >
                      Belum ada checklist untuk bulan ini.
                    </td>
                  </tr>
                ) : (
                  driverInspections.map((r) => {
                    const missingCount = Object.values(
                      r.checklist || {}
                    ).filter((i) => i?.status === "TDK ADA").length;
                    const damageCount = (r.condition?.damages || []).length;
                    return (
                      <tr key={r.inspectionId} className="hover:bg-bg-main">
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {formatDateShort(r.inspectionDate)}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {r.vehicle.type || "-"}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {r.vehicle.licensePlate || "-"}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {r.vehicle.mileageStart.toLocaleString()} -{" "}
                          {r.vehicle.mileageEnd.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 border-b border-border text-xs">
                          {r.condition.fuelLevel}%
                        </td>
                        <td
                          className={`px-3 py-3 border-b border-border text-xs font-bold ${
                            r.attentionNeeded
                              ? "text-primary-red"
                              : "text-primary-green"
                          }`}
                        >
                          {r.attentionNeeded
                            ? `${missingCount} Absen, ${damageCount} Rusak`
                            : "Normal"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signature & Timesheet Entry Modal */}
      {showSignatureModal && (
        <Modal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          maxWidth="520px"
        >
          <div className="text-left">
            <h3 className="text-lg font-bold text-text-main mb-1">
              ✍️ Tanda Tangan Timesheet Tanggal {formatDateShort(editingTargetDate)}
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Hari {editingDayName} | Driver: <strong>{displayName}</strong>
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase">
                    Nopol Kendaraan
                  </label>
                  <input
                    type="text"
                    value={modalPlate}
                    onChange={(e) => setModalPlate(e.target.value)}
                    placeholder="B 1234 PTK"
                    className="w-full border border-border rounded-[8px] px-3 py-2 text-xs outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase">
                    Pemakai / User
                  </label>
                  <input
                    type="text"
                    value={modalUserName}
                    onChange={(e) => setModalUserName(e.target.value)}
                    placeholder="Nama pemakai..."
                    className="w-full border border-border rounded-[8px] px-3 py-2 text-xs outline-none focus:border-primary-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase">
                    Jam Kerja (Mulai - Selesai)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={modalWorkStart}
                      onChange={(e) => setModalWorkStart(e.target.value)}
                      className="w-full border border-border rounded-[8px] px-2 py-1.5 text-xs outline-none focus:border-primary-blue"
                    />
                    <span className="text-xs text-text-muted">-</span>
                    <input
                      type="time"
                      value={modalWorkEnd}
                      onChange={(e) => setModalWorkEnd(e.target.value)}
                      className="w-full border border-border rounded-[8px] px-2 py-1.5 text-xs outline-none focus:border-primary-blue"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase">
                    KM (Awal - Akhir)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={modalKmStart}
                      onChange={(e) =>
                        setModalKmStart(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="KM Awal"
                      className="w-full border border-border rounded-[8px] px-2 py-1.5 text-xs outline-none focus:border-primary-blue"
                    />
                    <span className="text-xs text-text-muted">-</span>
                    <input
                      type="number"
                      value={modalKmEnd}
                      onChange={(e) =>
                        setModalKmEnd(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="KM Akhir"
                      className="w-full border border-border rounded-[8px] px-2 py-1.5 text-xs outline-none focus:border-primary-blue"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase mb-1 block">
                  Tanda Tangan Digital *
                </label>
                <SignatureCanvasPad
                  value={modalSignature}
                  onChange={setModalSignature}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={modalRemark}
                  onChange={(e) => setModalRemark(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full border border-border rounded-[8px] px-3 py-2 text-xs outline-none focus:border-primary-blue"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                className="bg-bg-sidebar text-text-muted border border-border px-4 py-2 rounded-[10px] font-semibold text-xs cursor-pointer hover:bg-border hover:text-text-main transition-all"
                onClick={() => setShowSignatureModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="bg-primary-green text-white px-5 py-2 rounded-[10px] font-semibold text-xs cursor-pointer shadow-sm hover:bg-primary-green-hover transition-all"
                onClick={handleSaveSignature}
              >
                💾 Simpan TTD & Timesheet
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Inner HTML5 Canvas Signature Pad Component
function SignatureCanvasPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="border-2 border-dashed border-border rounded-[12px] bg-gray-50 p-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={450}
          height={140}
          className="bg-white rounded-[8px] cursor-crosshair touch-none w-full max-w-[450px] h-[140px] shadow-inner"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-text-muted">
          Goreskan tanda tangan Anda di dalam kotak di atas
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-primary-red hover:underline font-semibold cursor-pointer"
        >
          🗑️ Bersihkan TTD
        </button>
      </div>
    </div>
  );
}
