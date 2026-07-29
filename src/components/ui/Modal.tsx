"use client";

import { type ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "580px",
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[16px] max-md:rounded-[14px] shadow-lg w-[90%] max-md:w-[94%] max-h-[90vh] overflow-y-auto p-8 max-md:p-4 border border-border"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center border-b-2 border-bg-main pb-4 mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="bg-none border-none text-xl cursor-pointer text-text-muted hover:text-text-main"
            >
              &times;
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
