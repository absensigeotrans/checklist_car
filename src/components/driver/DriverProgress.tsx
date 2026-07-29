"use client";

import { useState, useMemo } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useDriverLogs } from "@/hooks/useDriverLogs";
import { useAuth } from "@/context/AuthContext";
import { getStoredNik, getStoredDriverName } from "@/lib/storage";
import { escapeHtml, formatDateShort } from "@/lib/utils";
import type { DriverLogEntry, InspectionRecord } from "@/types";

export default function DriverProgress() {
  const { nik: authNik, driverName: authDriverName, switchDriverNik, toggleRolePortal } = useAuth();
  const { records } = useInspections();
  const { logs } = useDriverLogs();

  const activeNik = authNik || getStoredNik();
  const activeDriverName = authDriverName || getStoredDriverName();

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeSubtab, setActiveSubtab] = useState<"log" | "checklist">("log");

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

  const metrics = useMemo(() => {
    const totalTrips = driverLogs.length;
    const totalKm = driverLogs.reduce(
      (sum, l) => sum + (l.kmEnd - l.kmStart),
      0
    );
    const totalInspections = driverInspections.length;
    const hasIssues = driverInspections.some((r) => r.attentionNeeded);
    const avgHealth = hasIssues ? "Perlu Perhatian" : "Normal";
    return { totalTrips, totalKm, totalInspections, avgHealth };
  }, [driverLogs, driverInspections]);

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
          <div className="flex flex-col gap-0 min-w-[100px]">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="border-2 border-border rounded-[12px] px-3 py-2 text-sm outline-none focus:border-primary-blue"
            >
              {[
                "Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember",
              ].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0 max-w-[100px]">
            <input
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="border-2 border-border rounded-[12px] px-3 py-2 text-sm outline-none focus:border-primary-blue"
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-6">
        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-blue-100 text-primary-blue">🚗</div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Total Perjalanan</h4>
            <p className="text-2xl font-bold text-text-main">{metrics.totalTrips} Log</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-green-100 text-primary-green">📍</div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Total Jarak Tempuh</h4>
            <p className="text-2xl font-bold text-text-main">{metrics.totalKm.toLocaleString()} KM</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className="text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 bg-yellow-100 text-yellow-700">📋</div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Checklist Kendaraan</h4>
            <p className="text-2xl font-bold text-text-main">{metrics.totalInspections} Kali</p>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-5 border border-border shadow-sm flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all">
          <div className={`text-3xl w-[54px] h-[54px] rounded-[12px] flex items-center justify-center flex-shrink-0 ${metrics.avgHealth === "Normal" ? "bg-green-100 text-primary-green" : "bg-red-100 text-primary-red"}`}>
            {metrics.avgHealth === "Normal" ? "✓" : "⚠️"}
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Kesehatan Fleets</h4>
            <p className={`text-lg font-bold ${metrics.avgHealth === "Normal" ? "text-primary-green" : "text-primary-red"}`}>{metrics.avgHealth}</p>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          type="button"
          className={`bg-none border-none px-5 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all ${
            activeSubtab === "log" ? "text-primary-blue border-b-[3px] border-primary-blue" : "text-text-muted"
          }`}
          onClick={() => setActiveSubtab("log")}
        >
          📋 Rekap Log Sheet Harian
        </button>
        <button
          type="button"
          className={`bg-none border-none px-5 py-3 font-bold text-sm cursor-pointer border-b-3 border-transparent transition-all ${
            activeSubtab === "checklist" ? "text-primary-blue border-b-[3px] border-primary-blue" : "text-text-muted"
          }`}
          onClick={() => setActiveSubtab("checklist")}
        >
          🔍 Rekap Checklist Kendaraan
        </button>
      </div>

      {/* Log Sheet Table */}
      {activeSubtab === "log" && (
        <div className="bg-white rounded-[16px] shadow-md p-6 border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border" style={{width:50}}>Tgl</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border" style={{width:70}}>Hari</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border" style={{width:100}}>Nopol</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Jam Kerja</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">KM (Awal - Akhir)</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Jarak</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Pemakai</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border" style={{width:80}}>TTD</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Ket</th>
                </tr>
              </thead>
              <tbody>
                {driverLogs.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-text-muted px-3 py-8">Belum ada log sheet untuk bulan ini.</td></tr>
                ) : (
                  driverLogs.map((l) => (
                    <tr key={l.logId} className="hover:bg-bg-main">
                      <td className="px-3 py-3 border-b border-border text-xs text-center">{formatDateShort(l.logDate)}</td>
                      <td className="px-3 py-3 border-b border-border text-xs">{l.logDay}</td>
                      <td className="px-3 py-3 border-b border-border text-xs">{l.licensePlate}</td>
                      <td className="px-3 py-3 border-b border-border text-xs">{l.workStart} - {l.workEnd}</td>
                      <td className="px-3 py-3 border-b border-border text-xs">{l.kmStart.toLocaleString()} - {l.kmEnd.toLocaleString()}</td>
                      <td className="px-3 py-3 border-b border-border text-xs font-bold">{(l.kmEnd - l.kmStart).toLocaleString()} KM</td>
                      <td className="px-3 py-3 border-b border-border text-xs">{escapeHtml(l.userName)}</td>
                      <td className="px-3 py-3 border-b border-border text-xs text-center">
                        {l.userSignature ? (
                          <img src={l.userSignature} alt="TTD" className="max-h-[30px] max-w-[60px] object-contain align-middle" />
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 border-b border-border text-xs">{escapeHtml(l.remark)}</td>
                    </tr>
                  ))
                )}
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
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Tanggal</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Kendaraan</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Nopol</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">KM</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">BBM</th>
                  <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-3 py-3 border-b border-border">Temuan</th>
                </tr>
              </thead>
              <tbody>
                {driverInspections.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-text-muted px-3 py-8">Belum ada checklist untuk bulan ini.</td></tr>
                ) : (
                  driverInspections.map((r) => {
                    const missingCount = Object.values(r.checklist || {}).filter((i) => i?.status === "TDK ADA").length;
                    const damageCount = (r.condition?.damages || []).length;
                    return (
                      <tr key={r.inspectionId} className="hover:bg-bg-main">
                        <td className="px-3 py-3 border-b border-border text-xs">{formatDateShort(r.inspectionDate)}</td>
                        <td className="px-3 py-3 border-b border-border text-xs">{r.vehicle.type || "-"}</td>
                        <td className="px-3 py-3 border-b border-border text-xs">{r.vehicle.licensePlate || "-"}</td>
                        <td className="px-3 py-3 border-b border-border text-xs">{r.vehicle.mileageStart.toLocaleString()} - {r.vehicle.mileageEnd.toLocaleString()}</td>
                        <td className="px-3 py-3 border-b border-border text-xs">{r.condition.fuelLevel}%</td>
                        <td className={`px-3 py-3 border-b border-border text-xs font-bold ${r.attentionNeeded ? "text-primary-red" : "text-primary-green"}`}>
                          {r.attentionNeeded ? `${missingCount} Absen, ${damageCount} Rusak` : "Normal"}
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
    </div>
  );
}
