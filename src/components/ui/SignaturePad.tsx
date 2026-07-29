"use client";

import { useSignaturePad } from "@/hooks/useSignaturePad";
import { useEffect } from "react";

interface SignaturePadProps {
  canvasRef: ReturnType<typeof useSignaturePad>["canvasRef"];
  onClear?: () => void;
}

export default function SignaturePad({ canvasRef, onClear }: SignaturePadProps) {
  useEffect(() => {
    if (onClear) onClear();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative border-2 border-dashed border-border rounded-[12px] bg-bg-sidebar overflow-hidden touch-none h-[180px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}

export function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-2.5 right-2.5 bg-white border border-border px-2 py-1 rounded-[8px] cursor-pointer text-xs font-semibold shadow-sm hover:bg-primary-red hover:text-white hover:border-primary-red transition-all"
    >
      Hapus
    </button>
  );
}
