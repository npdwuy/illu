"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  Loader2,
  ImagePlus,
  CheckCircle,
  AlertCircle,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { MarqueeImage } from "@/data/marqueeGalleryData";

// ── Types ─────────────────────────────────────────────────────────────────
interface ExtendedMarqueeImage extends MarqueeImage {
  r2Key?: string | null;
  rowIndex?: number;
  sortOrder?: number;
}

interface MarqueeAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rows: ExtendedMarqueeImage[][];
  onRowsChange: () => void; // callback to refetch from server
}

type ToastType = "success" | "error" | "loading";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ASPECT_RATIOS = ["16/9", "4/3", "1/1", "3/4", "21/9", "16/10"];

// ── Compress image client-side before upload ─────────────────────────────
function compressImage(file: File, maxWidth = 1400): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Blob failed"));
            resolve({ blob, ext: "jpg" });
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Draggable Item ─────────────────────────────────────────────────────────
interface DraggableItemProps {
  img: ExtendedMarqueeImage;
  rowIndex: number;
  itemIndex: number;
  onEdit: (img: ExtendedMarqueeImage) => void;
  onDelete: (id: string) => void;
  onDragStart: (rowIndex: number, itemIndex: number) => void;
  onDragOver: (rowIndex: number, itemIndex: number) => void;
  onDrop: (rowIndex: number) => void;
  isDragOver: boolean;
}

function DraggableItem({
  img,
  rowIndex,
  itemIndex,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: DraggableItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(rowIndex, itemIndex)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(rowIndex, itemIndex); }}
      onDrop={() => onDrop(rowIndex)}
      className={`group flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        isDragOver
          ? "border-blue-400/70 bg-blue-500/10"
          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
      }`}
    >
      {/* Drag Handle */}
      <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />

      {/* Thumbnail */}
      <div
        className="shrink-0 h-12 overflow-hidden rounded bg-slate-900 border border-white/10"
        style={{ aspectRatio: img.aspectRatio || "4/3" }}
      >
        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{img.title}</p>
        <p className="text-xs text-slate-500 truncate font-mono">
          {img.aspectRatio} · {img.category || "—"} · {img.date || "—"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(img); }}
          className="p-1.5 rounded hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
          title="Chỉnh sửa"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
          className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          title="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
interface EditModalProps {
  img: ExtendedMarqueeImage;
  rowCount: number;
  onSave: (updated: ExtendedMarqueeImage) => void;
  onClose: () => void;
}

