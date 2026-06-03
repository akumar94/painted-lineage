import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Green Blouse — Painted Lineage",
  description:
    "A spatial provenance of Pierre Bonnard's The Green Blouse (1919): 31 venues, 12 countries, one 35-year silence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
