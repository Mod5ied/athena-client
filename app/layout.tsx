import "./globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { QueryProvider } from "../providers/query-provider";
import { NotificationContainer } from "../components/notification-container";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SchoolPilot - Automated Grading System",
  description: "Intelligent grading and promotion system for Nigerian schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} font-sans antialiased`}
      >
        <QueryProvider>
          {children}
          <NotificationContainer />
        </QueryProvider>
      </body>
    </html>
  );
}
