import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import "./extra.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import CookieConsent from "@/components/CookieConsent";
import { PreferencesProvider } from '@/app/context/PreferencesContext';
import { fetchFooter, fetchContactInfo, fetchNavbar } from "@/lib/strapi-api";


// Force rebuild to clear cache
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "2 CS COMPLEXES",
    template: "%s | 2 CS Complexes",
  },
  description: "Excellence in Education. Future Leaders in the Making.",
  icons: {
    icon: "/logo/2cslogo.jpeg",
    apple: "/logo/2cslogo.jpeg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const preferences = cookieStore.get("preferences");

  const [footerData, contactInfo, navbarData] = await Promise.all([
    fetchFooter(),
    fetchContactInfo(),
    fetchNavbar(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <div className="relative min-h-screen overflow-clip">
          <Navbar navbarData={navbarData} contactInfo={contactInfo} />
          <main className="h-full w-full">
            <PreferencesProvider initialPreferences={preferences?.value}>
              {children}
            </PreferencesProvider></main>
          <Footer footerData={footerData} contactInfo={contactInfo} />
          <CookieConsent />
        </div>
        <Toaster richColors />
      </body>
    </html>
  );
}
