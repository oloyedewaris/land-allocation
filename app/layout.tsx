import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sample Real Estate Development Company — Ibefun 3D Allocation Model",
  description: "Interactive estate allocation and site model for Ibefun, Ogun State",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
