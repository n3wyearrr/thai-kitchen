import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Thai Kitchen | 🍲 Smart Dine-in & POS",
  description: "ระบบสั่งอาหารไทยสำหรับนั่งทานในร้าน ตะกร้าร่วมประจำโต๊ะ และแดชบอร์ดแม่ค้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className="font-kanit min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
