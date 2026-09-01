import type { Metadata } from "next";
import "./globals.css";
import "../components/estate/UnitDetailsPanel/reservation.css";
import { Providers } from "./providers";
import { getEsubDetails } from "@/lib/estate-api";

export const metadata: Metadata = {
  title: "Sample Real Estate Development Company — Ibefun 3D Allocation Model",
  description:
    "Interactive estate allocation and site model for Ibefun, Ogun State",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const esubDetails = await getEsubDetails();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers esubDetails={esubDetails}>{children}</Providers>
      </body>
    </html>
  );
}
