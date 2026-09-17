import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = { themeColor: "#111820" };

export const metadata: Metadata = {
  metadataBase: new URL("https://matter-lab.bedelau-2025.chatgpt.site"),
  title: "Matter | Metamaterial Studio",
  description: "Explore engineered lattices, natural inspiration, material behavior, and research datasets in interactive 3D.",
  applicationName: "Matter",
  manifest: "/site.webmanifest",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Matter | Metamaterial Studio",
    description: "Explore engineered lattices, natural inspiration, material behavior, and research datasets in interactive 3D.",
    siteName: "Matter",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Matter lattice mark" }],
  },
  twitter: {
    card: "summary",
    title: "Matter | Metamaterial Studio",
    description: "Explore engineered lattices, natural inspiration, material behavior, and research datasets in interactive 3D.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
