import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-CCB Ea Súp — Chi Hội Cơ Sở",
    short_name: "E-CCB Ea Súp",
    description: "Nền tảng nghiệp vụ Chi hội Cựu Chiến Binh - Hệ sinh thái Ea Súp Số",
    start_url: "/branch",
    display: "standalone",
    background_color: "#FBFBEE",
    theme_color: "#244023",
    orientation: "portrait",
    icons: [
      {
        src: "/images/logo-ccb.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo-ccb.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
