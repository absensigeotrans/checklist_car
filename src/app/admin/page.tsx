"use client";

import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { isAdmin, loginAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not admin, try to re-check or redirect
    if (!isAdmin) {
      // Check session storage for existing auth
      const adminAuth = typeof window !== "undefined" && sessionStorage.getItem("ptk_admin_auth") === "true";
      if (!adminAuth) {
        router.push("/");
      }
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted">Silakan login sebagai admin terlebih dahulu.</p>
      </div>
    );
  }

  return <AdminDashboard />;
}
