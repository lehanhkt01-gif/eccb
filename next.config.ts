import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/eccb",
        images: { unoptimized: true },
      }
    : {
        output: "standalone",
      }),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
