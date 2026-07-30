"use client";

import { useState, useRef } from "react";
import type { InspectionRecord } from "@/types";
import { preparePrintMarkup, downloadChecklistPDFDirect } from "@/lib/export";

interface ChecklistPDFPreviewProps {
  record: InspectionRecord;
  onPrintWindow: () => void;
}

export default function ChecklistPDFPreview({
  record,
  onPrintWindow,
}: ChecklistPDFPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [highlightMode, setHighlightMode] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const markup = preparePrintMarkup(record, highlightMode);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadChecklistPDFDirect(record, canvasRef.current);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Control Toolbar */}
      <div className="bg-bg-sidebar/90 p-3 rounded-[14px] border border-border flex items-center justify-between flex-wrap gap-3">
        {/* Left Side: Zoom & Highlight Switch */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-white border border-border rounded-[10px] p-1 shadow-2xs">
            <span className="text-[11px] font-bold text-text-muted px-2">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
              disabled={zoomLevel <= 50}
              className="w-7 h-7 rounded-[6px] font-bold text-xs hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex items-center justify-center border border-border"
              title="Perkecil"
            >
              -
            </button>
            <span className="text-xs font-extrabold text-primary-blue px-2.5 min-w-[50px] text-center font-mono">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
              disabled={zoomLevel >= 150}
              className="w-7 h-7 rounded-[6px] font-bold text-xs hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex items-center justify-center border border-border"
              title="Perbesar"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-[10px] font-semibold text-text-muted hover:text-text-main px-2 border-l border-border hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Highlight Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-text-main cursor-pointer bg-white px-3 py-1.5 rounded-[10px] border border-border shadow-2xs">
            <input
              type="checkbox"
              checked={highlightMode}
              onChange={(e) => setHighlightMode(e.target.checked)}
              className="rounded accent-primary-blue cursor-pointer w-4 h-4"
            />
            <span>Sorot Temuan (TDK ADA & Body)</span>
          </label>
        </div>

        {/* Right Side: Dual Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs px-3.5 py-2 rounded-[10px] cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
          >
            {isDownloading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Mengunduh...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Unduh File .PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPrintWindow}
            className="bg-primary-blue hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-[10px] cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* 2. Paper Layout Container */}
      <div className="bg-slate-200/70 p-6 max-md:p-2 rounded-[16px] border border-border overflow-auto max-h-[60vh] flex justify-center shadow-inner">
        <div
          className="transition-transform duration-150 ease-out origin-top shadow-xl bg-white rounded-[2px]"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            marginBottom: zoomLevel > 100 ? `${(zoomLevel - 100) * 8}px` : "0px",
          }}
        >
          <div
            ref={canvasRef}
            className="official-pdf-preview-canvas"
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </div>
      </div>
    </div>
  );
}
