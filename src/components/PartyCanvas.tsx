"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Upload,
    Clipboard,
    Trash2,
    MessageSquare,
    X,
    Sparkles
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
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Uploader Name / Nickname Mandatory State
    const [userNickname, setUserNickname] = useState<string>("");
    const [showNameModal, setShowNameModal] = useState<boolean>(false);
    const [tempNameInput, setTempNameInput] = useState<string>("");
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

    // Sync uploader nickname from localStorage after client hydration
    useEffect(() => {
        const savedName = localStorage.getItem("canvas_uploader_name");
        if (savedName) {
            setUserNickname(savedName);
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial stickers from database
    const loadStickers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/canvas/stickers");
            const data = await res.json();
            if (data.success && Array.isArray(data.stickers)) {
                setStickers(data.stickers);
                try {
                    localStorage.setItem("party_canvas_stickers", JSON.stringify(data.stickers));
                } catch {
                    localStorage.removeItem("party_canvas_stickers");
                }
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
        try {
            localStorage.setItem("party_canvas_stickers", JSON.stringify(updatedList));
        } catch {
            localStorage.removeItem("party_canvas_stickers");
        }
        try {
            await fetch("/api/canvas/stickers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stickers: updatedList }),
            });
        } catch (e) {}
    }, []);

    // Core upload function with explicit uploader name
    const executeUploadFiles = async (files: File[], nameToUse: string) => {
        if (!files || files.length === 0) return;
        setUploading(true);

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
                        newStickersList.push({
                            id: `sticker-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                            url: data.url,
                            x: 0,
                            y: 0,
                            width: 360,
                            height: 260,
                            description: `Kỷ niệm đêm tiệc ${new Date().toLocaleDateString("vi-VN")}`,
                            uploaderName: nameToUse,
                            elevation: 5,
                            sheenMode: "sheen",
                            lightingColor: "#60a5fa",
                            zIndex: 1000 + stickers.length + i + 1,
                        });
                    } else {
                        alert(`Lỗi upload ảnh "${file.name}": ${data.error || "Không rõ nguyên nhân"}`);
                    }
                } catch (singleErr) {
                    console.error("Single file upload error:", singleErr);
                    alert(`Lỗi kết nối khi upload ảnh "${file.name}"`);
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
    const handleUploadMultipleFiles = (files: File[]) => {
        if (!files || files.length === 0) return;

        const currentName = userNickname || localStorage.getItem("canvas_uploader_name") || "";
        if (!currentName.trim()) {
            setPendingFiles(files);
            setTempNameInput("");
            setShowNameModal(true);
            return;
        }

        executeUploadFiles(files, currentName.trim());
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
            executeUploadFiles(pendingFiles, trimmed);
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
    }, [stickers, syncToDatabase]);

    // Handle File Selector change
    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUploadMultipleFiles(Array.from(files));
            e.target.value = "";
        }
    };

    // Delete a sticker
    const handleDeleteSticker = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?")) return;

        try {
            await fetch(`/api/canvas/stickers?id=${id}`, { method: "DELETE" });
        } catch (e) {
            console.error("Delete sticker API error:", e);
        }

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

    // Clear all canvas
    const handleClearCanvas = async () => {
        if (!confirm("Bạn có muốn xóa toàn bộ ảnh trong thư viện?")) return;
        setStickers([]);
        localStorage.removeItem("party_canvas_stickers");
        try {
            await fetch("/api/canvas/stickers?all=true", { method: "DELETE" });
        } catch (e) {
            console.error("Clear all canvas API error:", e);
        }
    };

    return (
        <div className={className || "relative w-full bg-black text-slate-100 flex flex-col font-sans border border-dashed border-white/10 rounded-none transition-all duration-300"}>
            {/* Control Toolbar */}
            <div className="absolute top-4 right-4 z-40 flex items-center justify-end gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelected}
                />

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

                <button
                    onClick={() => alert("Mẹo: Bạn có thể bấm Đăng Ảnh để chọn file, hoặc dán trực tiếp ảnh từ bộ nhớ tạm (Ctrl+V)!")}
                    className="hidden sm:flex px-3.5 py-2 rounded-none border border-white/15 text-xs font-mono text-slate-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 transition-all items-center gap-1.5 backdrop-blur-md"
                    title="Dán từ Clipboard (Ctrl+V)"
                >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste (Ctrl+V)</span>
                </button>

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

            {/* MINIMALIST STATIC MASONRY GRID */}
            <div className="w-full columns-2 md:columns-3 lg:columns-4 gap-6 p-4 pt-20 pb-20 min-h-[350px]">
                {stickers.length === 0 && !loading ? (
                    <div className="w-full text-center py-16 text-slate-500 text-xs font-mono">
                        {uploading ? (statusMsg || "Đang tải ảnh lên...") : "Chưa có ảnh nào được đăng trong thư viện."}
                    </div>
                ) : (
                    stickers.map((sticker) => (
                        <div
                            key={sticker.id}
                            onClick={() => {
                                setEditingSticker(sticker);
                                setEditDescText(sticker.description || "");
                                setEditNameText(sticker.uploaderName || "");
                            }}
                            className="break-inside-avoid mb-6 flex flex-col cursor-pointer group border border-zinc-900/50 bg-zinc-950/20 p-2 hover:border-zinc-700/60 transition-all duration-300"
                        >
                            {/* Image Wrapper */}
                            <div className="relative w-full overflow-hidden bg-zinc-900/30 rounded-none">
                                <img
                                    src={sticker.url}
                                    alt={sticker.description || "Ảnh khoảnh khắc"}
                                    className="w-full h-auto object-cover rounded-none block pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            {/* Text Info */}
                            <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                                {sticker.uploaderName && sticker.uploaderName.trim() !== "" && (
                                    <h4 className="font-bold text-white text-xs sm:text-sm font-sans truncate leading-tight">
                                        {sticker.uploaderName}
                                    </h4>
                                )}
                                {sticker.description && (
                                    <p className="text-[11px] sm:text-xs text-slate-300 font-sans font-light leading-snug whitespace-pre-wrap break-words">
                                        {sticker.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Description & Uploader Name Edit Modal */}
            {mounted && editingSticker && createPortal(
                <div 
                    onClick={() => setEditingSticker(null)}
                    className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4 cursor-pointer"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-950 border border-zinc-800 rounded-none w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] sm:max-h-[85vh] m-auto font-sans cursor-default"
                    >
                        {/* Left Side: Large Image Preview */}
                        <div className="flex-1 bg-black flex items-center justify-center p-4 md:p-6 border-b border-zinc-800 md:border-b-0 md:border-r border-zinc-800 relative select-none min-h-[200px] sm:min-h-[250px] md:min-h-[400px] overflow-hidden">
                            <img
                                src={editingSticker.url}
                                alt="Xem trước"
                                className="max-w-full max-h-[35vh] md:max-h-[70vh] object-contain rounded-none"
                            />
                        </div>

                        {/* Right Side: Edit Form Fields */}
                        <div className="w-full md:w-[360px] p-5 sm:p-6 flex flex-col justify-between space-y-4 overflow-y-auto bg-zinc-950">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <h3 className="text-sm sm:text-base font-bold text-amber-300 font-mono flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-amber-400" />
                                        Chi Tiết Bức Ảnh
                                    </h3>
                                    <button
                                        onClick={() => setEditingSticker(null)}
                                        className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-none cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

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

                                <div>
                                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                                        Ghi chú / Câu chuyện kỷ niệm đêm tiệc
                                    </label>
                                    <textarea
                                        value={editDescText}
                                        onChange={(e) => setEditDescText(e.target.value)}
                                        rows={4}
                                        placeholder="Nhập cảm xúc, tên địa điểm, kỷ niệm gala..."
                                        className="w-full rounded-none bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-sans resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                                <button
                                    onClick={handleSaveDescription}
                                    className="w-full py-2.5 rounded-none border border-amber-500/50 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer shadow-md transition-all text-center"
                                >
                                    Lưu Thay Đổi
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (editingSticker) {
                                                const targetId = editingSticker.id;
                                                setEditingSticker(null);
                                                handleDeleteSticker(targetId);
                                            }
                                        }}
                                        className="flex-1 py-2 rounded-none border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Xóa Ảnh</span>
                                    </button>
                                    <button
                                        onClick={() => setEditingSticker(null)}
                                        className="flex-1 py-2 rounded-none bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-slate-300 cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Mandatory Uploader Name/Nickname Modal */}
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
