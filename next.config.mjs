const config = {
  async rewrites() {
    const backend = new URL(process.env.BACKEND_URL || "http://127.0.0.1:3002");
    if (!["http:", "https:"].includes(backend.protocol) || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) throw new Error("BACKEND_URL must be an HTTP(S) origin without credentials or a path.");
    return [
      { source: "/api/:path*", destination: `${backend.origin}/api/:path*` },
      { source: "/auth/:path*", destination: `${backend.origin}/auth/:path*` },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
};
export default config;
