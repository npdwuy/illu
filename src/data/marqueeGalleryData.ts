export interface MarqueeImage {
  id: string;
  url: string;
  title: string;
  uploaderName?: string;
  date: string;
  location: string;
  category: string;
  tags: string[];
  description: string;
  aspectRatio: string; // e.g. "16/9", "4/3", "1/1", "3/4", "21/9"
}

export const MARQUEE_ROWS: MarqueeImage[][] = [
  // ROW 0 (Moves Left - Diverse Aspect Ratios: 16/9, 3/4, 1/1, 21/9)
  [
    {
      id: "m0-1",
      url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
      title: "Minimalist Geometry",
      date: "14/03/2024",
      location: "Kyoto, Japan",
      category: "Architecture",
      tags: ["Minimalism", "Modern", "Japan"],
      description: "Khám phá vẻ đẹp giao thoa giữa ánh sáng tự nhiên và kiến trúc hình học tối giản tại không gian triển lãm Kyoto.",
      aspectRatio: "16/9"
    },
    {
      id: "m0-2",
      url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      title: "Monochrome Passages",
      date: "28/06/2024",
      location: "Berlin, Germany",
      category: "Street Art",
      tags: ["Monochrome", "B&W", "Urban"],
      description: "Tác phẩm nhiếp ảnh đen trắng lột tả sự tĩnh lặng kỳ diệu trong các lối đi ngầm giữa lòng thành phố Berlin.",
      aspectRatio: "3/4"
    },
    {
      id: "m0-3",
      url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
      title: "Spectral Waves",
      date: "09/11/2024",
      location: "Reykjavik, Iceland",
      category: "Abstract",
      tags: ["Gradient", "Neon", "Fluid"],
      description: "Dải quang phổ ánh sáng uốn lượn huyền ảo mô phỏng hiện tượng cực quang trên bầu trời bắc âu.",
      aspectRatio: "1/1"
    },
    {
      id: "m0-4",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      title: "Frost Glass Reflections",
      date: "02/01/2025",
      location: "Seoul, Korea",
      category: "Digital Art",
      tags: ["Glass", "Refraction", "3D"],
      description: "Khúc xạ ánh sáng qua bề mặt kính mờ mịn tạo nên hiệu ứng thị giác đa tầng ấn tượng.",
      aspectRatio: "21/9"
    },
    {
      id: "m0-5",
      url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
      title: "Neon Horizon",
      date: "18/02/2025",
      location: "Tokyo, Japan",
      category: "Cyberpunk",
      tags: ["Night", "Neon", "Futuristic"],
      description: "Đêm Tokyo rực rỡ sắc đèn neon phản chiếu trên những con phố mưa mùa xuân.",
      aspectRatio: "4/3"
    }
  ],

  // ROW 1 (Moves Right - Diverse Aspect Ratios: 1/1, 21/9, 4/3, 3/4)
  [
    {
      id: "m1-1",
      url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
      title: "Liquid Gold Spheres",
      date: "05/04/2024",
      location: "Milan, Italy",
      category: "3D Art",
      tags: ["Gold", "Liquid", "Render"],
      description: "Nghệ thuật tạo hình khối chất dẻo ánh kim chảy tràn sinh động trong triển lãm thiết kế Milan.",
      aspectRatio: "1/1"
    },
    {
      id: "m1-2",
      url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
      title: "Generative Code Art",
      date: "12/08/2024",
      location: "San Francisco, USA",
      category: "Generative",
      tags: ["Code", "Algorithm", "Fractal"],
      description: "Tác phẩm thuật toán tạo ra hàng triệu họa tiết fractal phức hợp chuyển động liên tục.",
      aspectRatio: "21/9"
    },
    {
      id: "m1-3",
      url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
      title: "Spatial Continuum",
      date: "30/10/2024",
      location: "London, UK",
      category: "Spatial",
      tags: ["VR", "Spatial", "Light"],
      description: "Không gian trải nghiệm ánh sáng vô cực xóa nhòa ranh giới giữa thực tế và ảo ảnh kỹ thuật số.",
      aspectRatio: "4/3"
    },
    {
      id: "m1-4",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      title: "Azure Shoreline",
      date: "15/12/2024",
      location: "Maldives",
      category: "Nature",
      tags: ["Ocean", "Azure", "Drone"],
      description: "Góc máy từ trên cao chụp lại những đường lượn sóng biển xanh ngọc bích trải dài trên cát trắng.",
      aspectRatio: "16/9"
    },
    {
      id: "m1-5",
      url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      title: "Prism Void",
      date: "20/01/2025",
      location: "Paris, France",
      category: "Abstract",
      tags: ["Prism", "Light", "Shadow"],
      description: "Sự phân tách ánh sáng lăng kính biến căn phòng tối thành một bức tranh màu sắc rực rỡ.",
      aspectRatio: "3/4"
    }
  ],

  // ROW 2 (Moves Left - Diverse Aspect Ratios: 4/3, 16/9, 1/1, 3/4)
  [
    {
      id: "m2-1",
      url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      title: "Vintage Camera Optics",
      date: "10/02/2024",
      location: "Vienna, Austria",
      category: "Photography",
      tags: ["Vintage", "Lens", "Analog"],
      description: "Góc quay cận cảnh những thấu kính cổ điển mang đậm giá trị lịch sử nhiếp ảnh thế giới.",
      aspectRatio: "4/3"
    },
    {
      id: "m2-2",
      url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80",
      title: "Urban Shadows",
      date: "22/05/2024",
      location: "New York, USA",
      category: "Street",
      tags: ["Shadow", "Silhouette", "NYC"],
      description: "Khoảnh khắc bóng đổ dài trên đại lộ Manhattan khi ánh nắng chiều chiếu xiên qua các tòa nhà cao tầng.",
      aspectRatio: "16/9"
    },
    {
      id: "m2-3",
      url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
      title: "Studio Lighting Masterclass",
      date: "19/09/2024",
      location: "Ho Chi Minh, Vietnam",
      category: "Studio",
      tags: ["Lighting", "Studio", "Portrait"],
      description: "Nghệ thuật điều khiển ánh sáng Strobe trong studio chuyên nghiệp tạo nét khối chân dung.",
      aspectRatio: "1/1"
    },
    {
      id: "m2-4",
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      title: "High Fashion Lookbook",
      date: "08/11/2024",
      location: "Paris, France",
      category: "Fashion",
      tags: ["Fashion", "Editorial", "Vogue"],
      description: "Bộ ảnh thời trang ứng dụng cao cấp với ngôn ngữ tạo dáng thanh lịch và hiện đại.",
      aspectRatio: "3/4"
    },
    {
      id: "m2-5",
      url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
      title: "Golden Hour Glow",
      date: "14/01/2025",
      location: "Da Nang, Vietnam",
      category: "Landscape",
      tags: ["GoldenHour", "Sunset", "Vietnam"],
      description: "Ánh sáng vàng ấm áp bao phủ bầu trời chiều trên bờ biển Đà Nẵng thanh bình.",
      aspectRatio: "16/9"
    }
  ]
];
