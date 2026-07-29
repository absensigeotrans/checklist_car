"use client";

import { useAuth } from "@/context/AuthContext";
import RolePortalModal from "@/components/layout/RolePortalModal";

export default function Home() {
  const { showRolePortal } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-main mb-2">Selamat Datang di PTK Inspection Checklist</h2>
        <p className="text-text-muted">Silakan pilih akses Anda untuk melanjutkan.</p>
      </div>
      {showRolePortal && <RolePortalModal />}
    </div>
  );
}
