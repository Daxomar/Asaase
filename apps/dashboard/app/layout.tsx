import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"


// Closest free matches to the deck's Clash Display / Cabinet Grotesk pairing.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asaase AI — Dashboard",
  description: "Every citizen. Every drain. One climate defense network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SidebarProvider>
          <Sidebar />    
          <SidebarInset className="overflow-hidden">   
            
            <div className="flex flex-1 flex-col gap-4">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
