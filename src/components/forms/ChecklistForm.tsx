"use client";

import { useState, useCallback, useEffect } from "react";
import { useInspections } from "@/hooks/useInspections";
import { useSignaturePad } from "@/hooks/useSignaturePad";
import { useAuth } from "@/context/AuthContext";
import { CHECKLIST_ITEMS } from "@/types";
import type { DamagePin, ChecklistData } from "@/types";
import { getStoredNik, getStoredDriverName } from "@/lib/storage";
import { generateId, formatDateShort } from "@/lib/utils";
import StatusToggle from "../ui/StatusToggle";
import SignaturePad, { ClearButton } from "../ui/SignaturePad";
import FuelGauge from "../ui/FuelGauge";
import DamagePlotter from "../ui/DamagePlotter";

export default function ChecklistForm() {
  const { addRecord } = useInspections();
  const { nik: authNik, driverName: authDriverName } = useAuth();
  const sig = useSignaturePad();
  const sigRef = sig.canvasRef;

  const [driverNik, setDriverNik] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [mileageStart, setMileageStart] = useState("");
  const [mileageEnd, setMileageEnd] = useState("");
  const [fuelLevel, setFuelLevel] = useState(50);
  const [note1, setNote1] = useState("");
  const [note2, setNote2] = useState("");
  const [note3, setNote3] = useState("");
  const [damagePins, setDamagePins] = useState<DamagePin[]>([]);
  const [checklist, setChecklist] = useState<ChecklistData>({});
  const [inspectionDate] = useState(new Date().toISOString());

  useEffect(() => {
    const nik = getStoredNik() || authNik;
    if (nik) setDriverNik(nik);
    const name = getStoredDriverName() || authDriverName;
    if (name) setDriverName(name);

    const now = new Date();
    const el = document.getElementById("inspectionDateStr") as HTMLInputElement | null;
    if (el)
      el.value =
        now.toLocaleDateString("id-ID") + " " + now.toLocaleTimeString("id-ID");
  }, [authNik, authDriverName]);

  useEffect(() => {
    const initial: ChecklistData = {};
    CHECKLIST_ITEMS.forEach((item, idx) => {
      initial[String(idx + 1)] = { item, status: "ADA", note: "" };
    });
    setChecklist(initial);
  }, []);

  const handleChecklistChange = useCallback(
    (idNum: string, field: "status" | "note", value: string) => {
      setChecklist((prev) => ({
        ...prev,
        [idNum]: { ...prev[idNum], [field]: value },
      }));
    },
    []
  );

  const handleAddPin = useCallback((pin: DamagePin) => {
    setDamagePins((prev) => [...prev, pin]);
  }, []);

  const handleRemovePin = useCallback((id: string) => {
    setDamagePins((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!driverNik.trim()) {
        alert("NIK Driver tidak boleh kosong!");
        return;
      }
      if (!driverName.trim()) {
        alert("Nama driver tidak boleh kosong!");
        return;
      }
      if (!mileageStart || !mileageEnd) {
        alert("Kilometer Awal dan Kilometer Akhir harus diisi!");
        return;
      }
      const kmStart = parseInt(mileageStart) || 0;
      const kmEnd = parseInt(mileageEnd) || 0;
      if (kmEnd < kmStart) {
        alert("Kilometer Akhir tidak boleh lebih kecil dari Kilometer Awal!");
        return;
      }
      if (sig.isEmpty()) {
        alert("Harap isi tanda tangan driver terlebih dahulu!");
        return;
      }

      let attentionNeeded = false;
      Object.values(checklist).forEach((item) => {
        if (item.status === "TDK ADA") attentionNeeded = true;
      });
      if (damagePins.length > 0) attentionNeeded = true;

      const record = {
        inspectionId: generateId("insp"),
        inspectionDate,
        driver: { name: driverName.trim(), nik: driverNik.trim() },
        vehicle: {
          type: vehicleType.trim(),
          licensePlate: licensePlate.toUpperCase().trim(),
          mileageStart: kmStart,
          mileageEnd: kmEnd,
        },
        checklist,
        condition: {
          damages: damagePins,
          fuelLevel,
          notes: [note1, note2, note3],
        },
        signature: sig.getDataUrl(),
        attentionNeeded,
      };

      await addRecord(record);
      alert("Checklist Berhasil Disimpan!");

      // Reset
      setDriverName("");
      setVehicleType("");
      setLicensePlate("");
      setMileageStart("");
      setMileageEnd("");
      setFuelLevel(50);
      setNote1("");
      setNote2("");
      setNote3("");
      setDamagePins([]);
      sig.clear();
      const initial: ChecklistData = {};
      CHECKLIST_ITEMS.forEach((item, idx) => {
        initial[String(idx + 1)] = { item, status: "ADA", note: "" };
      });
      setChecklist(initial);
      const nik = getStoredNik() || authNik;
      if (nik) setDriverNik(nik);
      const name = getStoredDriverName() || authDriverName;
      if (name) setDriverName(name);
    },
    [
      driverNik, driverName, vehicleType, licensePlate, mileageStart, mileageEnd,
      fuelLevel, note1, note2, note3, damagePins, checklist, inspectionDate,
      sig, addRecord, authNik, authDriverName,
    ]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>📝</span> Data Driver & Kendaraan
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              NIK Driver *
            </label>
            <input
              type="text"
              value={driverNik}
              onChange={(e) => setDriverNik(e.target.value)}
              placeholder="Masukkan NIK Driver..."
              maxLength={50}
              required
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Nama Driver *
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              maxLength={100}
              required
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Jenis Kendaraan / Model
            </label>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="Contoh: Toyota Innova Reborn"
              maxLength={50}
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Nomor Polisi (Nopol)
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="Contoh: B 1234 PTK"
              maxLength={20}
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Kilometer Awal (KM) *
            </label>
            <input
              type="number"
              value={mileageStart}
              onChange={(e) => setMileageStart(e.target.value)}
              placeholder="KM awal jalan"
              required
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Kilometer Akhir (KM) *
            </label>
            <input
              type="number"
              value={mileageEnd}
              onChange={(e) => setMileageEnd(e.target.value)}
              placeholder="KM selesai jalan"
              required
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            />
          </div>
        </div>
      </div>

      {/* Section B: Perlengkapan Kendaraan */}
      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>⚙️</span> Perlengkapan Kendaraan
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border" style={{width:50}}>
                  No
                </th>
                <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">
                  Nama Perlengkapan
                </th>
                <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border text-center" style={{width:180}}>
                  Status
                </th>
                <th className="bg-bg-sidebar text-text-muted font-bold uppercase text-xs px-4 py-3 border-b border-border">
                  Keterangan (Catatan)
                </th>
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_ITEMS.map((item, idx) => {
                const idNum = String(idx + 1);
                const chk = checklist[idNum];
                return (
                  <tr key={idNum} className="hover:bg-bg-main">
                    <td className="px-4 py-3 border-b border-border">{idNum}</td>
                    <td className="px-4 py-3 border-b border-border font-medium">{item}</td>
                    <td className="px-4 py-3 border-b border-border text-center">
                      <StatusToggle
                        value={chk?.status || "ADA"}
                        onChange={(v) => handleChecklistChange(idNum, "status", v)}
                      />
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <input
                        type="text"
                        value={chk?.note || ""}
                        onChange={(e) => handleChecklistChange(idNum, "note", e.target.value)}
                        placeholder="Catatan tambahan..."
                        className="w-full border-2 border-border rounded-[12px] px-3 py-2 text-sm outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Kondisi Kendaraan & Fuel */}
      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>🚗</span> Kondisi Fisik & Bahan Bakar
        </div>
        <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
          <div>
            <DamagePlotter
              pins={damagePins}
              onAddPin={handleAddPin}
              onRemovePin={handleRemovePin}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase">
              Kapasitas Bahan Bakar (Fuel Gauge)
            </label>
            <FuelGauge value={fuelLevel} onChange={setFuelLevel} />

            <div className="flex flex-col gap-4 mt-8">
              <label className="text-xs font-bold text-text-muted uppercase">
                Catatan Tambahan
              </label>
              <input
                type="text"
                value={note1}
                onChange={(e) => setNote1(e.target.value)}
                placeholder="Catatan 1 (Keadaan Khusus/Penting)"
                maxLength={200}
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
              />
              <input
                type="text"
                value={note2}
                onChange={(e) => setNote2(e.target.value)}
                placeholder="Catatan 2 (Pembersihan/Kebersihan)"
                maxLength={200}
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
              />
              <input
                type="text"
                value={note3}
                onChange={(e) => setNote3(e.target.value)}
                placeholder="Catatan 3 (Lain-lain)"
                maxLength={200}
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none text-base focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Signature & Submit */}
      <div className="bg-white rounded-[16px] shadow-md p-8 mb-8 border border-border max-md:p-5">
        <div className="text-lg font-bold mb-6 flex items-center gap-2 border-b-2 border-bg-main pb-3">
          <span>✍️</span> Tanggal & Tanda Tangan Driver
        </div>
        <div className="grid grid-cols-[1fr_1.5fr] gap-6 max-md:grid-cols-1">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Tanggal Pemeriksaan
            </label>
            <input
              type="text"
              id="inspectionDateStr"
              readOnly
              className="w-full border-2 border-border rounded-[12px] px-4 py-3 bg-bg-sidebar outline-none text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Tanda Tangan Driver *
            </label>
            <div className="relative">
              <SignaturePad canvasRef={sigRef} />
              <ClearButton onClick={sig.clear} />
            </div>
          </div>
        </div>
        <div className="mt-8 text-right">
          <button
            type="submit"
            className="bg-primary-green text-white text-lg px-10 py-[0.85rem] rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-green-hover hover:-translate-y-[1px] hover:shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>💾</span> Simpan & Kirim Checklist
          </button>
        </div>
      </div>
    </form>
  );
}
