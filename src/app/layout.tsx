import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hội Cựu Chiến Binh Xã Ea Súp | E-CCB Ea Súp",
  description:
    "Cổng thông tin điện tử Hội Cựu Chiến Binh Xã Ea Súp - Trực thuộc Hệ sinh thái Ea Súp Số (ccb.easupso.com). Phát huy truyền thống Bộ đội Cụ Hồ, gương mẫu, tiên phong chuyển đổi số.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-CCB Ea Súp",
  },
  icons: {
    icon: "/images/logo-ccb.png",
    shortcut: "/images/logo-ccb.png",
    apple: "/images/logo-ccb.png",
  },
  keywords: [
    "Hội Cựu Chiến Binh Ea Súp",
    "Hội Cựu Chiến Binh Xã Ea Súp",
    "E-CCB Ea Súp",
    "Ea Súp Số",
    "ccb.easupso.com",
    "Cựu chiến binh Đắk Lắk",
  ],
  authors: [{ name: "Ban Biên Tập Hội CCB Xã Ea Súp" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#244023",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="apple-touch-icon" href="/images/logo-ccb.png" />
        <link rel="icon" href="/images/logo-ccb.png" type="image/png" />
        <meta name="apple-mobile-web-app-title" content="E-CCB Ea Súp" />
      </head>
      <body className="min-h-screen bg-cream-bg text-deep-text antialiased">
        {children}
      </body>
    </html>
  );
}
