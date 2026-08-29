/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      // Local backend (dev)
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/uploads/**" },
      // Android emulator host alias
      { protocol: "http", hostname: "10.0.2.2", port: "8000", pathname: "/uploads/**" },
      // Any LAN IP (192.168.x.x) — covers real device testing on local network
      { protocol: "http", hostname: "192.168.**", pathname: "/uploads/**" },
      // Production / staging — any HTTPS host serving uploads
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
}

export default nextConfig
