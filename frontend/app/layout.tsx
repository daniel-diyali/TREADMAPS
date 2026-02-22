import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TREADMAPS — AI Pedestrian Navigation",
  description: "Safety-first AI route navigation for pedestrians",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
