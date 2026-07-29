"use client";

import { useAuth } from "@/context/AuthContext";
import Modal from "../ui/Modal";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisteredDrivers } from "@/hooks/useRegisteredDrivers";

type PortalViewMode = "portal" | "driver-login" | "driver-register" | "admin-pin";

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
  const { drivers: registeredDrivers, registerDriver } = useRegisteredDrivers();

  const [viewMode, setViewMode] = useState<PortalViewMode>("portal");
  const [driverNameInput, setDriverNameInput] = useState(contextDriverName || "");
  const [nikInput, setNikInput] = useState(contextNik || "");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleOpenRegister = () => {
    setViewMode("driver-register");
    setDriverNameInput(contextDriverName || "");
    setNikInput(contextNik || "");
  };

  const handleOpenLogin = () => {
    setViewMode("driver-login");
    setNikInput(contextNik || "");
  };

  const handleOpenAdmin = () => {
    setViewMode("admin-pin");
    setPinInput("");
    setPinError(false);
  };

  const handleRegisterDriver = async () => {
    const name = driverNameInput.trim();
    const nik = nikInput.trim();
    if (!name) {
      alert("Harap masukkan Nama Driver Anda!");
      return;
    }
    if (!nik) {
      alert("Harap masukkan NIK Driver Anda!");
      return;
    }

    // Save profile to registered drivers (syncs to Supabase)
    await registerDriver(name, nik);

    alert(
      `✅ Pendaftaran Akun Driver Berhasil!\n\nDriver: ${name}\nNIK: ${nik}\n\nSilakan masuk melalui halaman 'Masuk Sebagai Driver' untuk login ke akun Anda.`
    );

    // Switch view mode to Login Driver with NIK prefilled
    setViewMode("driver-login");
  };

  const handleLoginDriver = () => {
    const nik = nikInput.trim();
    if (!nik) {
      alert("Harap masukkan NIK Driver Anda untuk login!");
      return;
    }

    // Check registered drivers list (from Supabase-synced state)
    const found = registeredDrivers.find(
      (d) => d.nik.toLowerCase() === nik.toLowerCase()
    );

    if (!found) {
      alert(
        `❌ NIK Driver "${nik}" belum terdaftar dalam sistem!\n\nSilakan daftarkan NIK & Nama Driver Anda terlebih dahulu melalui menu 'Daftar NIK & Nama Driver'.`
      );
      // Automatically switch to registration view with prefilled NIK
      setViewMode("driver-register");
      return;
    }

    // NIK is registered! Successfully login with registered profile
    setDriverProfile(found.name, found.nik);
    setShowRolePortal(false);
    router.push("/driver");
  };

  const handleSubmitPin = () => {
    if (loginAdmin(pinInput)) {
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
      maxWidth={viewMode === "portal" ? "820px" : "520px"}
    >
      {viewMode === "portal" ? (
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/logo_pertamina_tk.png"
              alt="Pertamina Trans Kontinental"
              width={180}
              height={60}
              priority
              unoptimized
              className="h-14 w-auto object-contain mx-auto mb-3"
            />
            <h2 className="text-2xl font-extrabold text-text-main">
              Selamat Datang
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Pilih jenis akses Anda untuk melanjutkan ke aplikasi PTK Digital Checklist
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5 mt-6 max-md:grid-cols-1">
            {/* Card 1: Masuk Driver */}
            <div
              className="bg-white border-2 border-border rounded-[16px] p-5 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 hover:border-primary-blue hover:shadow-lg transition-all"
              onClick={handleOpenLogin}
            >
              <div className="text-3xl w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-blue-100 text-primary-blue">
                🚚
              </div>
              <h3 className="text-base font-bold text-text-main mb-1.5">
                Masuk Sebagai Driver
              </h3>
              <p className="text-xs text-text-muted flex-1">
                Masuk ke akun driver Anda untuk isi checklist & log perjalanan.
              </p>
              <button
                type="button"
                className="bg-primary-blue text-white text-sm px-4 py-2.5 rounded-[12px] font-semibold cursor-pointer mt-4 w-full justify-center shadow-sm hover:bg-primary-blue-hover transition-all"
              >
                Akses Driver ➔
              </button>
            </div>

            {/* Card 2: Registrasi NIK & Nama Driver */}
            <div
              className="bg-white border-2 border-border rounded-[16px] p-5 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 hover:border-primary-green hover:shadow-lg transition-all"
              onClick={handleOpenRegister}
            >
              <div className="text-3xl w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-green-100 text-primary-green">
                📝
              </div>
              <h3 className="text-base font-bold text-text-main mb-1.5">
                Daftar NIK & Nama Driver
              </h3>
              <p className="text-xs text-text-muted flex-1">
                Daftarkan NIK & Nama Driver baru sebagai modal awal akun Anda.
              </p>
              <button
                type="button"
                className="bg-primary-green text-white text-sm px-4 py-2.5 rounded-[12px] font-semibold cursor-pointer mt-4 w-full justify-center shadow-sm hover:bg-primary-green-hover transition-all"
              >
                Daftar Driver ➔
              </button>
            </div>

            {/* Card 3: Admin */}
            <div
              className="bg-white border-2 border-border rounded-[16px] p-5 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 hover:border-primary-red hover:shadow-lg transition-all"
              onClick={handleOpenAdmin}
            >
              <div className="text-3xl w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-red-100 text-primary-red">
                🔒
              </div>
              <h3 className="text-base font-bold text-text-main mb-1.5">
                Masuk Sebagai Admin
              </h3>
              <p className="text-xs text-text-muted flex-1">
                Panel kontrol admin untuk memantau armada, PIN, & ekspor laporan.
              </p>
              <button
                type="button"
                className="bg-primary-red text-white text-sm px-4 py-2.5 rounded-[12px] font-semibold cursor-pointer mt-4 w-full justify-center shadow-sm hover:bg-primary-red-hover transition-all"
              >
                Akses Admin ➔
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === "driver-register" ? (
        <div className="text-center">
          <div className="text-4xl inline-block bg-green-100 w-16 h-16 leading-[64px] rounded-full shadow-sm mb-3 text-primary-green">
            📝
          </div>
          <h2 className="text-xl font-bold mb-2">Formulir Pendaftaran Driver</h2>
          <p className="text-xs text-text-muted mb-5 text-left">
            Masukkan <strong>Nama Driver</strong> dan <strong>NIK Driver</strong> Anda untuk mendaftarkan akun baru.
          </p>
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
                Nama Driver *
              </label>
              <input
                type="text"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                placeholder="Masukkan nama lengkap driver..."
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-green focus:shadow-[0_0_0_4px_hsl(145,63%,92%)] text-base"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
                NIK Driver *
              </label>
              <input
                type="text"
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegisterDriver()}
                placeholder="Masukkan NIK Driver..."
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-green focus:shadow-[0_0_0_4px_hsl(145,63%,92%)] text-base"
              />
            </div>
          </div>
          <button
            type="button"
            className="bg-primary-green text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer mt-5 w-full justify-center shadow-sm hover:bg-primary-green-hover transition-all text-base"
            onClick={handleRegisterDriver}
          >
            💾 Simpan & Daftarkan Driver
          </button>
          <button
            type="button"
            className="mt-3 bg-bg-sidebar text-text-muted border border-border px-5 py-3 rounded-[12px] font-semibold cursor-pointer w-full hover:bg-border hover:text-text-main transition-all"
            onClick={() => setViewMode("portal")}
          >
            Kembali ke Menu Utama
          </button>
        </div>
      ) : viewMode === "driver-login" ? (
        <div className="text-center">
          <div className="text-4xl inline-block bg-blue-100 w-16 h-16 leading-[64px] rounded-full shadow-sm mb-3 text-primary-blue">
            🔑
          </div>
          <h2 className="text-xl font-bold mb-2">Masuk Akun Driver</h2>
          <p className="text-xs text-text-muted mb-5 text-left">
            Masukkan <strong>NIK Driver</strong> Anda yang sudah terdaftar untuk masuk ke akun aplikasi.
          </p>
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide">
                NIK Driver *
              </label>
              <input
                type="text"
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoginDriver()}
                placeholder="Masukkan NIK Driver Anda..."
                className="w-full border-2 border-border rounded-[12px] px-4 py-3 outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)] text-base"
                autoFocus
              />
            </div>
          </div>
          <button
            type="button"
            className="bg-primary-blue text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer mt-5 w-full justify-center shadow-sm hover:bg-primary-blue-hover transition-all text-base"
            onClick={handleLoginDriver}
          >
            🚀 Masuk ke Akun Driver
          </button>
          <button
            type="button"
            className="mt-3 bg-bg-sidebar text-text-muted border border-border px-5 py-3 rounded-[12px] font-semibold cursor-pointer w-full hover:bg-border hover:text-text-main transition-all"
            onClick={() => setViewMode("portal")}
          >
            Kembali ke Menu Utama
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-4xl inline-block bg-red-100 w-16 h-16 leading-[64px] rounded-full shadow-sm mb-3 text-primary-red">
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2">Verifikasi Admin</h2>
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
              onClick={() => setViewMode("portal")}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
