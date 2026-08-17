// src/features/chat/components/MediaLightboxModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  ExternalLink,
  FileText,
  Video as VideoIcon,
  Music as MusicIcon,
  Image as ImageIcon,
} from "lucide-react";

export interface MediaItem {
  url: string;
  name?: string | null;
  type?: "image" | "video" | "audio" | "document" | string | null;
  senderName?: string | null;
  sizeBytes?: number | null;
}

interface Props {
  media: MediaItem | null;
  onClose: () => void;
}

export function MediaLightboxModal({ media, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setZoom(1);
    setRotation(0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
      if (e.key === "r" || e.key === "R") handleRotate();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!media || !media.url || !mounted) return null;

  const url = media.url;
  const rawType = (media.type || "").toLowerCase();
  const isImage =
    rawType === "image" ||
    /\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i.test(url) ||
    url.includes("/image/upload/") ||
    url.includes("cloudinary.com");
  const isVideo =
    rawType === "video" ||
    /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) ||
    url.includes("/video/upload/");
  const isAudio =
    rawType === "audio" ||
    /\.(mp3|wav|ogg|aac|flac|m4a)($|\?)/i.test(url);
  const isPdf =
    rawType === "document" && /\.pdf($|\?)/i.test(url) || url.toLowerCase().includes(".pdf");

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.4));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const formattedSize = media.sizeBytes
    ? media.sizeBytes < 1024 * 1024
      ? `${(media.sizeBytes / 1024).toFixed(1)} KB`
      : `${(media.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 shrink-0 bg-black/60 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-inner">
            {isImage && <ImageIcon className="h-5 w-5" />}
            {isVideo && <VideoIcon className="h-5 w-5" />}
            {isAudio && <MusicIcon className="h-5 w-5" />}
            {!isImage && !isVideo && !isAudio && <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
              {media.name || "Attachment Preview"}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {media.senderName && (
                <span>
                  Sent by <strong className="text-slate-200">{media.senderName}</strong>
                </span>
              )}
              {formattedSize && (
                <>
                  <span>•</span>
                  <span>{formattedSize}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/80 font-mono w-12 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In (+)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleRotate}
                title="Rotate 90° (R)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={handleReset}
                title="Reset View (0)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <div className="h-5 w-px bg-white/20 mx-1" />
            </>
          )}

          <a
            href={url}
            download={media.name || "download"}
            target="_blank"
            rel="noopener noreferrer"
            title="Download file"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors ml-1 border border-red-500/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Media Display Area */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4 sm:p-8 select-none"
        onClick={onClose}
      >
        {isImage && (
          <img
            src={url}
            alt={media.name || "Preview"}
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="max-h-[82vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl cursor-default"
          />
        )}

        {isVideo && (
          <div
            className="max-w-4xl w-full max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={url}
              controls
              autoPlay
              className="max-h-[80vh] w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
            />
          </div>
        )}

        {isAudio && (
          <div
            className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 max-w-lg w-full shadow-2xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <MusicIcon className="h-8 w-8" />
            </div>
            <p className="text-white font-medium text-center">{media.name || "Audio File"}</p>
            <audio src={url} controls autoPlay className="w-full mt-2" />
          </div>
        )}

        {!isImage && !isVideo && !isAudio && (
          <div
            className="flex flex-col items-center justify-center p-8 max-w-3xl w-full h-[75vh] rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isPdf ? (
              <iframe
                src={`${url}#toolbar=0`}
                className="w-full h-full rounded-2xl border border-white/10 bg-white"
                title={media.name || "Document preview"}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-20 w-20 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold text-white">{media.name || "Document"}</h3>
                {formattedSize && <p className="text-sm text-slate-400">{formattedSize}</p>}
                <a
                  href={url}
                  download={media.name || "download"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-medium shadow-lg transition-all"
                >
                  <Download className="h-5 w-5" />
                  Download File
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
