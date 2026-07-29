"use client";

import { useState } from "react";
import Modal from "./Modal";
import { DAMAGE_PRESETS } from "@/types";
import { getDamagePercentCategory } from "@/lib/utils";

interface DamageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, percent: number) => void;
}

export default function DamageDialog({ isOpen, onClose, onSubmit }: DamageDialogProps) {
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState(10);

  const handleSubmit = () => {
    const category = getDamagePercentCategory(percent);
    const desc = description.trim() || "Kerusakan";
    const fullDesc = `${desc} (${percent}% - ${category})`;
    onSubmit(fullDesc, percent);
    setDescription("");
    setPercent(10);
  };

  const handleClose = () => {
    setDescription("");
    setPercent(10);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="420px">
      <div className="flex flex-col gap-4">
        <label className="text-xs font-bold text-text-muted uppercase">
          Pilih Jenis Kerusakan:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DAMAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="bg-bg-sidebar border border-border px-3 py-[0.65rem] rounded-[8px] cursor-pointer font-semibold text-sm text-text-main text-center hover:bg-primary-blue hover:text-white hover:border-primary-blue transition-all"
              onClick={() => setDescription(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs font-bold text-text-muted uppercase">
            Keterangan Tambahan:
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Baret panjang di pintu depan"
            maxLength={200}
            className="w-full border-2 border-border rounded-[12px] px-4 py-3 text-sm outline-none focus:border-primary-blue focus:shadow-[0_0_0_4px_hsl(211,100%,92%)]"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs font-bold text-text-muted uppercase">
            Tingkat Kerusakan (%):
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-bold text-primary-red min-w-[110px] text-right text-sm">
              {percent}% ({getDamagePercentCategory(percent)})
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          type="button"
          className="bg-bg-sidebar text-text-muted border border-border px-5 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-border hover:text-text-main transition-all"
          onClick={handleClose}
        >
          Batal
        </button>
        <button
          type="button"
          className="bg-primary-blue text-white px-5 py-3 rounded-[12px] font-semibold cursor-pointer hover:bg-primary-blue-hover transition-all shadow-sm"
          onClick={handleSubmit}
        >
          Simpan
        </button>
      </div>
    </Modal>
  );
}
