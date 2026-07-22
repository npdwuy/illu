'use client';

import NextImage from 'next/image';
import Typewriter from '@/components/Typewriter';
import ClockGears from '@/components/ClockGears';
import GradientClock from '@/components/GradientClock';
import Star10Points from '@/components/Star10Points';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}
import { useAdaptiveScale } from '@/hooks/useAdaptiveScale';
import {
  Camera,
  Calendar,
  Clock,
  Navigation,
  MapPin,
  Play,
  ChevronRight,
  Upload,
  Heart,
  Trash2,
  MessageCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface YearEvent {
  year: number;
  title: string;
  tagline: string;
  description: string;
  stats: { label: string; value: string }[];
  images: {
    id: string;
    url: string;
    caption: string;
  }[];
  highlights: string[];
}

interface RecapImage {
  id: string;
  url: string;
  caption: string;
  likes: number;
  time: string;
}

interface Wish {
  id: string;
  name: string;
  role: string;
  content: string;
  date: string;
}

interface TimelineComment {
  id: string;
  year: number;
  name: string;
  content: string;
  imageUrl?: string;
  date: string;
}

const INITIAL_TIMELINE_DATA: YearEvent[] = [
  {
    year: 2016,
    title: "Những Bước Chân Đầu Tiên",
    tagline: "Khởi đầu của những người mộng mơ",
    description: "Năm thành lập chính thức câu lạc bộ nhiếp ảnh Illustris với những thành viên thế hệ Gen 1 nhiệt huyết.",
    stats: [{ label: "Thành viên", value: "12 nhân sự" }, { label: "Dự án", value: "02 bộ ảnh" }],
    images: [
      { id: "img-2016-1", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80", caption: "Buổi gặp mặt đầu tiên thiết lập CLB" }
    ],
    highlights: ["Chính thức ra mắt thương hiệu Illustris", "Tổ chức phototrip đầu tiên"]
  },
  {
    year: 2017,
    title: "Định Hình Phong Cách",
    tagline: "Đi tìm bản sắc riêng biệt",
    description: "Illustris bắt đầu thử nghiệm các concept chụp ảnh nghệ thuật đường phố và chân dung có chiều sâu.",
    stats: [{ label: "Triển lãm", value: "1 quy mô nhỏ" }, { label: "Kho tư liệu", value: "500+ shot hình" }],
    images: [{ id: "img-2017-1", url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80", caption: "Thử nghiệm ảnh phim trắng đen" }],
    highlights: ["Tổ chức workshop ánh sáng tự nhiên"]
  },
  {
    year: 2018,
    title: "Chuyên Nghiệp Hóa Studio",
    tagline: "Chinh phục ánh sáng nhân tạo",
    description: "Đầu tư mạnh mẽ vào hệ thống phòng Studio chuyên nghiệp, làm chủ các kỹ thuật tạo khối thương mại.",
    stats: [{ label: "Diện tích", value: "120m2 hiện đại" }, { label: "Thiết bị", value: "Dàn đèn studio mới" }],
    images: [{ id: "img-2018-1", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80", caption: "Setup phòng chụp Studio chuyên nghiệp tại Q2" }],
    highlights: ["Mở rộng mảng chụp thương mại cho nhãn hàng"]
  },
  {
    year: 2019,
    title: "Vươn Mình Ra Biển Lớn",
    tagline: "Đồng hành cùng các sự kiện quy mô",
    description: "Illustris trở thành đối tác bảo trợ hình ảnh chính thức cho nhiều chiến dịch lớn của giới trẻ.",
    stats: [{ label: "Sự kiện", value: "15+ chương trình" }, { label: "Khách hàng", value: "Đại học lớn" }],
    images: [{ id: "img-2019-1", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", caption: "Tác nghiệp tại festival âm nhạc lớn" }],
    highlights: ["Đội ngũ nâng cấp lên 45 thành viên hoạt động"]
  },
  {
    year: 2020,
    title: "Thử Thách & Chuyển Đổi Số",
    tagline: "Sáng tạo không ranh giới",
    description: "Vượt qua giai đoạn giãn cách bằng các dự án ảnh concept tại nhà và các buổi phê bình ảnh online.",
    stats: [{ label: "Project Online", value: "05 chiến dịch" }, { label: "Tương tác", value: "+200% social" }],
    images: [{ id: "img-2020-1", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80", caption: "Bộ ảnh góc nhìn qua ô cửa sổ gây bão mạng" }],
    highlights: ["Ra mắt chuỗi postcard gây quỹ cộng đồng"]
  },
  {
    year: 2021,
    title: "Trở Lại Mạnh Mẽ",
    tagline: "Bùng nổ năng lượng nghệ thuật",
    description: "Tái khởi động với năng lượng nhân đôi, tập trung vào nhiếp ảnh tư liệu đời sống và con người.",
    stats: [{ label: "Chuyến đi", value: "3 miền đất nước" }, { label: "Tư liệu", value: "20.000+ file ảnh" }],
    images: [{ id: "img-2021-1", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", caption: "Hành trình săn ảnh vùng cao Tây Bắc" }],
    highlights: ["Bộ ảnh phóng sự đạt giải thưởng sáng tạo trẻ"]
  },
  {
    year: 2022,
    title: "Mở Rộng Không Gian Thị Giác",
    tagline: "Tích hợp đồ họa và nhiếp ảnh",
    description: "Illustris không chỉ chụp ảnh mà còn kết hợp thiết kế đồ họa 2D/3D để tạo ra các tác phẩm Digital Art.",
    stats: [{ label: "Digital Art", value: "30 tác phẩm" }, { label: "Designer", value: "10 nhân sự mới" }],
    images: [{ id: "img-2022-1", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80", caption: "Triển lãm kết hợp công nghệ chiếu sáng nghệ thuật" }],
    highlights: ["Tái định vị thương hiệu thành Câu lạc bộ Sáng tạo Thị giác"]
  },
  {
    year: 2023,
    title: "Kết Nối Các Thế Hệ",
    tagline: "Văn hóa gia đình bền chặt",
    description: "Xây dựng mạng lưới cựu thành viên vững chắc, hỗ trợ định hướng nghề nghiệp cho các thế hệ đi sau.",
    stats: [{ label: "Mạng lưới Alumni", value: "80+ anh chị" }, { label: "Mentorship", value: "10 cặp đôi" }],
    images: [{ id: "img-2023-1", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80", caption: "Đêm tiệc kết nối thường niên ấm cúng" }],
    highlights: ["Ra mắt quỹ hỗ trợ đồ án tốt nghiệp cho thành viên CLB"]
  },
  {
    year: 2024,
    title: "Tiệm Cận Tiêu Chuẩn Quốc Tế",
    tagline: "Nâng tầm tư duy nhiếp ảnh thương mại",
    description: "Cập nhật các xu hướng thiết bị hiện đại hàng đầu và quy trình làm việc chuẩn các agency lớn.",
    stats: [{ label: "Thiết bị nâng cấp", value: "Hệ máy Medium Format" }, { label: "Dự án lớn", value: "12 dự án thương mại" }],
    images: [{ id: "img-2024-1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80", caption: "Sản xuất hình ảnh chất lượng cao trong môi trường studio" }],
    highlights: ["Workshop cùng nhiếp ảnh gia quốc tế"]
  },
  {
    year: 2025,
    title: "Cột Mốc Vàng Son",
    tagline: "Thập kỷ ánh sáng - Vạn dấu ấn khắc sâu",
    description: "Hành trình bền bỉ đầy tự hào từ một nhóm đam mê nhỏ trở thành biểu tượng thiết kế thị giác của giới trẻ.",
    stats: [{ label: "Ấn bản phát hành", value: "1.000 cuốn" }, { label: "Quy mô thành viên", value: "150+" }],
    images: [{ id: "img-2025-1", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80", caption: "Chuẩn bị cho đại lễ kỷ niệm hành trình 10 năm" }],
    highlights: ["Sách ảnh kỷ niệm 'Illustris Decennium' chính thức phát hành"]
  },
  {
    year: 2026,
    title: "Chương Mới - Tương Lai Xanh",
    tagline: "Nhiếp ảnh bền vững, nhân văn hơn",
    description: "Nhìn về tương lai phía trước, Illustris tiếp tục dẫn đầu xu hướng nhiếp ảnh gắn liền với trách nhiệm xã hội và môi trường.",
    stats: [{ label: "Chiến dịch sinh thái", value: "5 dự án lớn" }, { label: "Địa điểm tiệc", value: "Bamos Trần Não" }],
    images: [
      { id: "img-2026-1", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80", caption: "Sẵn sàng cho cột mốc kỷ niệm 10 năm tại Bamos" }
    ],
    highlights: ["Chiến dịch ảnh 'Green Lens - Thấu kính Xanh'", "Gala Kỷ niệm 10 năm thành lập đại gia đình Illustris"]
  }
];

// ============================================================================
// BỘ ĐIỀU CHỈNH CẤU HÌNH INTRO ANIMATION (CÔNG KHAI DỄ DÀNG TÙY CHỈNH)
// ============================================================================

// 1. ĐỘ TRỄ BẮT ĐẦU ANIMATION CHUNG (Giây):
// 0.0 = Bắt đầu ngay khi reload/mở trang, 0.5 = Chờ 0.5 giây mới chạy animation
const INTRO_START_DELAY_SEC = 0.0;

// 2. TỔNG THỜI GIAN MOTION (Giây):
const TOTAL_INTRO_DURATION_SEC = 10;

// 3. ĐỘ TRỄ BẮT ĐẦU TRƯỢT SỐ (Giây):
// 0.0 = Trượt ngay, 1.0 = Đợi 1.0s sau intro mới bắt đầu trượt số 09 -> 10
const NUMBERS_START_DELAY_SEC = 2.25;

// 4. TỶ LỆ TRỄ CỦA HÀNG CHỤC (0.0 -> 1.0):
// 0.5 = Số 9 hàng đơn vị trượt xuống được 1/2 đoạn đường thì Hàng chục (0->1) mới bắt đầu bứt tốc trượt nhanh
const TENS_SLIDE_START_RATIO = 0.4;

// 5. KHOẢNG CÁCH MỜ DẦN CHỮ SỐ KHI RỜI TÂM CHÍNH (px):
// Chữ số nằm cách tâm chính 370px càng xa sẽ mờ dần về 0% opacity
const REEL_FADE_DISTANCE = 300;

// 5. HỆ SỐ ĐƯỜNG CONG CUBIC-BEZIER CHO CHỮ SỐ [p1x, p1y, p2x, p2y]:
// Ví dụ các bộ hệ số phổ biến:
// - [0.42, 0.0, 0.58, 1.0]     -> Ease-In-Out mượt mà chuẩn mực
// - [0.25, 0.1, 0.25, 1.0]     -> Ease mượt nhẹ
// - [0.0, 0.0, 0.2, 1.0]       -> Ease-Out (chạy nhanh từ đầu, phanh chậm mượt ở cuối)
// - [0.68, -0.55, 0.265, 1.55] -> Back/Bounce (có độ nảy nhẹ khi về số 1)
const NUMBERS_BEZIER_CURVE: [number, number, number, number] = [0.5, 0.0, 0.38, 1.0];

// 5. HỆ SỐ ĐƯỜNG CONG CUBIC-BEZIER CHO NGÔI SAO [p1x, p1y, p2x, p2y]:
const STAR_BEZIER_CURVE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

// 6. CẤU HÌNH NGÔI SAO XUẤT HIỆN:
interface StarAnimConfig {
  id: string;
  x: number;
  y: number;
  baseScale: number;
  fill: string;
  turns: number; // Số vòng xoay
  spinSpeed: number; // Hệ số vận tốc xoay (ví dụ 1.0, 1.5, 2.0)
  endRotation: number; // Góc nghiêng kết thúc
  delaySec: number; // Thời điểm bắt đầu xuất hiện (giây)
  bezierCurve?: [number, number, number, number]; // Đường cong bezier riêng (tùy chọn)
}

const STAR_ANIM_CONFIG: StarAnimConfig[] = [
  { id: 'star-w1', x: 640, y: 155, baseScale: 0.35, fill: 'white', turns: 1, spinSpeed: 1.0, endRotation: 15, delaySec: 7.2 },
  { id: 'star-w2', x: 1100, y: 280, baseScale: 0.6, fill: 'white', turns: 0.5, spinSpeed: 1.2, endRotation: -20, delaySec: 8.4 },
  { id: 'star-w3', x: 580, y: 440, baseScale: 0.6, fill: 'white', turns: 1, spinSpeed: 1.5, endRotation: 45, delaySec: 7.6 },
  { id: 'star-b1', x: 1050, y: 120, baseScale: 0.33, fill: 'url(#starBlueGradient)', turns: 0.8, spinSpeed: 2.0, endRotation: 90, delaySec: 8.8 },
  { id: 'star-b2', x: 650, y: 480, baseScale: 0.35, fill: 'url(#starBlueGradient)', turns: 0.67, spinSpeed: 1.1, endRotation: -45, delaySec: 8.5 },
];

// 6. CẤU HÌNH ĐỒNG HỒ:
// - Số phút (step) lùi ban đầu trước 10:00 (ví dụ 10 = bắt đầu từ 09:50)
const CLOCK_START_MINUTES_BEFORE_10 = 10;

// - Tốc độ nấc nhảy kim đồng hồ (nấc/giây). Ví dụ: 5 = 5 nấc/giây, 10 = 10 nấc/giây, 1 = 1 nấc/giây
const CLOCK_STEPS_PER_SEC = 1;

// 7. BỘ ĐIỀU CHỈNH SCROLL PIN HERO (GSAP SCROLLTRIGGER - TỰ THAY ĐỔI):
// - KHOẢNG CÁCH CUỘN PIN HERO (Tăng/giảm độ dài cuộn của trang Hero):
// Ví dụ: '+=250%' (ngắn), '+=350%' (vừa), '+=450%' (dài), '+=600%' (rất dài)
const HERO_PIN_SCROLL_DISTANCE = '+=450%';

// - DURATION XUẤT HIỆN CỦA TỪNG THẺ TRONG CHUỖI CUỘN (GSAP Timeline units):
// Tăng số này nếu muốn thẻ đó xuất hiện từ từ qua quãng đường cuộn dài hơn
const HERO_TAGLINE_DURATION = 0.67;      // Chữ "NHIẾP ẢNH CHỨ?"
const HERO_TIME_CARD_DURATION = 0.67;    // Thẻ THỜI GIAN
const HERO_LOCATION_CARD_DURATION = 0.67;// Thẻ ĐỊA ĐIỂM
const HERO_BUFFER_PAUSE_DURATION = 1.67; // Khoảng dừng tĩnh cho người dùng đọc thông tin trước khi chuyển trang

// ============================================================================
// 8. BỘ ĐIỀU CHỈNH THẺ ĐẾM NGƯỢC MÀU TRẮNG (THIẾT KẾ CHUẨN MẪU EVENT)
// ============================================================================
// Bật/tắt thẻ đếm ngược:
const SHOW_CLOCK_COUNTDOWN_CARD = true;

// Tiêu đề hiển thị trên góc trái thẻ:
const CLOCK_COUNTDOWN_TITLE = 'Event';

// Tọa độ (X, Y) chuẩn theo không gian 1440x810 của Master Clock SVG:
// Đặt X và Y tương tự như cách đặt tọa độ bánh răng/ngôi sao để vị trí thẻ luôn dính chặt vào hình SVG
const CLOCK_COUNTDOWN_X = 1430; // Tọa độ X (Góc phải thẻ) - Từ 0 đến 1440
const CLOCK_COUNTDOWN_Y = 135;  // Tọa độ Y (Đỉnh thẻ) - Từ 0 đến 810

// ĐIỀU CHỈNH KÍCH THƯỚC VÀ GÓC XOAY THẺ (Dễ dàng thay đổi kích thước thẻ tại đây):
// Ví dụ: 0.7 = Nhỏ, 1.0 = Chuẩn kích thước, 1.25 = Phóng to 125%
const CLOCK_COUNTDOWN_SCALE = 0.75;
const CLOCK_COUNTDOWN_ROTATION = '7deg';    // Góc xoay nghiêng (Ví dụ: '0deg', '5deg', '-3deg')

// Hàm giải phương trình Cubic Bezier 1D mượt 100% không khựng
function solveCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u;
    const dx = 3 * (1 - u) * (1 - u) * p1x + 6 * (1 - u) * u * (p2x - p1x) + 3 * u * u * (1 - p2x);
    if (Math.abs(dx) < 1e-6) break;
    u -= (x - t) / dx;
  }

  return 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
}

export default function App() {
  useAdaptiveScale(1920, 1080);
  const [timelineData] = useState<YearEvent[]>(INITIAL_TIMELINE_DATA);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState('home');

  // States cho Intro Animation
  const [introElapsedSec, setIntroElapsedSec] = useState(0);
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  useEffect(() => {
    let startTime: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const totalRequired = INTRO_START_DELAY_SEC + TOTAL_INTRO_DURATION_SEC;

      if (elapsed >= totalRequired) {
        setIntroElapsedSec(TOTAL_INTRO_DURATION_SEC);
        setIsIntroFinished(true);
      } else {
        const activeElapsed = Math.max(0, elapsed - INTRO_START_DELAY_SEC);
        setIntroElapsedSec(activeElapsed);
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Tiến trình thời gian chuẩn 0.0 -> 1.0 sau khi hết độ trễ INTRO_START_DELAY_SEC
  const rawProgress = Math.min(1, introElapsedSec / TOTAL_INTRO_DURATION_SEC);

  // Tiến trình trượt số sau độ trễ NUMBERS_START_DELAY_SEC
  const activeNumbersElapsed = Math.max(0, introElapsedSec - NUMBERS_START_DELAY_SEC);
  const numbersDuration = Math.max(0.2, TOTAL_INTRO_DURATION_SEC - NUMBERS_START_DELAY_SEC);
  const rawNumbersProgress = Math.min(1, activeNumbersElapsed / numbersDuration);

  // 1. Tiến trình Hàng đơn vị (Số 9 -> 0): Bắt đầu chạy ngay từ đầu
  const easedUnitsProgress = solveCubicBezier(
    NUMBERS_BEZIER_CURVE[0],
    NUMBERS_BEZIER_CURVE[1],
    NUMBERS_BEZIER_CURVE[2],
    NUMBERS_BEZIER_CURVE[3],
    rawNumbersProgress
  );

  // 2. Tiến trình Hàng chục (0 -> 1): Chờ Số 9 trượt qua tỷ lệ TENS_SLIDE_START_RATIO rồi mới trượt bứt tốc
  const rawTensProgress = rawNumbersProgress < TENS_SLIDE_START_RATIO
    ? 0
    : Math.min(1, (rawNumbersProgress - TENS_SLIDE_START_RATIO) / (1 - TENS_SLIDE_START_RATIO));

  const easedTensProgress = solveCubicBezier(
    NUMBERS_BEZIER_CURVE[0],
    NUMBERS_BEZIER_CURVE[1],
    NUMBERS_BEZIER_CURVE[2],
    NUMBERS_BEZIER_CURVE[3],
    rawTensProgress
  );

  // Tính toán nấc giật hiện tại của kim đồng hồ dựa theo vận tốc CLOCK_STEPS_PER_SEC (nấc/giây)
  const maxClockSteps = CLOCK_START_MINUTES_BEFORE_10;
  const calculatedStep = isIntroFinished
    ? maxClockSteps
    : Math.floor(introElapsedSec * CLOCK_STEPS_PER_SEC);
  const currentStep = Math.min(maxClockSteps, calculatedStep);

  const introMinuteCount = (60 - CLOCK_START_MINUTES_BEFORE_10) + currentStep;
  const currentMinAngle = (introMinuteCount * 6 - 90) % 360;
  const currentHourAngle = ((9 + introMinuteCount / 60) * 30 - 90) % 360;

  // GSAP ScrollTrigger Pinning & Staged Animation References
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const timeCardRef = useRef<HTMLDivElement>(null);
  const locationCardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!pinWrapperRef.current || !homeRef.current || !timelineRef.current) return;

    const ctx = gsap.context(() => {
      const homeEl = homeRef.current!;
      const timelineEl = timelineRef.current!;
      const taglineEl = taglineRef.current;
      const timeEl = timeCardRef.current;
      const locationEl = locationCardRef.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'hero-pin-trigger',
          trigger: pinWrapperRef.current,
          start: 'top top',
          end: HERO_PIN_SCROLL_DISTANCE,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress < 0.72) {
              setActiveTab('home');
            } else if (self.progress >= 0.72 && self.progress < 0.98) {
              setActiveTab('timeline');
            }
          },
        },
      });

      // Initial state: Hide Tagline, Time & Location cards
      if (taglineEl) gsap.set(taglineEl, { opacity: 0, y: 30 });
      if (timeEl) gsap.set(timeEl, { opacity: 0, y: 30 });
      if (locationEl) gsap.set(locationEl, { opacity: 0, y: 30 });

      // Stage 1: Scroll -> Trigger display "NHIẾP ẢNH CHỨ?" text first
      if (taglineEl) {
        tl.to(taglineEl, {
          opacity: 1,
          y: 0,
          duration: HERO_TAGLINE_DURATION,
          ease: 'power2.out',
        });
      }

      // Stage 2: Scroll -> Trigger display THỜI GIAN card
      if (timeEl) {
        tl.to(timeEl, {
          opacity: 1,
          y: 0,
          duration: HERO_TIME_CARD_DURATION,
          ease: 'power2.out',
        });
      }

      // Stage 3: Scroll -> Trigger display ĐỊA ĐIỂM card
      if (locationEl) {
        tl.to(locationEl, {
          opacity: 1,
          y: 0,
          duration: HERO_LOCATION_CARD_DURATION,
          ease: 'power2.out',
        });
      }

      // Stage 4: Scroll -> Buffer pause cho người dùng đọc thông tin
      tl.to({}, { duration: HERO_BUFFER_PAUSE_DURATION });

      // Stage 5: Scroll -> Timeline slides UP over Home by 30%
      tl.to(timelineEl, {
        y: () => -homeEl.offsetHeight * 0.3,
        ease: 'none',
        duration: 0.2,
      });

      // Stage 6: Scroll -> Both move upward together
      tl.to(timelineEl, {
        y: () => -homeEl.offsetHeight * 1.0,
        ease: 'none',
        duration: 0.3,
      }, 'phase2')
        .to(homeEl, {
          y: () => -homeEl.offsetHeight * 0.35,
          opacity: 0.25,
          ease: 'none',
          duration: 0.3,
        }, 'phase2');
    }, pinWrapperRef);

    return () => ctx.revert();
  }, []);

  // Disable Zoom in/out via Keyboard Shortcuts, Mouse Wheel, and Touch Gestures
  useEffect(() => {
    // 1. Chặn Zoom bằng Phím tắt (Ctrl/Cmd + +, -, =, 0) & Ctrl + Wheel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // 2. Chặn Pinch-to-zoom 2 ngón tay trên Mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Chặn Double-tap zoom trên iOS
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Smooth Navigation Handler compatible with GSAP ScrollTrigger
  const handleNavClick = (targetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(targetId);

    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetId === 'timeline') {
      const st = ScrollTrigger.getById('hero-pin-trigger');
      if (st) {
        // Scroll to the point where Timeline has slid over Home (at 78% of the pin range)
        const targetY = st.start + (st.end - st.start) * 0.78;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        const el = document.getElementById('timeline');
        if (el) {
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }
      }
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  // Auto-sync activeTab for Gallery and Wish sections using IntersectionObserver
  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    const galleryEl = document.getElementById('gallery');
    const wishEl = document.getElementById('wish');

    if (galleryEl) observer.observe(galleryEl);
    if (wishEl) observer.observe(wishEl);

    return () => observer.disconnect();
  }, []);

  // Shared server states
  const [recapImages, setRecapImages] = useState<RecapImage[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [timelineComments, setTimelineComments] = useState<TimelineComment[]>([]);

  // States for Wish Form
  const [newWishName, setNewWishName] = useState("");
  const [newWishRole, setNewWishRole] = useState("");
  const [newWishContent, setNewWishContent] = useState("");

  // States for Timeline Comment Form
  const [commentName, setCommentName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentImage, setCommentImage] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  // Sync Master Clock dynamic scaling for absolute child elements (e.g., Event Card)
  const masterClockRef = useRef<HTMLDivElement>(null);
  const [masterClockScale, setMasterClockScale] = useState<number | null>(null);

  useEffect(() => {
    if (!masterClockRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newScale = entry.contentRect.width / 1440;
        // Tối ưu hiệu năng: Chỉ trigger re-render khi tỉ lệ thay đổi đáng kể (> 0.5%) để giảm lag
        setMasterClockScale((prev) => {
          if (prev === null || Math.abs(prev - newScale) > 0.005) return newScale;
          return prev;
        });
      }
    });
    observer.observe(masterClockRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync data from API
  const fetchSharedData = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.images) setRecapImages(data.images);
        if (data.wishes) setWishes(data.wishes);
        if (data.comments) setTimelineComments(data.comments);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu server:", err);
    }
  };

  useEffect(() => {
    fetchSharedData();
    const syncInterval = setInterval(fetchSharedData, 5000);

    // Event countdown
    const targetDate = new Date('2026-07-26T16:30:00').getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({
        days: d < 10 ? `0${d}` : `${d}`,
        hours: h < 10 ? `0${h}` : `${h}`,
        minutes: m < 10 ? `0${m}` : `${m}`,
        seconds: s < 10 ? `0${s}` : `${s}`,
      });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // IntersectionObserver to highlight current active section while scrolling
    const sections = ['home', 'timeline', 'gallery', 'wish'];
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px', // Trigger when section occupies the sweet middle spot of viewport
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      clearInterval(syncInterval);
      clearInterval(timerInterval);
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const currentEvent = timelineData.find(e => e.year === selectedYear) || timelineData[timelineData.length - 1];
  const commentsForYear = timelineComments.filter(c => c.year === selectedYear);

  // Compress uploaded images
  const processImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            callback(compressedBase64);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Photo to Event Gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file, async (compressedBase64) => {
        const newImg: RecapImage = {
          id: `recap-${Date.now()}`,
          url: compressedBase64,
          caption: file.name.split('.')[0] || "Ảnh kỉ niệm từ thành viên",
          likes: 0,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        try {
          const response = await fetch('/api/photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'IMAGE', data: newImg }),
          });
          if (response.ok) fetchSharedData();
        } catch (err) {
          console.error("Lỗi đẩy ảnh lên server:", err);
        }
      });
    }
  };

  // Like Photo
  const handleLikeRecap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LIKE_IMAGE', id }),
      });
      fetchSharedData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Photo
  const deleteRecapImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DELETE_IMAGE', id }),
      });
      fetchSharedData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Wish
  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishName.trim() || !newWishContent.trim()) return;

    const newWish: Wish = {
      id: `w-${Date.now()}`,
      name: newWishName.trim(),
      role: newWishRole.trim() || "Thành viên gia đình",
      content: newWishContent.trim(),
      date: new Date().toLocaleDateString('vi-VN')
    };

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WISH', data: newWish }),
      });
      if (response.ok) {
        setNewWishName("");
        setNewWishRole("");
        setNewWishContent("");
        fetchSharedData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload image for timeline comment
  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file, (base64) => setCommentImage(base64));
    }
  };

  // Add Timeline Comment
  const handleAddTimelineComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim()) return;

    const newComment: TimelineComment = {
      id: `cmt-${Date.now()}`,
      year: selectedYear,
      name: commentName.trim(),
      content: commentContent.trim(),
      imageUrl: commentImage || undefined,
      date: new Date().toLocaleDateString('vi-VN')
    };

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TIMELINE_COMMENT', data: newComment }),
      });
      if (response.ok) {
        setCommentName("");
        setCommentContent("");
        setCommentImage(null);
        fetchSharedData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden adaptive-scale-wrapper">
      {/* Background radial glowing effects */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-blue-950/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/[0.04]">
        <div className="w-full pl-4 pr-6 sm:pl-6 sm:pr-12 lg:pl-8 lg:pr-20 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <NextImage
              src="/illu-logo.png"
              alt="Illustris Logo"
              width={64}
              height={45}
              className="h-11 w-auto object-contain -translate-y-1"
              priority
            />
            <div>
              <span className="font-perandory text-xl tracking-[0.15em] text-white block leading-none">ILLUSTRIS</span>
              <span className="text-[8px] text-slate-400 tracking-[0.3em] uppercase font-light block mt-1 font-condensed">Photography Club</span>
            </div>
          </div>

          {/* Navigation with smooth anchors */}
          <nav className="flex items-center gap-8 md:gap-12 text-[12px] tracking-[0.15em] uppercase font-medium text-slate-400 font-condensed">
            <a
              href="#home"
              onClick={(e) => handleNavClick('home', e)}
              className={`hover:text-white transition-colors relative py-2 ${activeTab === 'home' ? 'text-white font-semibold' : ''}`}
            >
              Trang chủ
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
            <a
              href="#timeline"
              onClick={(e) => handleNavClick('timeline', e)}
              className={`hover:text-white transition-colors relative py-2 ${activeTab === 'timeline' ? 'text-white font-semibold' : ''}`}
            >
              Timeline
              {activeTab === 'timeline' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
            <a
              href="#gallery"
              onClick={(e) => handleNavClick('gallery', e)}
              className={`hover:text-white transition-colors relative py-2 ${activeTab === 'gallery' ? 'text-white font-semibold' : ''}`}
            >
              Thư viện
              {activeTab === 'gallery' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
            <a
              href="#wish"
              onClick={(e) => handleNavClick('wish', e)}
              className={`hover:text-white transition-colors relative py-2 ${activeTab === 'wish' ? 'text-white font-semibold' : ''}`}
            >
              Lời chúc
              {activeTab === 'wish' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
          </nav>
        </div>
      </header>

      {/* GSAP PINNING CONTAINER FOR HOME AND TIMELINE */}
      <div ref={pinWrapperRef} className="relative w-full">
        {/* 1. HERO SECTION (ID: home) */}
        <section
          id="home"
          ref={homeRef}
          className="min-h-screen pt-20 w-full flex flex-col justify-center relative z-10 overflow-hidden"
        >
          {/* Expanded Hero Content Box (Canh sát lề trái đồng bộ với Logo) */}
          <div className="w-full pl-4 pr-6 sm:pl-6 sm:pr-12 lg:pl-8 lg:pr-20 z-10 py-12 -translate-y-10 md:-translate-y-16">
            {/* TÙY CHỈNH KHOẢNG CÁCH GAP TRÊN/DƯỚI CHÍNH: Thay space-y-6 thành space-y-8, space-y-10, space-y-12,... */}
            <div className="max-w-4xl space-y-6">
              {/* TÙY CHỈNH KHOẢNG CÁCH GIỮA CÁC DÒNG TIÊU ĐỀ & CÂU KHẨU HIỆU: Thay space-y-2 thành space-y-3, space-y-4,... */}
              <div className="space-y-2">
                <span className="text-base md:text-lg font-semibold tracking-[0.35em] text-white/80 uppercase block font-condensed mb-2">
                  KỶ NIỆM 10 NĂM THÀNH LẬP
                </span>
                <h1 className="text-7xl md:text-[120px] font-perandory tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#0a08b6] via-[#46c2ff] to-white drop-shadow-[0_10px_25px_rgba(10,8,182,0.35)] -mb-1">
                  ILLUSTRIS
                </h1>
                <h2 className="text-sm md:text-base font-medium tracking-[0.25em] text-white/75 uppercase leading-none font-condensed flex items-center pt-1">
                  <Typewriter
                    texts={[
                      "  10 NĂM",
                      "  MỘT HÀNH TRÌNH",
                      "  TRIỆU KHOẢNH KHẮC",
                      " 10 NĂM – MỘT HÀNH TRÌNH – TRIỆU KHOẢNH KHẮC"
                    ]}
                    ease={{ duration: 0.07, delay: 1.5 }}
                    deleteSpeed={0.04}
                    showCursor={true}
                    cursorChar="_"
                    typedColor="rgba(255, 255, 255, 0.85)"
                    cursorColor="rgba(255, 255, 255, 0.85)"
                  />
                </h2>
                {/* NHIẾP ẢNH CHỨ? - Tùy chỉnh pt-1 hoặc my-2 để tăng khoảng cách cách biệt (ẩn mặc định bằng opacity-0 translate-y-7) */}
                <p ref={taglineRef} className="font-serif text-xl md:text-2xl italic font-normal text-white/80 tracking-wide pt-1 opacity-0 translate-y-7">
                  NHIẾP ẢNH CHỨ?
                </p>
              </div>

              {/* Event Info - TÙY CHỈNH GAP VỚI ĐƯỜNG KẺ TRÊN & GAP NGANG GIỮA THỜI GIAN/ĐỊA ĐIỂM (pt-6 mt-6 gap-10 md:gap-14) */}
              <div className="flex flex-row items-start gap-10 md:gap-14 pt-6 border-t border-white/[0.06] mt-6 select-none">
                {/* Time (ẩn mặc định bằng opacity-0 translate-y-7) */}
                <div ref={timeCardRef} className="flex gap-4 items-start opacity-0 translate-y-7">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 md:w-9 md:h-9 text-[#5d66d0] shrink-0 mt-0.5" fill="none" stroke="currentColor">
                    <rect x="3" y="6" width="26" height="22" rx="4" strokeWidth="1.8" />
                    <path d="M8 3v4M16 3v4M24 3v4" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M3 12h26" strokeWidth="1.5" />
                    <rect x="7" y="16" width="4" height="4" strokeWidth="1.5" />
                    <circle cx="16" cy="18" r="1" fill="currentColor" />
                    <circle cx="21" cy="18" r="1" fill="currentColor" />
                    <circle cx="26" cy="18" r="1" fill="currentColor" opacity="0.6" />
                    <circle cx="16" cy="23" r="1" fill="currentColor" />
                    <circle cx="21" cy="23" r="1" fill="currentColor" />
                    <circle cx="26" cy="23" r="1" fill="currentColor" opacity="0.6" />
                  </svg>
                  <div className="space-y-1 min-w-0 font-condensed">
                    <span className="text-xs text-white tracking-[0.25em] font-medium uppercase block">THỜI GIAN</span>
                    <p className="text-base md:text-lg font-medium text-[#5d66d0] leading-tight font-sans">26.07.2026</p>
                    <p className="text-xs md:text-sm text-[#5d66d0] font-normal font-sans">16:30 - 19:45</p>
                  </div>
                </div>

                {/* Location (Clickable Google Maps link with max-w-[220px] - ẩn mặc định bằng opacity-0 translate-y-7) */}
                <a
                  ref={locationCardRef}
                  href="https://www.google.com/maps/search/?api=1&query=Bamos+Tr%E1%BA%A7n+N%C3%A3o+9%2F8+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+10+B%C3%ACnh+Kh%C3%A1nh+An+Kh%C3%A1nh+H%E1%BB%93+Ch%C3%AD+Minh"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Mở vị trí Bamos Trần Não trên Google Maps"
                  className="group flex gap-4 items-start max-w-[220px] transition-all cursor-pointer opacity-0 translate-y-7"
                >
                  <svg viewBox="0 0 36 36" className="w-9 h-9 md:w-10 md:h-10 text-[#5d66d0] group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor">
                    <path
                      d="M18 3C12.5 3 8 7.5 8 13C8 20 18 27.5 18 27.5C18 27.5 28 20 28 13C28 7.5 23.5 3 18 3Z"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <circle cx="18" cy="12" r="3.5" strokeWidth="1.8" />
                    <ellipse cx="18" cy="29" rx="12" ry="4" strokeWidth="1.8" />
                  </svg>
                  <div className="space-y-1 min-w-0 font-condensed">
                    <span className="text-xs text-white tracking-[0.25em] font-medium uppercase block">ĐỊA ĐIỂM</span>
                    <p className="text-base md:text-lg font-medium text-[#5d66d0] group-hover:text-blue-400 group-hover:underline leading-tight font-sans transition-colors flex items-center gap-1">
                      <span>Bamos Trần Não</span>
                    </p>
                    <p className="text-xs md:text-sm text-white/90 font-light leading-relaxed font-sans">
                      9/8 Đường số 10, Bình Khánh, An Khánh, Hồ Chí Minh
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* 
            Master Clock Container (Tất cả bánh răng + Kim đồng hồ relative 100% theo tỉ lệ SVG Clock 1440x810)
            - Khóa aspect-ratio [1440/810] giúp tọa độ % của kim đồng hồ và bánh răng luôn KHỚP CHÍNH XÁC VỚI FILE SVG ở MỌI ĐỘ PHÂN GIẢI
          */}
          <div className="absolute top-0 right-0 h-full pointer-events-none z-0 opacity-100 select-none overflow-visible">
            <div ref={masterClockRef} className="relative h-full aspect-[1440/810] flex items-end justify-end overflow-visible">
              {/* Layer 1: Nền SVG Clock chính */}
              <NextImage
                src="/clock.svg"
                alt="Clock Graphic Base"
                width={1440}
                height={810}
                className="w-full h-full object-contain object-right-bottom relative z-1"
                priority
              />

              {/* Layer 0.5: Thẻ đếm ngược màu trắng (Nằm dưới clock.svg) */}
              {SHOW_CLOCK_COUNTDOWN_CARD && (() => {
                const daysStr = (countdown.days || '00').padStart(2, '0');
                const hoursStr = (countdown.hours || '00').padStart(2, '0');
                const minsStr = (countdown.minutes || '00').padStart(2, '0');

                return (
                  <div
                    className="absolute pointer-events-auto z-0 select-none transition-opacity duration-300"
                    style={{
                      opacity: masterClockScale === null ? 0 : 1, // Ẩn hoàn toàn cho đến khi tính xong kích thước
                      // Chuyển đổi tọa độ 1440x810 sang % tương đối để đồng bộ tuyệt đối với tỉ lệ thẻ SVG
                      right: `${((1440 - CLOCK_COUNTDOWN_X) / 1440) * 100}%`,
                      top: `${(CLOCK_COUNTDOWN_Y / 810) * 100}%`,
                      transform: `scale(${CLOCK_COUNTDOWN_SCALE * (masterClockScale || 1)}) rotate(${CLOCK_COUNTDOWN_ROTATION})`,
                      transformOrigin: 'top right',
                    }}
                  >
                    <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 flex flex-col gap-3.5 w-fit">
                      {/* Header row: Title on left, Chevron circle on right */}
                      <div className="flex items-center justify-between px-0.5 gap-4">
                        <h4 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight font-sans">
                          {CLOCK_COUNTDOWN_TITLE}
                        </h4>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300/90 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 stroke-[2]" />
                        </div>
                      </div>

                      {/* Digits and labels row */}
                      <div className="flex items-start justify-center gap-1.5 sm:gap-2 pt-0.5">
                        {/* Days group */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {daysStr[0]}
                            </div>
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {daysStr[1]}
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
                            days
                          </span>
                        </div>

                        {/* Colon */}
                        <div className="h-12 sm:h-17 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-900 px-0.5">:</div>

                        {/* Hours group */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {hoursStr[0]}
                            </div>
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {hoursStr[1]}
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
                            hours
                          </span>
                        </div>

                        {/* Colon */}
                        <div className="h-12 sm:h-17 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-900 px-0.5">:</div>

                        {/* Minutes group */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {minsStr[0]}
                            </div>
                            <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                              {minsStr[1]}
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
                            minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Layer 2: Bánh răng phụ 1 (Bên phải) */}
              <div className="absolute top-[80%] left-[93%] -translate-x-1/2 -translate-y-1/2 w-[30%] opacity-80 rotate-10 z-1">
                <ClockGears speed={5} reverse className="w-full h-auto" />
              </div>

              {/* Layer 2: Bánh răng phụ 2 (Bên phải) */}
              <div className="absolute top-[73%] left-[95%] -translate-x-1/2 -translate-y-1/2 w-[25%] opacity-40 rotate-280 z-1">
                <ClockGears speed={10} className="w-full h-auto" />
              </div>

              {/* Layer 2: Ngôi sao riêng biệt tại translate(1200, 405) (Tách riêng để nằm trên clock.svg nhưng nằm DƯỚI kim đồng hồ z-3) */}
              <svg
                viewBox="0 0 1440 810"
                className="absolute inset-0 w-full h-full pointer-events-none z-2 select-none"
              >
                <defs>
                  <linearGradient id="starBlueGradIsolated" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0a086b" />
                    <stop offset="20%" stopColor="#211cdb" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <g id="star10ShapeIsolated">
                    <polygon
                      points="150,10 162.4,112.0 232.3,36.7 182.4,126.5 283.1,106.7 190,150 283.1,193.3 182.4,173.5 232.3,263.3 162.4,188.0 150,290 137.6,188.0 67.7,263.3 117.6,173.5 16.9,193.3 110,150 16.9,106.7 117.6,126.5 67.7,36.7 137.6,112.0"
                      transform="translate(-150, -150)"
                    />
                  </g>
                </defs>
                <g transform="translate(1200, 405) scale(0.45)">
                  <use href="#star10ShapeIsolated" fill="url(#starBlueGradIsolated)" />
                </g>
              </svg>

              {/* Layer 3: Đồng hồ 2 Kim xoay bên phải (Nằm ĐÈ LÊN ngôi sao z-2) */}
              <div className="absolute top-[78.5%] left-[93.5%] -translate-x-1/2 -translate-y-1/2 w-[47%] aspect-square flex items-center justify-center pointer-events-auto hidden sm:flex z-3 rotate-[-5]">
                <GradientClock
                  size="100%"
                  showDialBackground={false}
                  hourPivotX={7.7}
                  hourPivotY={50}
                  minPivotX={4.8}
                  minPivotY={50}
                  smooth={false}
                  manualHourDeg={currentHourAngle}
                  manualMinDeg={currentMinAngle}
                  centerCapSize="3.8%"
                  centerCapOffsetX={1}
                  centerCapOffsetY={0}
                  className="w-full h-full"
                />
              </div>

              {/* Layer 3: Overlay SVG Clock Layer 2 */}
              <div className="absolute inset-0 pointer-events-none z-3 flex justify-end items-end">
                <NextImage
                  src="/clock-layer2.svg"
                  alt="Clock Graphic Layer 2"
                  width={1440}
                  height={810}
                  className="w-full h-full object-contain object-right-bottom"
                  priority
                />
              </div>

              {/* Layer 4: Khối bánh răng chính bên trái (Nằm đè lên trên cùng, bánh răng vẫn quay liên tục) */}
              <div className="absolute bottom-[-76%] left-[61%] -translate-x-1/2 -translate-y-1/2 w-[33%] pointer-events-none rotate-[-10deg] z-4">
                <ClockGears speed={12} className="w-full h-auto" />
              </div>

              {/* Layer 5: Đồng hồ 2 Kim xoay bên trái (Tự động nấc đến 10:00 rồi dừng hằn) */}
              <div className="absolute top-[103.5%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[45%] aspect-square rotate-[-10] flex items-center justify-center pointer-events-auto hidden sm:flex z-5 rotate-96">
                <GradientClock
                  size="100%"
                  showDialBackground={false}
                  hourPivotX={7.7}
                  hourPivotY={50}
                  minPivotX={4.8}
                  minPivotY={50}
                  smooth={false}
                  manualHourDeg={currentHourAngle}
                  manualMinDeg={currentMinAngle}
                  centerCapSize="3.8%"
                  centerCapOffsetX={-1}
                  centerCapOffsetY={-1}
                  className="w-full h-full"
                />
              </div>

              {/* Layer 4: Số 10 (Trượt 09 -> 10) & 5 Ngôi sao xoay hiện ra theo Intro Animation */}
              <svg
                viewBox="0 0 1440 810"
                className="absolute inset-0 w-full h-full pointer-events-none z-4 select-none"
              >
                <defs>
                  {/* Gradient màu cho Số 10 */}
                  <linearGradient id="num10Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0e0baeff" />
                    <stop offset="20%" stopColor="#211cdb" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  {/* Gradient màu cho Ngôi sao Xanh (Trái sang Phải) */}
                  <linearGradient id="starBlueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0a086b" />
                    <stop offset="20%" stopColor="#211cdb" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  {/* Template Ngôi sao 10 cánh */}
                  <g id="star10Shape">
                    <polygon
                      points="150,10 162.4,112.0 232.3,36.7 182.4,126.5 283.1,106.7 190,150 283.1,193.3 182.4,173.5 232.3,263.3 162.4,188.0 150,290 137.6,188.0 67.7,263.3 117.6,173.5 16.9,193.3 110,150 16.9,106.7 117.6,126.5 67.7,36.7 137.6,112.0"
                      transform="translate(-150, -150)"
                    />
                  </g>

                  {/* Khung cắt cho Dải cuộn số (ClipPath che phần dư phía trên & dưới) */}
                  <clipPath id="numberReelWindow">
                    <rect x="500" y="100" width="600" height="540" />
                  </clipPath>
                </defs>

                {/* 
                  100% CONTINUOUS SVG STRIP REEL ANIMATION (SỐ 09 -> 10):
                  - Hàng chục (x=750): Dải cuộn dọc chứa [0, 9, 8, 7, 6, 5, 4, 3, 2, 1] trượt mượt 100% không khựng
                  - Hàng đơn vị (x=940): Dải cuộn dọc chứa [9, 0] trượt mượt xuống
                  - Điều khiển độ gia tốc qua đường cong NUMBERS_BEZIER_CURVE
                */}
                <g clipPath="url(#numberReelWindow)" fontFamily="Perandory" fontSize="480" fill="url(#num10Gradient)" dominantBaseline="central">
                  {/* Hàng chục (x=730): Chờ Hàng đơn vị (số 9) trượt được TENS_SLIDE_START_RATIO rồi mới bứt tốc trượt về 1 */}
                  <g transform={`translate(0, -${easedTensProgress * 9 * 360})`}>
                    {[0, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((digit, idx) => {
                      const yCurrent = (370 + idx * 360) - (easedTensProgress * 9 * 360);
                      const dist = Math.abs(yCurrent - 370);
                      const digitOpacity = Math.max(0, 1 - dist / REEL_FADE_DISTANCE);

                      return (
                        <text
                          key={`tens-${idx}`}
                          x="730"
                          y={370 + idx * 360}
                          opacity={digitOpacity}
                          textAnchor="middle"
                        >
                          {digit}
                        </text>
                      );
                    })}
                  </g>

                  {/* Hàng đơn vị (x=940): Dải cuộn liên tục [9, 0] trượt ngay từ đầu */}
                  <g transform={`translate(0, ${easedUnitsProgress * 360})`}>
                    {(() => {
                      const y9 = 370 + easedUnitsProgress * 360;
                      const opacity9 = Math.max(0, 1 - Math.abs(y9 - 370) / REEL_FADE_DISTANCE);

                      const y0 = (370 - 360) + easedUnitsProgress * 360;
                      const opacity0 = Math.max(0, 1 - Math.abs(y0 - 370) / REEL_FADE_DISTANCE);

                      return (
                        <>
                          <text x="940" y={370} opacity={opacity9} textAnchor="middle">
                            9
                          </text>
                          <text x="940" y={370 - 360} opacity={opacity0} textAnchor="middle">
                            0
                          </text>
                        </>
                      );
                    })()}
                  </g>
                </g>

                {/* 
                  ANIMATION 5 NGÔI SAO XUẤT HIỆN:
                  - Gia tốc xoay & hiện theo đường cong Cubic-Bezier (STAR_BEZIER_CURVE)
                  - Vận tốc xoay tùy chỉnh qua spinSpeed & turns trong mảng STAR_ANIM_CONFIG
                */}
                {STAR_ANIM_CONFIG.map((star) => {
                  const activeDelay = star.delaySec;
                  const ageSec = Math.max(0, introElapsedSec - activeDelay);
                  const durationSec = Math.max(0.2, TOTAL_INTRO_DURATION_SEC - activeDelay);
                  const starRawProgress = Math.min(1, ageSec / durationSec);

                  // Sử dụng đường cong Bezier riêng của ngôi sao hoặc đường cong STAR_BEZIER_CURVE mặc định
                  const curve = star.bezierCurve ?? STAR_BEZIER_CURVE;
                  const starEasedP = solveCubicBezier(curve[0], curve[1], curve[2], curve[3], starRawProgress);

                  const starOpacity = starEasedP;
                  const starScale = starEasedP * star.baseScale;
                  const starRotation = (1 - starEasedP) * (star.turns * star.spinSpeed * 360) + star.endRotation;

                  if (starOpacity <= 0) return null;

                  return (
                    <g
                      key={star.id}
                      transform={`translate(${star.x}, ${star.y}) scale(${starScale}) rotate(${starRotation})`}
                      opacity={starOpacity}
                    >
                      <use href="#star10Shape" fill={star.fill} />
                    </g>
                  );
                })}
              </svg>

            </div>
          </div>


        </section>

        {/* 2. TIMELINE SECTION (OVERLAPPING PINNED HERO WITH CURVED EDGES & DEPTH SHADOW) */}
        <section
          id="timeline"
          ref={timelineRef}
          className="relative z-20 bg-[#050508]/95 backdrop-blur-2xl rounded-t-[40px] md:rounded-t-[60px] lg:rounded-t-[80px] border-t border-white/10 shadow-[0_-50px_100px_rgba(0,0,0,0.95)] py-24 w-full overflow-hidden border-b border-white/[0.03]"
        >
          {/* Glow Accent Line & Cosmic Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-purple-950/10 to-transparent pointer-events-none z-0" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none z-10" />

          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-12">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.25em] text-blue-400/95 uppercase block">
                  CHẶNG ĐƯỜNG PHÁT TRIỂN
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-light text-white">Hành Trình 1 Thập Kỷ</h2>
              </div>

              {/* Year selector pills */}
              <div className="flex flex-wrap gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.05] max-w-full">
                {timelineData.map((ev) => (
                  <button
                    key={ev.year}
                    onClick={() => setSelectedYear(ev.year)}
                    className={`px-4 py-1.5 rounded-lg font-mono text-xs tracking-wider transition-all ${selectedYear === ev.year
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {ev.year}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Event Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white/[0.01] p-6 md:p-10 rounded-2xl border border-white/[0.03] backdrop-blur-sm shadow-2xl shadow-blue-950/10">

              {/* Left panel: Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <span className="font-mono text-5xl font-extralight text-blue-500/40">{currentEvent.year}</span>
                  <h3 className="text-2xl font-serif text-white">{currentEvent.title}</h3>
                  <p className="text-xs font-medium text-slate-400 tracking-wide italic">"{currentEvent.tagline}"</p>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed font-light">{currentEvent.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                  {currentEvent.stats.map((st, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold">{st.label}</span>
                      <p className="text-sm text-white font-semibold">{st.value}</p>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold block">Dấu ấn nổi bật:</span>
                  <ul className="space-y-1.5 text-xs text-slate-400 font-light">
                    {currentEvent.highlights.map((hl, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                        {hl}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right panel: Images & Comments */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Featured Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentEvent.images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxUrl(img.url)}
                      className="group relative h-64 rounded-xl overflow-hidden border border-white/[0.05] bg-slate-950 cursor-zoom-in"
                    >
                      <img
                        src={img.url}
                        alt={img.caption}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <p className="text-xs font-light text-slate-200 leading-snug">{img.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments for the year */}
                <div className="mt-4 border-t border-white/[0.05] pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    Kỷ ức năm {currentEvent.year} của bạn
                  </h4>

                  {/* Comments list */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {commentsForYear.length === 0 ? (
                      <p className="text-xs text-slate-500 font-light italic">Chưa có kỷ niệm nào được chia sẻ.</p>
                    ) : (
                      commentsForYear.map((cmt) => (
                        <div key={cmt.id} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-blue-400">{cmt.name}</span>
                            <span className="text-slate-500">{cmt.date}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-light">{cmt.content}</p>
                          {cmt.imageUrl && (
                            <img
                              src={cmt.imageUrl}
                              alt="Comment attachment"
                              onClick={() => setLightboxUrl(cmt.imageUrl!)}
                              className="h-20 w-auto rounded border border-white/[0.06] mt-1.5 cursor-zoom-in hover:brightness-110"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form and Upload image */}
                  <form onSubmit={handleAddTimelineComment} className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Tên của bạn..."
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 text-white"
                      />
                      <div className="flex gap-2">
                        <label className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-[10px] text-slate-400 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer flex items-center justify-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span>{commentImage ? "Đã chọn ảnh" : "Đăng kèm ảnh"}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCommentImageUpload} />
                        </label>
                        {commentImage && (
                          <button
                            type="button"
                            onClick={() => setCommentImage(null)}
                            className="p-2 text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Chia sẻ ký ức của bạn..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 text-white"
                      />
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
                        Gửi
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. GALLERY SECTION (ID: gallery) */}
      <section id="gallery" className="py-24 max-w-7xl mx-auto px-6 md:px-12 w-full border-b border-white/[0.03] relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-blue-400/95 uppercase block">
              ẢNH KỈ NIỆM ĐÊM TIỆC
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-white">Khoảnh Khắc Đêm Tiệc</h2>
          </div>

          <label className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-medium uppercase tracking-wider text-slate-300 bg-white/[0.02] hover:bg-white hover:text-black hover:border-white transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Đăng ảnh của bạn</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Photos grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recapImages.length === 0 ? (
            <div className="col-span-full text-center py-16 border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs tracking-widest font-mono">
              CHƯA CÓ ẢNH NÀO ĐƯỢC ĐĂNG. HÃY LÀ NGƯỜI ĐẦU TIÊN!
            </div>
          ) : (
            recapImages.map((img) => (
              <div
                key={img.id}
                className="group bg-white/[0.01] border border-white/[0.04] rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Delete button (hover only) */}
                <button
                  onClick={(e) => deleteRecapImage(img.id, e)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 text-slate-400 hover:text-red-400 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Photo canvas */}
                <div className="h-64 overflow-hidden relative cursor-zoom-in" onClick={() => setLightboxUrl(img.url)}>
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute bottom-3 left-3 bg-black/50 text-[9px] font-mono px-2 py-0.5 rounded text-slate-300 backdrop-blur-sm">{img.time}</span>
                </div>

                {/* Bottom details */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-400 font-light min-h-[32px] line-clamp-2 leading-relaxed">{img.caption}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={(e) => handleLikeRecap(img.id, e)}
                      className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-400 transition-colors group/btn"
                    >
                      <Heart className="w-3.5 h-3.5 group-hover/btn:fill-red-500" />
                      <span>{img.likes} Yêu thích</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. GUESTBOOK SECTION (ID: wish) */}
      <section id="wish" className="py-24 max-w-7xl mx-auto px-6 md:px-12 w-full border-b border-white/[0.03] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left panel: Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-blue-400/95 uppercase block">
                GUESTBOOK
              </span>
              <h2 className="text-3xl font-serif font-light text-white">Gửi Lời Chúc Mừng</h2>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Lưu giữ những lời chúc, cảm xúc hoặc kỷ niệm đáng nhớ của bạn với đại gia đình Illustris tại đây.
              </p>
            </div>

            <form onSubmit={handleAddWish} className="space-y-4 bg-white/[0.01] border border-white/[0.03] p-5 rounded-2xl backdrop-blur-sm shadow-xl">
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên của bạn..."
                  value={newWishName}
                  onChange={(e) => setNewWishName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/50 text-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Vai trò / Chức vụ</label>
                <input
                  type="text"
                  placeholder="Cựu thành viên Gen 3, Khách mời..."
                  value={newWishRole}
                  onChange={(e) => setNewWishRole(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/50 text-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Lời chúc</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Chúc mừng kỷ niệm 10 năm Illustris..."
                  value={newWishContent}
                  onChange={(e) => setNewWishContent(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/50 text-white transition-colors resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10">
                Gửi Lời Chúc
              </button>
            </form>
          </div>

          {/* Right panel: Wish cards scroll grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {wishes.length === 0 ? (
                <div className="col-span-full h-48 flex items-center justify-center text-slate-500 text-xs tracking-wider border border-dashed border-white/10 rounded-2xl font-mono">
                  CHƯA CÓ LỜI CHÚC NÀO.
                </div>
              ) : (
                wishes.map((wish) => (
                  <div key={wish.id} className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-xl space-y-4 hover:bg-white/[0.03] transition-colors h-fit shadow-md">
                    <p className="text-xs font-light text-slate-300 leading-relaxed italic">"{wish.content}"</p>
                    <div className="pt-3 border-t border-white/[0.04] flex justify-between items-end">
                      <div>
                        <p className="text-xs font-semibold text-blue-400">{wish.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{wish.role}</p>
                      </div>
                      <span className="text-[9px] text-slate-600">{wish.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/[0.02] bg-zinc-950/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Camera className="w-4 h-4 text-blue-500" />
            <span className="font-serif text-sm tracking-[0.2em] font-light">ILLUSTRIS</span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            A DECADE OF LIGHT — A JOURNEY OF MOMENTS
          </p>
          <div className="font-serif italic text-4xl text-slate-800 tracking-wider">
            fin<span className="text-blue-500">.</span>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="Zoomed view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
}
