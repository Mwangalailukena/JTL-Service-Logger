"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
      <div 
        className={cn(
          "bg-white w-full max-w-lg rounded-lg shadow-floating border animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]", 
          className
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-surface-50">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}