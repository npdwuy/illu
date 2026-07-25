export interface TimelineItem {
  id: string;
  year: number;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string; // Cover image for grid tile
  images: string[]; // Album list for left slideshow preview
  category: string;
}

export const TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: "t1",
    year: 2016,
    title: "Minimalist Dawn",
    subtitle: "Clean Lines & Monochromes",
    description: "Khởi đầu xu hướng tối giản với đường nét tinh tế, hình học hiện đại và màu sắc trung tính.",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Design"
  },
  {
    id: "t2",
    year: 2017,
    title: "Architectural Symmetry",
    subtitle: "Structure & Forms",
    description: "Nghệ thuật đối xứng kiến trúc kết hợp với ánh sáng tự nhiên tạo nên chiều sâu không gian.",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Architecture"
  },
  {
    id: "t3",
    year: 2018,
    title: "Vibrant Gradients",
    subtitle: "Color Fusion & Energy",
    description: "Sự bùng nổ của dải màu Gradient rực rỡ mang đến cảm hứng thị giác năng động và tươi trẻ.",
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Abstract"
  },
  {
    id: "t4",
    year: 2019,
    title: "Futuristic Glassmorphism",
    subtitle: "Translucency & Frost",
    description: "Giao diện kính mờ độc đáo cùng hiệu ứng nhạt mờ xuyên thấu đa lớp.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "UI Trend"
  },
  {
    id: "t5",
    year: 2020,
    title: "Cyber Neon Lights",
    subtitle: "Dark Mode Supremacy",
    description: "Kỷ nguyên của giao diện tối kết hợp dải đèn Neon huyền ảo đầy tính futuristic.",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Cyberpunk"
  },
  {
    id: "t6",
    year: 2021,
    title: "Organic 3D Shapes",
    subtitle: "Fluid Dynamics",
    description: "Các khối 3D uốn lượn tự nhiên mô phỏng vật liệu thật như thủy tinh, kim loại mềm và chất dẻo.",
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "3D Art"
  },
  {
    id: "t7",
    year: 2022,
    title: "Generative Fractals",
    subtitle: "Algorithmic Wonders",
    description: "Sự thăng hoa của nghệ thuật thuật toán và họa tiết học máy tạo nên cấu trúc phức hợp độc bản.",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Generative"
  },
  {
    id: "t8",
    year: 2023,
    title: "Spatial Immersion",
    subtitle: "Beyond Screens",
    description: "Trải nghiệm không gian 3 chiều tương tác liền mạch giữa môi trường thực tế và kỹ thuật số.",
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Spatial"
  },
  {
    id: "t9",
    year: 2024,
    title: "AI Canvas Evolution",
    subtitle: "Synthesized Aesthetics",
    description: "Sự kết hợp giữa trí tuệ nhân tạo và tư duy sáng tạo con người mở ra kỷ nguyên mỹ thuật mới.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "AI Art"
  },
  {
    id: "t10",
    year: 2026,
    title: "Quantum Horizon",
    subtitle: "The Next Era",
    description: "Tầm nhìn định hình tương lai thiết kế năm 2026 với sự tối giản tuyệt đối và sức mạnh đồ họa đỉnh cao.",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "Future"
  }
];
