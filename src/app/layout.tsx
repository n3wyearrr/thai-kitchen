import type { Metadata } from "next";
import { Prompt, Kanit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Chanon Thai Kitchen | สั่งอาหารผ่าน QR ประจำโต๊ะ",
  description: "ระบบสั่งอาหารไทยสำหรับนั่งทานในร้าน ตะกร้าร่วมประจำโต๊ะ และแดชบอร์ดจัดการร้าน POS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${kanit.variable}`}>
      <body className="font-sans min-h-screen bg-[#FAFAF9] text-[#1E293B] antialiased selection:bg-[#1B4332]/15 selection:text-[#1B4332]">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
