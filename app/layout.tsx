import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matter | Metamaterial Studio",
  description: "Explore engineered lattices, natural inspiration, material behavior, and research datasets in interactive 3D.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
