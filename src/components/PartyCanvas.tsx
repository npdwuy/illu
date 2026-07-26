"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
    uploaderName?: string;
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
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Expandable Canvas Height State (default 580px for SSR matching)
    const [canvasHeight, setCanvasHeight] = useState<number>(580);

    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Uploader Name / Nickname Mandatory State
    const [userNickname, setUserNickname] = useState<string>("");
    const [showNameModal, setShowNameModal] = useState<boolean>(false);
    const [tempNameInput, setTempNameInput] = useState<string>("");
    const [pendingFiles, setPendingFiles] = useState<{ files: File[]; targetX?: number; targetY?: number } | null>(null);

    // Sync saved height and uploader nickname from localStorage after client hydration
    useEffect(() => {
        const savedName = localStorage.getItem("canvas_uploader_name");
        if (savedName) {
            setUserNickname(savedName);
        }
        const saved = localStorage.getItem("party_canvas_height");
        if (saved) {
            const num = parseInt(saved, 10);
            if (!isNaN(num) && num >= 500) {
                setCanvasHeight(num);
            }
        }
    }, []);

    // Modal state for editing description & uploader name
    const [editingSticker, setEditingSticker] = useState<StickerItem | null>(null);
    const [editDescText, setEditDescText] = useState<string>("");
    const [editNameText, setEditNameText] = useState<string>("");

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (editingSticker || showNameModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [editingSticker, showNameModal]);

    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial stickers from database (with fallback to localStorage ONLY on network error)
    const loadStickers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/canvas/stickers");
            const data = await res.json();
            if (data.success && Array.isArray(data.stickers)) {
                setStickers(data.stickers);
                localStorage.setItem("party_canvas_stickers", JSON.stringify(data.stickers));
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

    // Core upload function with explicit uploader name
    const executeUploadFiles = async (files: File[], nameToUse: string, targetX?: number, targetY?: number) => {
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
                        // Preload image to get natural aspect ratio
                        const img = new Image();
                        img.src = data.url;
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });

                        const naturalW = img.naturalWidth || 380;
                        const naturalH = img.naturalHeight || 260;
                        const baseWidth = 360;
                        const calculatedHeight = Math.max(100, Math.round(baseWidth * (naturalH / naturalW)));

                        const col = i % 3;
                        const row = Math.floor(i / 3);
                        const offsetX = col * 60 + (i * 30) % 90;
                        const offsetY = row * 60 + (i * 20) % 80;

                        const posX = Math.max(20, basePosX + offsetX);
                        const posY = Math.max(20, basePosY + offsetY);

                        if (!isMobile && posY + calculatedHeight > canvasHeight - 60 && canvasHeight < 2800) {
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
                            width: baseWidth,
                            height: calculatedHeight,
                            description: `Kỷ niệm đêm tiệc ${new Date().toLocaleDateString("vi-VN")}`,
                            uploaderName: nameToUse,
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

    // Public Upload Handler: Enforces mandatory Name/Nickname check before uploading
    const handleUploadMultipleFiles = (files: File[], targetX?: number, targetY?: number) => {
        if (!files || files.length === 0) return;

        const currentName = userNickname || localStorage.getItem("canvas_uploader_name") || "";
        if (!currentName.trim()) {
            setPendingFiles({ files, targetX, targetY });
            setTempNameInput("");
            setShowNameModal(true);
            return;
        }

        executeUploadFiles(files, currentName.trim(), targetX, targetY);
    };

    // Handle Confirming Uploader Name in Modal
    const handleConfirmName = () => {
        const trimmed = tempNameInput.trim();
        if (!trimmed) {
            alert("Vui lòng nhập Tên hoặc Nickname trước khi đăng ảnh!");
            return;
        }
        setUserNickname(trimmed);
        localStorage.setItem("canvas_uploader_name", trimmed);
        setShowNameModal(false);

        if (pendingFiles) {
            executeUploadFiles(pendingFiles.files, trimmed, pendingFiles.targetX, pendingFiles.targetY);
            setPendingFiles(null);
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

    // Update width & proportional height of a sticker
    const handleResizeWidth = (id: string, newWidth: number) => {
        setStickers((prev) => {
            const updated = prev.map((s) => {
                if (s.id === id) {
                    const ratio = (s.height && s.width) ? s.height / s.width : 0.68;
                    const newHeight = Math.max(100, Math.round(newWidth * ratio));
                    return { ...s, width: newWidth, height: newHeight };
                }
                return s;
            });
            syncToDatabase(updated);
            return updated;
        });
    };

    // Delete a sticker (deletes from Database & LocalStorage)
    const handleDeleteSticker = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa sticker này khỏi canvas?")) return;

        // 1. First call DELETE API endpoint to remove from Turso DB & R2
        try {
            await fetch(`/api/canvas/stickers?id=${id}`, { method: "DELETE" });
        } catch (e) {
            console.error("Delete sticker API error:", e);
        }

        // 2. Update local state and sync localStorage immediately
        setStickers((prev) => {
            const updated = prev.filter((s) => s.id !== id);
            localStorage.setItem("party_canvas_stickers", JSON.stringify(updated));
            return updated;
        });
    };

    // Edit description & uploader name submit
    const handleSaveDescription = () => {
        if (!editingSticker) return;
        setStickers((prev) => {
            const updated = prev.map((s) =>
                s.id === editingSticker.id
                    ? { ...s, description: editDescText, uploaderName: editNameText.trim() }
                    : s
            );
            syncToDatabase(updated);
            return updated;
        });
        setEditingSticker(null);
        setEditDescText("");
        setEditNameText("");
    };

    // Clear all canvas (deletes all stickers from Database & LocalStorage)
    const handleClearCanvas = async () => {
        if (!confirm("Bạn có muốn xóa toàn bộ ảnh trên canvas?")) return;
        setStickers([]);
        localStorage.removeItem("party_canvas_stickers");
        try {
            await fetch("/api/canvas/stickers?all=true", { method: "DELETE" });
        } catch (e) {
            console.error("Clear all canvas API error:", e);
        }
    };

    return (
        <div
            className={className || "relative w-full bg-black text-slate-100 flex flex-col overflow-hidden font-sans border border-dashed border-white/10 rounded-none transition-all duration-300"}
            style={isMobile ? {} : { height: `${canvasHeight}px` }}
        >
            {/* Control Toolbar (Scale 0.8) */}
            <div className="absolute top-2 right-2 z-40 flex flex-wrap items-center justify-end gap-2 max-w-full px-2 origin-top-right scale-[0.8] sm:scale-[0.9]">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={false}
                    className="hidden"
                    onChange={onFileSelected}
                />

                {/* Upload Button: Sharp Box 1x */}
                <button
                    onClick={() => {
                        const currentName = userNickname || localStorage.getItem("canvas_uploader_name") || "";
                        if (!currentName.trim()) {
                            setPendingFiles(null);
                            setTempNameInput("");
                            setShowNameModal(true);
                            return;
                        }
                        fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 rounded-none border border-blue-500/50 text-xs font-mono font-bold uppercase tracking-wider text-white bg-blue-950/80 hover:bg-blue-600 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 backdrop-blur-md"
                >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? (statusMsg || "Đang Upload...") : "Đăng Ảnh"}</span>
                </button>

                {userNickname && (
                    <button
                        onClick={() => {
                            setTempNameInput(userNickname);
                            setShowNameModal(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono text-amber-400 border border-amber-500/30 hover:border-amber-400 bg-zinc-900/80 hover:text-white transition-colors backdrop-blur-md cursor-pointer"
                        title="Bấm để đổi Tên/Nickname"
                    >
                        {userNickname}
                    </button>
                )}

                {!isMobile && (
                    <>
                        {/* Paste Button: Sharp Box 1x */}
                        <button
                            onClick={() => alert("Mẹo: Bạn có thể bấm Đăng Ảnh để chọn file, hoặc dán trực tiếp ảnh từ bộ nhớ tạm (Ctrl+V)!")}
                            className="px-3.5 py-2 rounded-none border border-white/15 text-xs font-mono text-slate-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 transition-all flex items-center gap-1.5 backdrop-blur-md"
                            title="Dán từ Clipboard (Ctrl+V)"
                        >
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>Paste (Ctrl+V)</span>
                        </button>

                        {/* Expandable Canvas Height Controls (Desktop only 1x) */}
                        <button
                            onClick={() => handleExpandHeight(350)}
                            className="px-3.5 py-2 rounded-none border border-amber-500/40 text-xs font-mono font-bold text-amber-300 bg-zinc-900/90 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                            title="Tăng độ cao không gian canvas để sắp xếp thêm nhiều ảnh"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Mở Rộng Khung ({canvasHeight}px)</span>
                        </button>

                        {canvasHeight > 580 && (
                            <button
                                onClick={handleResetHeight}
                                className="p-2 rounded-none border border-white/15 text-slate-400 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-md cursor-pointer"
                                title="Thu gọn độ cao canvas về 580px"
                            >
                                <Minimize2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </>
                )}

                {stickers.length > 0 && (
                    <button
                        onClick={handleClearCanvas}
                        className="p-2 rounded-none border border-red-500/30 text-red-400 hover:text-white hover:bg-red-600 bg-zinc-900/80 transition-all backdrop-blur-md cursor-pointer"
                        title="Xóa tất cả ảnh"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            {isMobile ? (
                /* MOBILE PARTY CANVAS (2 Independent Columns, Fix Width per Column, Height proportional to original image, NO MAX HEIGHT LIMIT) */
                <div className="w-full flex gap-x-4 p-4 pt-16 pb-16 min-h-[350px]">
                    {stickers.length === 0 && !loading ? (
                        <div className="w-full text-center py-12 text-slate-500 text-xs font-mono">
                            {uploading ? (statusMsg || "Đang tải ảnh lên...") : "Chưa có ảnh nào được đăng trong thư viện."}
                        </div>
                    ) : (
                        <>
                            {/* Column 1 (Left Independent Column) */}
                            <div className="flex-1 flex flex-col gap-y-6 min-w-0">
                                {stickers.filter((_, idx) => idx % 2 === 0).map((sticker) => (
                                    <div
                                        key={sticker.id}
                                        onClick={() => {
                                            setEditingSticker(sticker);
                                            setEditDescText(sticker.description || "");
                                            setEditNameText(sticker.uploaderName || "");
                                        }}
                                        className="flex flex-col cursor-pointer group"
                                    >
                                        {/* Image: Fix width to column, natural height proportional to original image, NO max height limit */}
                                        <div className="relative w-full overflow-hidden bg-zinc-900 rounded-none">
                                            <img
                                                src={sticker.url}
                                                alt={sticker.description || "Ảnh khoảnh khắc"}
                                                className="w-full h-auto object-cover rounded-none block pointer-events-none select-none"
                                            />
                                        </div>

                                        {/* Text content directly below image */}
                                        <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                                            {/* Line 1: Tên người upload (chỉ hiển thị khi có tên) */}
                                            {sticker.uploaderName && sticker.uploaderName.trim() !== "" && (
                                                <h4 className="font-bold text-white text-xs sm:text-sm font-sans truncate leading-tight">
                                                    {sticker.uploaderName}
                                                </h4>
                                            )}
                                            {/* Line 2: Description */}
                                            {sticker.description && (
                                                <p className="text-[11px] sm:text-xs text-slate-300 font-sans font-light leading-snug whitespace-pre-wrap break-words">
                                                    {sticker.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Column 2 (Right Independent Column) */}
                            <div className="flex-1 flex flex-col gap-y-6 min-w-0">
                                {stickers.filter((_, idx) => idx % 2 === 1).map((sticker) => (
                                    <div
                                        key={sticker.id}
                                        onClick={() => {
                                            setEditingSticker(sticker);
                                            setEditDescText(sticker.description || "");
                                            setEditNameText(sticker.uploaderName || "");
                                        }}
                                        className="flex flex-col cursor-pointer group"
                                    >
                                        {/* Image: Fix width to column, natural height proportional to original image, NO max height limit */}
                                        <div className="relative w-full overflow-hidden bg-zinc-900 rounded-none">
                                            <img
                                                src={sticker.url}
                                                alt={sticker.description || "Ảnh khoảnh khắc"}
                                                className="w-full h-auto object-cover rounded-none block pointer-events-none select-none"
                                            />
                                        </div>

                                        {/* Text content directly below image */}
                                        <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                                            {/* Line 1: Tên người upload (chỉ hiển thị khi có tên) */}
                                            {sticker.uploaderName && sticker.uploaderName.trim() !== "" && (
                                                <h4 className="font-bold text-white text-xs sm:text-sm font-sans leading-tight">
                                                    {sticker.uploaderName}
                                                </h4>
                                            )}
                                            {/* Line 2: Description */}
                                            {sticker.description && (
                                                <p className="text-[11px] sm:text-xs text-slate-300 font-sans font-light leading-snug whitespace-pre-wrap break-words">
                                                    {sticker.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* DESKTOP INTERACTIVE CANVAS AREA */
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
                                {uploading ? (statusMsg || "ĐANG TẢI ẢNH LÊN BUCKET...") : "CHƯA CÓ ẢNH NÀO ĐƯỢC ĐĂNG. HÃY ĐĂNG KHOẢNH KHẮC ĐẦU TIÊN!"}
                            </p>
                            <p className="text-[11.5px] text-slate-500 font-mono mt-2 max-w-md">
                                (Bấm <span className="text-blue-400 font-bold">Đăng Ảnh</span> để chọn file dán vào khung, hoặc kéo thả ảnh trực tiếp)
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
                            uploaderName={sticker.uploaderName}
                            elevation={sticker.elevation}
                            sheenMode={sticker.sheenMode}
                            lightingColor={sticker.lightingColor}
                            zIndex={sticker.zIndex}
                            isSelected={selectedId === sticker.id}
                            onSelect={(id) => setSelectedId(id)}
                            onPositionChange={handlePositionChange}
                            onResizeWidth={handleResizeWidth}
                            onDelete={handleDeleteSticker}
                            onEditDescription={(id) => {
                                const found = stickers.find((s) => s.id === id);
                                if (found) {
                                    setEditingSticker(found);
                                    setEditDescText(found.description || "");
                                    setEditNameText(found.uploaderName || "");
                                }
                            }}
                        />
                    ))}
                </main>
            )}

            {/* Bottom Canvas Footer Info & Height Extender Pill (Desktop only) */}
            {!isMobile && (
                <div className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-950/90 px-3 py-1 rounded-none border border-white/15 backdrop-blur-md pointer-events-auto">
                        {stickers.length} khoảnh khắc • Không gian: {canvasHeight}px
                    </div>

                    <button
                        onClick={() => handleExpandHeight(350)}
                        className="text-[11px] font-mono font-bold text-amber-300 hover:text-white bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 px-3.5 py-1.5 rounded-none border border-amber-500/40 transition-all backdrop-blur-md pointer-events-auto flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Mở rộng thêm không gian</span>
                    </button>
                </div>
            )}

            {/* Description & Uploader Name Edit Modal (Rendered via React Portal to document.body for true viewport centering) */}
            {mounted && editingSticker && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 font-sans m-auto">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <h3 className="text-sm sm:text-base font-bold text-amber-300 font-mono flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-amber-400" />
                                Chỉnh Sửa Bức Ảnh
                            </h3>
                            <button
                                onClick={() => setEditingSticker(null)}
                                className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-none cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Field 1: Tên người đăng / Nickname */}
                        <div>
                            <label className="block text-xs font-mono text-slate-400 mb-1.5">
                                Tên người đăng / Nickname
                            </label>
                            <input
                                type="text"
                                value={editNameText}
                                onChange={(e) => setEditNameText(e.target.value)}
                                placeholder="Nhập tên người đăng..."
                                className="w-full rounded-none bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-sans"
                            />
                        </div>

                        {/* Field 2: Ghi chú / Description */}
                        <div>
                            <label className="block text-xs font-mono text-slate-400 mb-1.5">
                                Ghi chú / Câu chuyện kỷ niệm đêm tiệc
                            </label>
                            <textarea
                                value={editDescText}
                                onChange={(e) => setEditDescText(e.target.value)}
                                rows={3}
                                placeholder="Nhập cảm xúc, tên địa điểm, kỷ niệm gala..."
                                className="w-full rounded-none bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-sans"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={() => {
                                    if (editingSticker) {
                                        const targetId = editingSticker.id;
                                        setEditingSticker(null);
                                        handleDeleteSticker(targetId);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-none border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa Bức Ảnh</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingSticker(null)}
                                    className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-slate-300 cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveDescription}
                                    className="px-3.5 py-1.5 rounded-none border border-amber-500/50 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer shadow-md"
                                >
                                    Lưu Mô Tả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Mandatory Uploader Name/Nickname Modal (Rendered via React Portal) */}
            {mounted && showNameModal && createPortal(
                <div className="fixed inset-0 z-[99999] bg-black/85 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-amber-500/50 rounded-none p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 font-sans m-auto">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <h3 className="text-sm sm:text-base font-bold text-amber-300 font-mono flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Tên / Nickname Của Bạn
                            </h3>
                            <button
                                onClick={() => {
                                    setShowNameModal(false);
                                    setPendingFiles(null);
                                }}
                                className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-none cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-slate-300 mb-2.5 font-sans leading-relaxed">
                                Vui lòng nhập <span className="text-amber-300 font-bold">Tên hoặc Nickname</span> của bạn trước khi đăng ảnh:
                            </p>
                            <input
                                type="text"
                                value={tempNameInput}
                                onChange={(e) => setTempNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleConfirmName();
                                }}
                                autoFocus
                                placeholder="Ví dụ: Hoàng Nam, Minh Tuấn, Alex..."
                                className="w-full rounded-none bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setShowNameModal(false);
                                    setPendingFiles(null);
                                }}
                                className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-slate-300 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmName}
                                className="px-3.5 py-1.5 rounded-none border border-amber-500/50 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer shadow-md"
                            >
                                Xác Nhận & Đăng Ảnh
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
