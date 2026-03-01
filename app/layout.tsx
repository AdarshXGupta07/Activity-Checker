import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Checker",
  description: "Track weekly habits and get automated feedback"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
