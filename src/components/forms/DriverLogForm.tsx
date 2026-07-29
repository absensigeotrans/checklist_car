"use client";

import { useState, useCallback, useEffect } from "react";
import { useDriverLogs } from "@/hooks/useDriverLogs";
import { useSignaturePad } from "@/hooks/useSignaturePad";
import { useAuth } from "@/context/AuthContext";
import { getStoredNik, getStoredDriverName } from "@/lib/storage";
import { getDayFromDate, generateId } from "@/lib/utils";
import SignaturePad, { ClearButton } from "../ui/SignaturePad";

export default function DriverLogForm() {
  const { addLog } = useDriverLogs();
  const { nik: authNik, driverName: authDriverName } = useAuth();
  const userSig = useSignaturePad();

  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logDay, setLogDay] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [kmEnd, setKmEnd] = useState("");
  const [userName, setUserName] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const savedNik = getStoredNik() || authNik;
    if (savedNik) setNik(savedNik);
    const savedName = getStoredDriverName() || authDriverName;
    if (savedName) setName(savedName);

    const today = new Date().toISOString().split("T")[0];
    setLogDate(today);
    setLogDay(getDayFromDate(today));
  }, [authNik, authDriverName]);

  const handleDateChange = useCallback((date: string) => {
    setLogDate(date);
    setLogDay(getDayFromDate(date));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nik.trim() || !name.trim() || !plate.trim() || !logDate || !workStart || !workEnd || !kmStart || !kmEnd || !userName.trim()) {
        alert("Harap isi semua field yang wajib!");
        return;
      }

      const entry = {
        logId: generateId("log"),
        driverName: name.trim(),
        driverNik: nik.trim(),
        licensePlate: plate.toUpperCase().trim(),
        logDate,
        logDay,
        workStart,
        workEnd,
        kmStart: parseInt(kmStart) || 0,
        kmEnd: parseInt(kmEnd) || 0,
        userName: userName.trim(),
        userSignature: userSig.getDataUrl(),
        remark: remark.trim(),
      };

      await addLog(entry);
      alert("Log Harian Berhasil Disimpan!");

      setName("");
      setPlate("");
      setWorkStart("");
      setWorkEnd("");
      setKmStart("");
      setKmEnd("");
      setUserName("");
      setRemark("");
      userSig.clear();
      const savedNik = getStoredNik() || authNik;
      if (savedNik) setNik(savedNik);
      const savedName = getStoredDriverName() || authDriverName;
      if (savedName) setName(savedName);
      const today = new Date().toISOString().split("T")[0];
      setLogDate(today);
      setLogDay(getDayFromDate(today));
    },
    [nik, name, plate, logDate, logDay, workStart, workEnd, kmStart, kmEnd, userName, remark, userSig, addLog, authNik, authDriverName]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>📋</span> Data Driver & Timesheet Harian
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">NIK Driver *</label>
            <input type="text" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Ketik NIK..." maxLength={50} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Nama Driver *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Supriadi" maxLength={100} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Nomor Polisi *</label>
            <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Contoh: B 1234 PTK" maxLength={20} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Tanggal Perjalanan *</label>
            <input type="date" value={logDate} onChange={(e) => handleDateChange(e.target.value)} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Hari</label>
            <input type="text" value={logDay} readOnly className="w-full border-2 border-border rounded-[12px] px-4 py-3 bg-bg-sidebar outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mt-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Jam Kerja Awal (Start) *</label>
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Jam Kerja Akhir (Finish) *</label>
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">KM Awal (Start) *</label>
            <input type="number" value={kmStart} onChange={(e) => setKmStart(e.target.value)} placeholder="Contoh: 10200" required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">KM Akhir (Finish) *</label>
            <input type="number" value={kmEnd} onChange={(e) => setKmEnd(e.target.value)} placeholder="Contoh: 10350" required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>👤</span> Data Pemakai (User) & Tanda Tangan
        </div>
        <div className="grid grid-cols-[1fr_1.5fr] gap-6 max-md:grid-cols-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Nama Pemakai (User) *</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Contoh: Pak Manager / Pak Budi" maxLength={100} required className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Keterangan (Remark)</label>
              <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Contoh: Perjalanan dinas Jabodetabek" maxLength={200} className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Tanda Tangan Pemakai (User) (Opsional)</label>
            <div className="relative">
              <SignaturePad canvasRef={userSig.canvasRef} />
              <ClearButton onClick={userSig.clear} />
            </div>
          </div>
        </div>
        <div className="mt-8 text-right">
          <button type="submit" className="bg-primary-green text-white text-lg px-10 py-[0.85rem] rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-green-hover hover:-translate-y-[1px] hover:shadow-md transition-all inline-flex items-center gap-2">
            <span>💾</span> Simpan Log Harian
          </button>
        </div>
      </div>
    </form>
  );
}
