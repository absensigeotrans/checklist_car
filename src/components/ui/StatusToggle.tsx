"use client";

interface StatusToggleProps {
  value: "ADA" | "TDK ADA";
  onChange: (value: "ADA" | "TDK ADA") => void;
}

export default function StatusToggle({ value, onChange }: StatusToggleProps) {
  return (
    <div className="inline-flex bg-bg-sidebar p-[4px] rounded-[8px] gap-[2px]">
      <button
        type="button"
        className={`border-none bg-none font-bold text-xs px-3 py-[0.35rem] rounded-[6px] cursor-pointer transition-all ${
          value === "ADA"
            ? "bg-primary-green text-white shadow-sm"
            : "text-text-muted"
        }`}
        onClick={() => onChange("ADA")}
      >
        ADA
      </button>
      <button
        type="button"
        className={`border-none bg-none font-bold text-xs px-3 py-[0.35rem] rounded-[6px] cursor-pointer transition-all ${
          value === "TDK ADA"
            ? "bg-primary-red text-white shadow-sm"
            : "text-text-muted"
        }`}
        onClick={() => onChange("TDK ADA")}
      >
        TDK ADA
      </button>
    </div>
  );
}
