import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Easy Note — Sleek & Secure AI Note Taking",
  description: "Experience the ultimate minimalist Markdown note-taking app. Powered by AI, secured with encryption, and designed for peak productivity.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "Easy Note — Sleek & Secure AI Note Taking",
    description: "The ultimate minimalist Markdown note-taking app.",
    url: "https://easy-note.vercel.app",
    siteName: "Easy Note",
    images: [
      {
        url: "/icon.png",
        width: 1024,
        height: 1024,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Easy Note — Sleek & Secure AI Note Taking",
    description: "The ultimate minimalist Markdown note-taking app.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