function EditModal({ img, rowCount, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<ExtendedMarqueeImage>({ ...img });
  const [tagInput, setTagInput] = useState("");

  const update = (field: keyof ExtendedMarqueeImage, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== tag) }));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <img
              src={img.url}
              alt=""
              className="w-10 h-10 rounded object-cover border border-white/10"
            />
            <div>
              <p className="text-sm font-semibold text-white">{img.title}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {img.id.slice(-8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Tiêu đề</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              placeholder="Tiêu đề ảnh..."
            />
          </div>

          {/* Date + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Ngày</label>
              <input
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Địa điểm</label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                placeholder="TP. Hồ Chí Minh..."
              />
            </div>
          </div>

          {/* Category + Aspect Ratio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Danh mục</label>
              <input
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                placeholder="Portrait, Street..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Tỉ lệ (AR)</label>
              <div className="relative">
                <select
                  value={form.aspectRatio}
                  onChange={(e) => update("aspectRatio", e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
                >
                  {ASPECT_RATIOS.map((ar) => (
                    <option key={ar} value={ar} className="bg-[#0d0d14]">{ar}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row */}
          {rowCount > 1 && (
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Row (hàng)</label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: rowCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, rowIndex: i }))}
                    className={`px-3 py-1 rounded text-sm font-mono border transition-all ${
                      (form.rowIndex ?? 0) === i
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    Row {i}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/30 text-xs text-blue-300 font-mono"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="text-blue-400/60 hover:text-blue-300 ml-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                placeholder="Nhập tag rồi Enter..."
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none custom-scrollbar"
              placeholder="Mô tả bức ảnh này..."
            />
          </div>

          {/* URL preview */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1 block">URL</label>
            <div className="flex items-center gap-2">
              <input
                value={form.url}
                readOnly
                className="flex-1 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono focus:outline-none truncate"
              />
              <a
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────────────────
export default function MarqueeAdminPanel({
  isOpen,
  onClose,
  rows,
  onRowsChange,
}: MarqueeAdminPanelProps) {
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [editingImg, setEditingImg] = useState<ExtendedMarqueeImage | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragFrom, setDragFrom] = useState<{ row: number; idx: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ row: number; idx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  const activeRow: ExtendedMarqueeImage[] = rows[activeRowIndex] || [];

  // ── Toast helpers ─────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Upload file to R2 via existing /api/upload ────────────────────────
  const uploadFile = useCallback(
    async (file: File, rowIndex: number) => {
      const toastId = addToast(`Đang upload "${file.name}"…`, "loading", 0);
      try {
        const { blob, ext } = await compressImage(file);
        const compressedFile = new File([blob], `${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}.${ext}`, {
          type: "image/jpeg",
        });

        const fd = new FormData();
        fd.append("file", compressedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Upload R2 thất bại");
        const { url, fileName } = await uploadRes.json();

        // Register in DB via marquee API
        const newImg: ExtendedMarqueeImage = {
          id: `mq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url,
          r2Key: fileName,
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          date: new Date().toLocaleDateString("vi-VN"),
          location: "",
          category: "",
          tags: [],
          description: "",
          aspectRatio: "4/3",
          rowIndex,
          sortOrder: (rows[rowIndex]?.length ?? 0),
        };

        const dbRes = await fetch("/api/marquee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newImg),
        });
        if (!dbRes.ok) throw new Error("Lưu DB thất bại");

        removeToast(toastId);
        addToast(`✓ Upload thành công: ${newImg.title}`, "success");
        onRowsChange();
      } catch (err) {
        removeToast(toastId);
        addToast(`✗ Lỗi: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
      }
    },
    [rows, addToast, removeToast, onRowsChange]
  );

  // ── Handle file input ─────────────────────────────────────────────────
  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((f) => {
        if (f.type.startsWith("image/")) uploadFile(f, activeRowIndex);
      });
    },
    [uploadFile, activeRowIndex]
  );

  // ── Drop zone ──────────────────────────────────────────────────────────
  const handlePanelDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    },
    [handleFilesSelected]
  );

  // ── Save edit ──────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(
    async (updated: ExtendedMarqueeImage) => {
      try {
        const res = await fetch("/api/marquee", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error("PUT failed");
        addToast("Đã lưu thay đổi", "success");
        setEditingImg(null);
        onRowsChange();
      } catch {
        addToast("Lưu thất bại", "error");
      }
    },
    [addToast, onRowsChange]
  );

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Xóa ảnh này khỏi thư viện?")) return;
      try {
        const res = await fetch("/api/marquee", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("DELETE failed");
        addToast("Đã xóa ảnh", "success");
        onRowsChange();
      } catch {
        addToast("Xóa thất bại", "error");
      }
    },
    [addToast, onRowsChange]
  );

  // ── Drag-to-reorder ────────────────────────────────────────────────────
  const handleDragStart = (row: number, idx: number) => setDragFrom({ row, idx });
  const handleDragOver = (row: number, idx: number) => setDragOverTarget({ row, idx });

  const handleDrop = useCallback(
    async (targetRow: number) => {
      if (!dragFrom || dragOverTarget === null) return;
      if (dragFrom.row !== targetRow) { setDragFrom(null); setDragOverTarget(null); return; }

      const rowItems = [...activeRow];
      const [moved] = rowItems.splice(dragFrom.idx, 1);
      rowItems.splice(dragOverTarget.idx, 0, moved);

      const items = rowItems.map((img, i) => ({ id: img.id, sortOrder: i }));
      setDragFrom(null);
      setDragOverTarget(null);

      try {
        const res = await fetch("/api/marquee", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "REORDER", items }),
        });
        if (!res.ok) throw new Error("Reorder failed");
        onRowsChange();
      } catch {
        addToast("Sắp xếp lại thất bại", "error");
      }
    },
    [dragFrom, dragOverTarget, activeRow, addToast, onRowsChange]
  );

  // ── Add new row with 3 default items ──────────────────────────────────
  const handleAddRow = useCallback(async () => {
    const timestamp = Date.now();
    const newRowIndex = rows.length;

    // 3 distinct placeholder images from Unsplash to make the new row lively
    const placeholders = [
      {
        id: `mq-row-${timestamp}-1`,
        url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=60",
        r2Key: null,
        title: `Ảnh mẫu 1 — Row ${newRowIndex}`,
        date: new Date().toLocaleDateString("vi-VN"),
        location: "Illustris Gallery",
        category: "Abstract",
        tags: ["Abstract", "Art"],
        description: "Ảnh mẫu khởi tạo cho hàng mới.",
        aspectRatio: "4/3",
        rowIndex: newRowIndex,
      },
      {
        id: `mq-row-${timestamp}-2`,
        url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=60",
        r2Key: null,
        title: `Ảnh mẫu 2 — Row ${newRowIndex}`,
        date: new Date().toLocaleDateString("vi-VN"),
        location: "Illustris Gallery",
        category: "Creative",
        tags: ["Creative", "Modern"],
        description: "Ảnh mẫu thứ hai khởi tạo cho hàng mới.",
        aspectRatio: "16/9",
        rowIndex: newRowIndex,
      },
      {
        id: `mq-row-${timestamp}-3`,
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=60",
        r2Key: null,
        title: `Ảnh mẫu 3 — Row ${newRowIndex}`,
        date: new Date().toLocaleDateString("vi-VN"),
        location: "Illustris Gallery",
        category: "Street",
        tags: ["Street", "B&W"],
        description: "Ảnh mẫu thứ ba khởi tạo cho hàng mới.",
        aspectRatio: "3/4",
        rowIndex: newRowIndex,
      },
    ];

    const toastId = addToast("Đang tạo row mới với 3 ảnh mẫu…", "loading", 0);

    try {
      // Post all 3 images in parallel
      await Promise.all(
        placeholders.map((img) =>
          fetch("/api/marquee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(img),
          })
        )
      );

      removeToast(toastId);
      addToast(`✓ Đã tạo thành công Row ${newRowIndex} với 3 ảnh mẫu`, "success");
      setActiveRowIndex(newRowIndex);
      onRowsChange();
    } catch {
      removeToast(toastId);
      addToast("Thêm row thất bại", "error");
    }
  }, [rows.length, addToast, removeToast, onRowsChange]);

  // ── Delete Row ──────────────────────────────────────────────────────────
  const handleDeleteRow = useCallback(async () => {
    if (rows.length <= 1) {
      addToast("Không thể xóa hàng duy nhất còn lại", "error");
      return;
    }

    if (
      !confirm(
        `CẢNH BÁO: Xóa toàn bộ Row ${activeRowIndex} và tất cả ${activeRow.length} ảnh bên trong? Thao tác này không thể hoàn tác.`
      )
    ) {
      return;
    }

    const toastId = addToast(`Đang xóa Row ${activeRowIndex}…`, "loading", 0);

    try {
      const res = await fetch("/api/marquee", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: activeRowIndex }),
      });

      if (!res.ok) throw new Error("DELETE Row failed");

      removeToast(toastId);
      addToast(`✓ Đã xóa Row ${activeRowIndex}`, "success");

      // Switch to previous row index safely
      setActiveRowIndex((prev) => Math.max(0, prev - 1));
      onRowsChange();
    } catch (err) {
      removeToast(toastId);
      addToast("Xóa row thất bại", "error");
    }
  }, [rows.length, activeRowIndex, activeRow.length, addToast, removeToast, onRowsChange]);

  // ── Close on Escape ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editingImg) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingImg]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-[100] w-[480px] max-w-[95vw] bg-[#0a0a10] border-l border-white/10 shadow-[−20px_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handlePanelDrop}
          >
            {/* Drop overlay */}
            {isDragOver && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-950/80 border-2 border-dashed border-blue-400 pointer-events-none">
                <div className="text-center">
                  <ImagePlus className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300 font-semibold text-lg">Thả ảnh vào đây</p>
                  <p className="text-blue-400/60 text-sm">Upload vào Row {activeRowIndex}</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="text-blue-400">✦</span> Library Editor
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {rows.reduce((acc, r) => acc + r.length, 0)} ảnh · {rows.length} hàng
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Row Tabs */}
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/8 shrink-0 overflow-x-auto [scrollbar-width:none]">
              {rows.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveRowIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium whitespace-nowrap transition-all ${
                    activeRowIndex === i
                      ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/8"
                  }`}
                >
                  Row {i}
                  <span className="ml-1.5 text-xs opacity-60">({rows[i].length})</span>
                </button>
              ))}
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-lg text-sm font-mono text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 border border-dashed border-white/10 hover:border-blue-500/40 transition-all whitespace-nowrap"
                title="Thêm row mới"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                Row mới
              </button>

              {rows.length > 1 && (
                <button
                  onClick={handleDeleteRow}
                  className="px-3 py-1.5 rounded-lg text-sm font-mono text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-dashed border-red-500/20 hover:border-red-500/40 transition-all whitespace-nowrap ml-auto"
                  title={`Xóa hoàn toàn Row ${activeRowIndex}`}
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                  Xóa Row {activeRowIndex}
                </button>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-[0_0_16px_rgba(59,130,246,0.3)]"
              >
                <Upload className="w-4 h-4" />
                Upload ảnh
              </button>
              <p className="text-xs text-slate-600 font-mono ml-1">
                hoặc kéo thả vào panel
              </p>
            </div>

            {/* Image List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-2">
              {activeRow.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ImagePlus className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">Row {activeRowIndex} trống</p>
                  <p className="text-slate-600 text-xs mt-1">Upload ảnh hoặc kéo thả vào đây</p>
                </div>
              ) : (
                activeRow.map((img, idx) => (
                  <DraggableItem
                    key={img.id}
                    img={img}
                    rowIndex={activeRowIndex}
                    itemIndex={idx}
                    onEdit={setEditingImg}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragOver={
                      dragOverTarget?.row === activeRowIndex &&
                      dragOverTarget?.idx === idx
                    }
                  />
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-white/8 shrink-0">
              <p className="text-[11px] text-slate-600 font-mono text-center">
                Ảnh upload → R2 bucket · Metadata → Turso DB · Sync realtime
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingImg && (
          <EditModal
            img={editingImg}
            rowCount={rows.length}
            onSave={handleSaveEdit}
            onClose={() => setEditingImg(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl border pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-300"
                  : toast.type === "error"
                  ? "bg-red-950/95 border-red-500/30 text-red-300"
                  : "bg-blue-950/95 border-blue-500/30 text-blue-300"
              }`}
            >
              {toast.type === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {toast.type === "success" && <CheckCircle className="w-4 h-4" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Custom scrollbar style */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      ` }} />
    </>
  );
}
