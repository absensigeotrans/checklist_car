"use client";

import { type ReactNode } from "react";
import Header from "@/components/layout/Header";
import RolePortalModal from "@/components/layout/RolePortalModal";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 max-md:px-3 max-md:py-4">
        {children}
      </main>
      <RolePortalModal />
    </>
  );
}
