"use client";

import { useState, useCallback } from "react";
import type { DamagePin } from "@/types";
import { getPartLabel } from "@/lib/utils";
import DamageDialog from "./DamageDialog";
import Image from "next/image";

interface DamagePlotterProps {
  pins: DamagePin[];
  onAddPin: (pin: DamagePin) => void;
  onRemovePin: (id: string) => void;
}

const views = [
  { part: "body_depan", label: "Depan", src: "/car_front.png" },
  { part: "body_samping_kiri", label: "Kiri", src: "/car_left.png" },
  { part: "body_samping_kanan", label: "Kanan", src: "/car_right.png" },
  { part: "body_belakang", label: "Belakang", src: "/car_rear.png" },
];

export default function DamagePlotter({
  pins,
  onAddPin,
  onRemovePin,
}: DamagePlotterProps) {
  const [activePart, setActivePart] = useState("body_depan");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingPin, setPendingPin] = useState<{
    part: string;
    x: number;
    y: number;
  } | null>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, part: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPendingPin({
        part,
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
      });
      setDialogOpen(true);
    },
    []
  );

  const handleDialogSubmit = (description: string, _percent: number) => {
    if (!pendingPin) return;
    const newPin: DamagePin = {
      id: Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      part: pendingPin.part,
      x: pendingPin.x,
      y: pendingPin.y,
      description,
    };
    onAddPin(newPin);
    setDialogOpen(false);
    setPendingPin(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setPendingPin(null);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-text-muted uppercase mb-2">
        Plot Kerusakan (Ketuk pada gambar untuk menandai)
      </label>

      <div className="flex bg-bg-sidebar p-[4px] rounded-[12px] gap-[4px] mb-5 border border-border md:hidden">
        {views.map((v) => (
          <button
            key={v.part}
            type="button"
            className={`flex-1 border-none bg-none font-semibold text-sm px-2 py-[0.6rem] rounded-[10px] cursor-pointer text-center transition-all outline-none ${
              activePart === v.part
                ? "bg-white text-primary-blue shadow-sm"
                : "text-text-muted"
            }`}
            onClick={() => setActivePart(v.part)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-2 max-md:grid-cols-1">
        {views.map((v) => (
          <div
            key={v.part}
            className={`bg-bg-sidebar rounded-[12px] p-4 flex flex-col items-center border border-border ${
              activePart === v.part ? "" : "max-md:hidden"
            }`}
          >
            <h4 className="text-sm font-bold text-text-muted mb-2">{v.label}</h4>
            <div
              className="w-full max-w-[180px] h-[180px] relative cursor-crosshair"
              onClick={(e) => handleImageClick(e, v.part)}
            >
              <Image
                src={v.src}
                alt={v.label}
                fill
                className="object-contain pointer-events-none"
              />
              {pins
                .filter((p) => p.part === v.part)
                .map((pin) => (
                  <div
                    key={pin.id}
                    className="absolute w-4 h-4 bg-primary-red border-2 border-white rounded-full animate-pulse-damage cursor-pointer z-10"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    title={pin.description}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Hapus tanda kerusakan: "${pin.description}"?`
                        )
                      ) {
                        onRemovePin(pin.id);
                      }
                    }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-4 max-h-[250px] overflow-y-auto">
        {pins.length === 0 ? (
          <span className="text-sm text-text-muted">
            Tidak ada kerusakan yang ditandai.
          </span>
        ) : (
          pins.map((pin) => (
            <div
              key={pin.id}
              className="flex justify-between items-center bg-bg-main px-3 py-2 rounded-[8px] text-sm border-l-[3px] border-primary-red"
            >
              <span>
                <strong>[{getPartLabel(pin.part)}]</strong> {pin.description} ({pin.x}%, {pin.y}%)
              </span>
              <button
                type="button"
                className="bg-none border-none text-primary-red font-bold cursor-pointer px-1"
                onClick={() => onRemovePin(pin.id)}
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      <DamageDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}
