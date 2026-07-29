"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import NavTabs from "./NavTabs";

export default function Header() {
  const {
    role,
    isAdmin,
    nik,
    driverName,
    logoutAdmin,
    switchDriverNik,
    toggleRolePortal,
  } = useAuth();

  return (
    <header className="bg-white border-b border-border px-8 py-3.5 flex justify-between items-center sticky top-0 z-[100] shadow-sm max-md:flex-col max-md:gap-2.5 max-md:px-3 max-md:py-2.5 max-md:text-center">
      <div className="flex items-center gap-3 max-md:gap-2 max-md:text-center">
        <Image
          src="/logo_pertamina_tk.png"
          alt="Pertamina Trans Kontinental"
          width={220}
          height={60}
          priority
          unoptimized
          className="h-[46px] max-md:h-[38px] w-auto object-contain"
        />
        <div className="text-left max-md:text-center">
          <h1 className="text-lg font-bold text-text-main tracking-tight max-md:text-sm max-md:leading-tight">
            Inspection Checklist
          </h1>
          <span className="text-[11px] text-text-muted font-medium block uppercase max-md:text-[10px]">
            Berita Acara Checklist Kendaraan
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div id="userHeaderProfile">
          {isAdmin ? (
            <div className="inline-flex items-center gap-2 bg-bg-sidebar border border-primary-red px-3 py-[0.35rem] rounded-full text-sm font-semibold text-primary-red">
              <span>🔒 Admin Panel</span>
              <button
                type="button"
                className="bg-none border-none text-primary-red font-bold text-xs underline cursor-pointer"
                onClick={logoutAdmin}
              >
                Keluar
              </button>
            </div>
          ) : nik || driverName ? (
            <div className="inline-flex items-center gap-2 bg-bg-sidebar border border-border px-3 py-[0.35rem] rounded-full text-sm font-semibold">
              <span>
                👤 <strong>{driverName || "Driver"}</strong>
                {nik ? (
                  <span className="text-text-muted text-xs font-medium ml-1">
                    • NIK: <strong className="text-primary-blue">{nik}</strong>
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                className="bg-none border-none text-primary-blue font-bold text-xs underline cursor-pointer ml-1"
                onClick={switchDriverNik}
              >
                Ganti Akun
              </button>
              <span className="opacity-30">|</span>
              <button
                type="button"
                className="bg-none border-none text-primary-blue font-bold text-xs underline cursor-pointer"
                onClick={toggleRolePortal}
              >
                Ganti Role
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="bg-bg-sidebar text-text-muted border border-border px-3 py-[0.35rem] rounded-full text-sm font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all shadow-sm"
              onClick={toggleRolePortal}
            >
              🚪 Pilih Akses
            </button>
          )}
        </div>


        <NavTabs />
      </div>
    </header>
  );
}
