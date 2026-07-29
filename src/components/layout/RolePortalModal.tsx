"use client";

import { useAuth } from "@/context/AuthContext";
import Modal from "../ui/Modal";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RolePortalModal() {
  const {
    showRolePortal,
    setShowRolePortal,
    loginAdmin,
    setDriverProfile,
    driverName: contextDriverName,
    nik: contextNik,
  } = useAuth();
  const router = useRouter();
  const [showDriverNikInput, setShowDriverNikInput] = useState(false);
  const [driverNameInput, setDriverNameInput] = useState(contextDriverName || "");
  const [nikInput, setNikInput] = useState(contextNik || "");
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleSelectDriver = () => {
    setShowDriverNikInput(true);
    setShowAdminPin(false);
    if (contextDriverName) setDriverNameInput(contextDriverName);
    if (contextNik) setNikInput(contextNik);
  };

  const handleSubmitDriverAuth = () => {
    if (!driverNameInput.trim()) {
      alert("Harap masukkan Nama Driver Anda terlebih dahulu!");
      return;
    }
    if (!nikInput.trim()) {
      alert("Harap masukkan NIK Driver Anda terlebih dahulu!");
      return;
    }
    setDriverProfile(driverNameInput.trim(), nikInput.trim());
    setShowRolePortal(false);
    router.push("/driver");
  };

  const handleSelectAdmin = () => {
    setShowAdminPin(true);
    setShowDriverNikInput(false);
  };

  const handleSubmitPin = () => {
    if (loginAdmin(pinInput)) {
      setShowAdminPin(false);
      setPinError(false);
      setShowRolePortal(false);
      router.push("/admin");
    } else {
      setPinError(true);
    }
  };

  return (
    <Modal
      isOpen={showRolePortal}
      onClose={() => setShowRolePortal(false)}
      maxWidth="580px"
    >
      {!showDriverNikInput && !showAdminPin ? (
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/logo_pertamina_tk.png"
              alt="Pertamina Trans Kontinental"
              width={60}
              height={60}
              className="object-contain mx-auto mb-3"
            />
            <h2 className="text-2xl font-extrabold text-text-main">
              Selamat Datang
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Pilih jenis akses Anda untuk melanjutkan ke aplikasi PTK Digital
              Checklist
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 mt-6 max-md:grid-cols-1">
            <div
              className="bg-white border-2 border-border rounded-[16px] p-6 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 hover:border-primary-blue hover:shadow-lg transition-all"
              onClick={handleSelectDriver}
            >
              <div className="text-4xl w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 text-primary-blue">
                🚚
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">
                Masuk Sebagai Driver
              </h3>
              <p className="text-sm text-text-muted flex-1">
                Isi checklist harian, log perjalanan, dan pantau progres
                kilometer Anda.
              </p>
              <button
                type="button"
                className="bg-primary-blue text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer mt-4 w-full justify-center shadow-sm hover:bg-primary-blue-hover transition-all"
              >
                Akses Driver ➔
              </button>
            </div>

            <div
              className="bg-white border-2 border-border rounded-[16px] p-6 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 hover:border-primary-blue hover:shadow-lg transition-all"
              onClick={handleSelectAdmin}
            >
              <div className="text-4xl w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-primary-red">
                🔒
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">
                Masuk Sebagai Admin
              </h3>
              <p className="text-sm text-text-muted flex-1">
                Panel kontrol admin untuk memantau armada, verifikasi PIN, dan
                ekspor laporan Excel/PDF.
              </p>
              <button
                type="button"
                className="bg-primary-red text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer mt-4 w-full justify-center shadow-sm hover:bg-primary-red-hover transition-all"
              >
                Akses Admin ➔
              </button>
            </div>
          </div>
        </div>
      ) : showDriverNikInput ? (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">🔑 Masuk Akun Driver</h2>
          <p className="text-sm text-text-muted mb-4 text-left">
            Masukkan <strong>Nama Driver</strong> dan <strong>NIK Driver</strong> sebagai identitas akun Anda untuk menyimpan riwayat perjalanan dan checklist.
          </p>
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase">
                Nama Driver *
              </label>
              <input
                type="text"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                placeholder="Masukkan nama lengkap driver..."
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] text-base"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase">
                NIK Driver *
              </label>
              <input
                type="text"
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitDriverAuth()}
                placeholder="Masukkan NIK Driver Anda..."
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] text-base"
              />
            </div>
          </div>
          <button
            type="button"
            className="bg-primary-blue text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer mt-5 w-full justify-center shadow-sm hover:bg-primary-blue-hover transition-all text-base"
            onClick={handleSubmitDriverAuth}
          >
            🚀 Masuk ke Akun Driver
          </button>
          <button
            type="button"
            className="mt-3 bg-bg-sidebar text-text-muted border border-border px-5 py-3 rounded-[12px] font-semibold cursor-pointer w-full hover:bg-border hover:text-text-main transition-all"
            onClick={() => setShowDriverNikInput(false)}
          >
            Kembali
          </button>
        </div>
      ) : (

        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Verifikasi Admin</h2>
          <p className="text-sm text-text-muted mb-4">
            Masukkan PIN untuk mengakses Panel Admin.
          </p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitPin()}
            placeholder="PIN Admin"
            className="w-full text-center text-xl tracking-[5px] font-bold border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
            autoFocus
          />
          {pinError && (
            <p className="text-primary-red text-sm font-bold mt-2">
              PIN Salah! Silakan coba lagi.
            </p>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <button
              type="button"
              className="bg-primary-blue text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer shadow-sm hover:bg-primary-blue-hover transition-all"
              onClick={handleSubmitPin}
            >
              Masuk
            </button>
            <button
              type="button"
              className="bg-bg-sidebar text-text-muted border border-border px-5 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all"
              onClick={() => setShowAdminPin(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
