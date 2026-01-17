import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextGen Visualizer | NEXTGEN home solutions",
  description: "Remodel visualization + estimate in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="brand-watermark" />{children}</body>
    </html>
  );
}
