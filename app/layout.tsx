import type { Metadata } from "next";
import "./globals.css";
import GlobalBanner from "@/components/GlobalBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export const metadata: Metadata = { title: "GAC.CA — Government services and information", description: "Government services, foreign affairs information, public documents and application services." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><GlobalBanner /><Header /><main>{children}</main><Footer /></body></html>; }
