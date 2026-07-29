"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { id: "driver-form", label: "Isi Checklist", href: "/driver", roles: ["driver"] },
  { id: "driver-log-form", label: "Timesheet", href: "/log-sheet", roles: ["driver"] },
  { id: "driver-progress", label: "Review", href: "/progress", roles: ["driver"] },
  { id: "admin-dashboard", label: "Panel Admin", href: "/admin", roles: ["admin"] },
];

export default function NavTabs() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const visibleTabs = tabs.filter((t) => {
    if (isAdmin) return t.id === "admin-dashboard";
    return t.roles.includes("driver");
  });

  return (
    <div className="flex bg-bg-sidebar p-[4px] rounded-[12px] gap-[4px] max-md:w-full overflow-x-auto whitespace-nowrap no-scrollbar">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`border-none bg-none px-5 py-2.5 max-md:px-3.5 max-md:py-2 font-semibold text-sm cursor-pointer rounded-[10px] transition-all flex-1 text-center ${
            pathname === tab.href
              ? "bg-white text-primary-blue shadow-sm"
              : "text-text-muted hover:text-text-main"
          }`}
          onClick={() => router.push(tab.href)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
