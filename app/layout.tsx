import type { Metadata, Viewport } from "next";
import { Share_Tech_Mono, Exo_2 } from "next/font/google";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VR180 Converter — Convert Videos for Google Cardboard",
  description:
    "Convert regular videos to VR180 side-by-side format for Google Cardboard and VR headsets. Upload from your phone, download ready-to-watch VR videos.",
  openGraph: {
    title: "VR180 Converter",
    description: "Convert any video to VR180 for Google Cardboard",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${shareTechMono.variable} ${exo2.variable}`}>
      <body>
        <div className="bg-grid" />
        <div className="bg-vig" />
        {children}
      </body>
    </html>
  );
}
