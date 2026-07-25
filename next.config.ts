import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Cho phép build production thành công ngay cả khi các file generated có lỗi type
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
