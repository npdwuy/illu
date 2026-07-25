"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import StickerDrag from "@/components/StickerDrag";
import {
    Upload,
    Clipboard,
    Trash2,
    MessageSquare,
    X,
    Maximize2,
    Minimize2,
    Sparkles,
    Layers,
    Plus,
    CheckCircle2
} from "lucide-react";

export interface StickerItem {
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
    elevation: number;
    sheenMode: "sheen" | "holo";
    lightingColor: string;
    zIndex: number;
}

export interface PartyCanvasProps {
    className?: string;
}

export default function PartyCanvas({ className }: PartyCanvasProps) {
    const [stickers, setStickers] = useState<StickerItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [uploading, setUploading] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Expandable Canvas Height State (default 580px for SSR matching)
    const [canvasHeight, setCanvasHeight] = useState<number>(580);

    // Sync saved height from localStorage after client hydration
    useEffect(() => {
        const saved = localStorage.getItem("party_canvas_height");
        if (saved) {
            const num = parseInt(saved, 10);
            if (!isNaN(num) && num >= 500) {
                setCanvasHeight(num);
            }
        }
    }, []);

    // Modal state for editing description
    const [editingSticker, setEditingSticker] = useState<StickerItem | null>(null);
    const [editDescText, setEditDescText] = useState<string>("");

    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial stickers from database (with fallback to localStorage)
    const loadStickers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/canvas/stickers");
            const data = await res.json();
            if (data.success && Array.isArray(data.stickers) && data.stickers.length > 0) {
                setStickers(data.stickers);
            } else {
                const local = localStorage.getItem("party_canvas_stickers");
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        if (Array.isArray(parsed)) setStickers(parsed);
                    } catch (e) {}
                }
            }
        } catch (err) {
            const local = localStorage.getItem("party_canvas_stickers");
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed)) setStickers(parsed);
                } catch (e) {}
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStickers();
    }, [loadStickers]);

    // Save state to database and localStorage
    const syncToDatabase = useCallback(async (updatedList: StickerItem[]) => {
        localStorage.setItem("party_canvas_stickers", JSON.stringify(updatedList));
        try {
            await fetch("/api/canvas/stickers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stickers: updatedList }),
            });
        } catch (e) {}
    }, []);

    // Dynamic Height Expander
    const handleExpandHeight = (additional = 350) => {
        setCanvasHeight((prev) => {
            const next = Math.min(prev + additional, 3000);
            localStorage.setItem("party_canvas_height", next.toString());
            return next;
        });
    };

    const handleResetHeight = () => {
        setCanvasHeight(580);
        localStorage.setItem("party_canvas_height", "580");
    };

    // Handle Uploading Multiple Files (Batch Upload with Staggered Cascading Coordinates)
    const handleUploadMultipleFiles = async (files: File[], targetX?: number, targetY?: number) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        const canvasRect = canvasContainerRef.current?.getBoundingClientRect();
        const basePosX = targetX ?? (canvasRect ? canvasRect.width / 2 - 180 : 100);
        const basePosY = targetY ?? (canvasRect ? canvasRect.height / 2 - 140 : 100);

        const newStickersList: StickerItem[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setStatusMsg(`Đang tải ${i + 1}/${files.length} ảnh...`);

                try {
                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await fetch("/api/canvas/upload", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await res.json();

                    if (res.ok && data.url) {
                        // Staggered grid calculation so multiple pictures don't stack on top of each other
                        const col = i % 3;
                        const row = Math.floor(i / 3);
                        const offsetX = col * 60 + (i * 30) % 90;
                        const offsetY = row * 60 + (i * 20) % 80;

                        const posX = Math.max(20, basePosX + offsetX);
                        const posY = Math.max(20, basePosY + offsetY);

                        // Auto-expand canvas height if photos exceed current height
                        if (posY + 260 > canvasHeight - 60 && canvasHeight < 2800) {
                            setCanvasHeight((prev) => {
                                const next = Math.min(prev + 300, 3000);
                                localStorage.setItem("party_canvas_height", next.toString());
                                return next;
                            });
                        }

                        newStickersList.push({
                            id: `sticker-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                            url: data.url,
                            x: posX,
                            y: posY,
                            width: 380,
                            height: 260,
                            description: `Kỷ niệm đêm tiệc ${new Date().toLocaleDateString("vi-VN")}`,
                            elevation: 5,
                            sheenMode: "sheen",
                            lightingColor: "#60a5fa",
                            zIndex: 1000 + stickers.length + i + 1,
                        });
                    }
                } catch (singleErr) {
                    console.error("Single file upload error:", singleErr);
                }
            }

            if (newStickersList.length > 0) {
                setStickers((prev) => {
                    const updated = [...prev, ...newStickersList];
                    syncToDatabase(updated);
                    return updated;
                });
            }
        } catch (err: any) {
            console.error("Batch upload error:", err);
            alert(`Lỗi upload ảnh: ${err?.message || "Vui lòng thử lại"}`);
        } finally {
            setUploading(false);
            setStatusMsg("");
        }
    };

    // Listen to Global Paste Event (Ctrl+V / Cmd+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const filesToUpload: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        filesToUpload.push(new File([blob], `paste-${Date.now()}-${i}.png`, { type: blob.type || "image/png" }));
                    }
                }
            }

            if (filesToUpload.length > 0) {
                e.preventDefault();
                handleUploadMultipleFiles(filesToUpload);
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [stickers, canvasHeight, syncToDatabase]);

    // Handle File Selector change (supports selecting multiple photos)
    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUploadMultipleFiles(Array.from(files));
            e.target.value = "";
        }
    };

    // Handle Drag Over & Drop on Canvas
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const rect = canvasContainerRef.current?.getBoundingClientRect();
            const startX = rect ? e.clientX - rect.left - 150 : 100;
            const startY = rect ? e.clientY - rect.top - 100 : 100;
            handleUploadMultipleFiles(Array.from(files), startX, startY);
        }
    };

    // Update position of a sticker & auto-expand canvas when dragged near bottom
    const handlePositionChange = (id: string, newX: number, newY: number) => {
        if (newY + 240 > canvasHeight - 50 && canvasHeight < 2800) {
            handleExpandHeight(300);
        }
        setStickers((prev) => {
            const updated = prev.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s));
            syncToDatabase(updated);
            return updated;
        });
    };

    // Delete a sticker
    const handleDeleteSticker = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa sticker này khỏi canvas?")) return;
        setStickers((prev) => {
            const updated = prev.filter((s) => s.id !== id);
            syncToDatabase(updated);
            return updated;
        });
        try {
            await fetch(`/api/canvas/stickers?id=${id}`, { method: "DELETE" });
        } catch (e) {}
    };

    // Edit description submit
    const handleSaveDescription = () => {
        if (!editingSticker) return;
        setStickers((prev) => {
            const updated = prev.map((s) => (s.id === editingSticker.id ? { ...s, description: editDescText } : s));
            syncToDatabase(updated);
            return updated;
        });
        setEditingSticker(null);
        setEditDescText("");
    };

    // Clear all canvas
    const handleClearCanvas = () => {
        if (!confirm("Bạn có muốn xóa toàn bộ ảnh trên canvas?")) return;
        setStickers([]);
        localStorage.removeItem("party_canvas_stickers");
        syncToDatabase([]);
    };

    return (
        <div
            className={className || "relative w-full bg-black text-slate-100 flex flex-col overflow-hidden font-sans border border-dashed border-white/10 rounded-2xl transition-all duration-300"}
            style={{ height: `${canvasHeight}px` }}
        >
            {/* Control Toolbar */}
            <div className="absolute top-4 right-4 z-40 flex flex-wrap items-center justify-end gap-2 max-w-full px-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileSelected}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 rounded-full border border-blue-500/40 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600/20 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/10 backdrop-blur-md"
                >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? (statusMsg || "Đang Upload...") : "Đăng Nhiều Ảnh (+)"}</span>
                </button>

                <button
                    onClick={() => alert("Mẹo: Chọn cùng lúc nhiều ảnh trong hộp thoại mở file hoặc quét chọn nhiều file để kéo thả vào khung! Bạn cũng có thể dùng Ctrl+V để dán ảnh trực tiếp.")}
                    className="px-3.5 py-2 rounded-full border border-white/10 text-xs font-medium text-slate-400 bg-white/[0.02] hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5 backdrop-blur-md"
                    title="Dán từ Clipboard (Ctrl+V)"
                >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste (Ctrl+V)</span>
                </button>

                {/* Expandable Canvas Height Controls */}
                <button
                    onClick={() => handleExpandHeight(350)}
                    className="px-3.5 py-2 rounded-full border border-white/15 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1.5 shadow-sm backdrop-blur-md cursor-pointer"
                    title="Tăng độ cao không gian canvas để sắp xếp thêm nhiều ảnh"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>+ Mở Rộng Khung ({canvasHeight}px)</span>
                </button>

                {canvasHeight > 580 && (
                    <button
                        onClick={handleResetHeight}
                        className="p-2 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md cursor-pointer"
                        title="Thu gọn độ cao canvas về 580px"
                    >
                        <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                )}

                {stickers.length > 0 && (
                    <button
                        onClick={handleClearCanvas}
                        className="p-2 rounded-full border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-500/30 bg-white/[0.02] transition-all backdrop-blur-md cursor-pointer"
                        title="Xóa tất cả ảnh"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Main Interactive Canvas Area */}
            <main
                ref={canvasContainerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative flex-1 w-full h-full overflow-hidden bg-black cursor-crosshair"
                onClick={() => setSelectedId(null)}
            >
                {/* Empty Canvas Message */}
                {stickers.length === 0 && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                        <p className="text-slate-400 text-xs tracking-widest font-mono uppercase font-semibold">
                            {uploading ? (statusMsg || "ĐANG TẢI ẢNH LÊN BUCKET...") : "CHƯA CÓ ẢNH NÀO ĐƯỢC ĐĂNG. HÃY ĐĂNG NHIỀU ẢNH KỶ NIỆM ĐẦU TIÊN!"}
                        </p>
                        <p className="text-[11.5px] text-slate-500 font-mono mt-2 max-w-md">
                            (Bấm <span className="text-blue-400 font-bold">Đăng Nhiều Ảnh</span> để chọn hàng loạt file, kéo thả nhiều ảnh cùng lúc, hoặc bấm <span className="text-amber-400 font-bold">+ Mở Rộng Khung</span> để tăng diện tích lưu giữ)
                        </p>
                    </div>
                )}

                {/* Render WebGL Draggable Stickers */}
                {stickers.map((sticker) => (
                    <StickerDrag
                        key={sticker.id}
                        id={sticker.id}
                        image={sticker.url}
                        imageWidth={sticker.width}
                        imageHeight={sticker.height}
                        x={sticker.x}
                        y={sticker.y}
                        description={sticker.description}
                        elevation={sticker.elevation}
                        sheenMode={sticker.sheenMode}
                        lightingColor={sticker.lightingColor}
                        zIndex={sticker.zIndex}
                        isSelected={selectedId === sticker.id}
                        onSelect={(id) => setSelectedId(id)}
                        onPositionChange={handlePositionChange}
                        onDelete={handleDeleteSticker}
                        onEditDescription={(id) => {
                            const found = stickers.find((s) => s.id === id);
                            if (found) {
                                setEditingSticker(found);
                                setEditDescText(found.description || "");
                            }
                        }}
                    />
                ))}
            </main>

            {/* Bottom Canvas Footer Info & Height Extender Pill */}
            <div className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
                <div className="text-[11px] font-mono text-slate-500 bg-slate-950/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md pointer-events-auto">
                    {stickers.length} khoảnh khắc • Không gian: {canvasHeight}px
                </div>

                <button
                    onClick={() => handleExpandHeight(350)}
                    className="text-[11px] font-mono font-bold text-amber-300 hover:text-white bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 px-3 py-1 rounded-full border border-amber-500/30 hover:border-amber-400 transition-all backdrop-blur-md pointer-events-auto flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                    <Plus className="w-3 h-3" />
                    <span>Mở rộng thêm không gian</span>
                </button>
            </div>

            {/* Description Edit Modal */}
            {editingSticker && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Chỉnh Sửa Mô Tả Khoảnh Khắc
                            </h3>
                            <button
                                onClick={() => setEditingSticker(null)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Ghi chú / Câu chuyện kỷ niệm đêm tiệc
                            </label>
                            <textarea
                                value={editDescText}
                                onChange={(e) => setEditDescText(e.target.value)}
                                rows={4}
                                placeholder="Nhập cảm xúc, tên địa điểm, kỷ niệm gala..."
                                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setEditingSticker(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveDescription}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                            >
                                Lưu Mô Tả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
