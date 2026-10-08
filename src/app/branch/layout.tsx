import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cán Bộ Chi Hội | E-CCB Ea Súp",
  description:
    "Giao diện tác nghiệp di động dành cho Chi hội trưởng 20 thôn buôn Hội Cựu Chiến Binh Xã Ea Súp.",
};

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-bg text-deep-text antialiased">
      {children}
    </div>
  );
}
