// src/features/chat/components/ImagePreviewModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, ZoomIn, ZoomOut, Maximize2, ExternalLink } from "lucide-react";

interface Props {
  imageUrl: string | null;
  imageName?: string;
  senderName?: string;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, imageName, senderName, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setZoom(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!imageUrl || !mounted) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            📷
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-sm">
              {imageName || "Image Preview"}
            </p>
            {senderName && (
              <p className="text-xs text-slate-400">
                Shared by <span className="text-slate-200">{senderName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-white/70 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-white/20 mx-1" />

          <a
            href={imageUrl}
            download={imageName || "download"}
            target="_blank"
            rel="noopener noreferrer"
            title="Download image"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </a>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-8 cursor-grab active:cursor-grabbing"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={imageName || "Preview"}
          onClick={(e) => e.stopPropagation()}
          style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease-out" }}
          className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl select-none"
        />
      </div>
    </div>,
    document.body
  );
}
