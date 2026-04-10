import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LandingLens — Landing Page Audit Tool",
  description:
    "Drop your URL. Get a scored, specific breakdown of every problem on your page — with exact fixes.",
  openGraph: {
    title: "LandingLens — Landing Page Audit Tool",
    description: "Drop your URL. Get a scored, specific breakdown of every problem on your page — with exact fixes.",
    url: "https://landinglens.com",
    siteName: "LandingLens",
    images: [
      {
        url: "/og-image.jpg", // Make sure to add this image to /public
        width: 1200,
        height: 630,
        alt: "LandingLens Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LandingLens — Landing Page Audit Tool",
    description: "Drop your URL. Get a scored, specific breakdown of every problem on your page — with exact fixes.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
