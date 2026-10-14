import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProjectPilot AI",
  description: "AI project management with a conversational replanner",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
