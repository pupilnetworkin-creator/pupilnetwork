import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import ChatWidget from "../components/ChatWidget";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PupilNetwork | The Ultimate AI Study Hub",
  description: "Connect with peers, share notes, and learn with AI-powered study assistance. Join the future of collaborative learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-gray-50 selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <ChatWidget />
      </body>
    </html>
  );
}
