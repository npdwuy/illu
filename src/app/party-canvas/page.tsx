import PartyCanvas from "@/components/PartyCanvas";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Canvas Khoảnh Khắc Đêm Tiệc | Originkit WebGL Stickers",
    description: "Khám phá canvas tương tác đêm tiệc với WebGL Draggable Sticker, hỗ trợ paste ảnh clipboard, lưu vị trí và ghi chú kỷ niệm.",
};

export default function PartyCanvasPage() {
    return <PartyCanvas />;
}
