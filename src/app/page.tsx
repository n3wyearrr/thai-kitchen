"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, QrCode, Store, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const quickTables = ["1", "2", "3", "4", "5", "6"];

export default function HomePage() {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState("1");
  const [customTable, setCustomTable] = useState("");

  const handleGoToTable = (tableId: string) => {
    const id = tableId.trim() || "1";
    router.push(`/table/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8e8d5] via-[#fffaf3] to-[#fffaf3] flex flex-col justify-between font-kanit">
      {/* Top Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-primary">
              Thai<span className="text-foreground">Kitchen</span>
            </span>
            <span className="block text-[11px] text-muted-foreground -mt-1">
              Smart Dine-in & POS
            </span>
          </div>
        </div>

        <Link href="/merchant">
          <Button variant="outline" className="rounded-2xl border-border bg-white/80 hover:bg-white text-xs sm:text-sm">
            <Store className="mr-1.5 h-4 w-4 text-emerald-700" />
            หน้าจอแม่ค้า / ครัว
          </Button>
        </Link>
      </header>

      {/* Hero & QR Table Selector */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-softOrange px-4 py-1.5 text-xs font-semibold text-primary border border-primary/20 shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>ระบบสั่งอาหารไทยแบบสแกน QR ประจำโต๊ะ</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            ยินดีต้อนรับสู่ <br />
            <span className="text-primary">ร้านอาหารไทย</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            จำลองการสแกน QR Code ประจำโต๊ะของคุณ <br />
            นั่งโต๊ะเดียวกัน ใช้ตะกร้าแชร์ร่วมกัน สั่งอาหารได้ทันที
          </p>
        </div>

        {/* Table Selector Card */}
        <div className="bg-white rounded-3xl border border-border p-6 shadow-xl space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground text-base">เลือกหมายเลขโต๊ะของคุณ</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-softOrange border-primary/20 text-primary">
              Dine-in
            </Badge>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2 font-medium">
              เลือกโต๊ะที่นั่งด่วน:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {quickTables.map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => {
                    setSelectedTable(tbl);
                    setCustomTable("");
                  }}
                  className={`h-12 rounded-2xl font-bold text-base transition-all border ${
                    selectedTable === tbl && !customTable
                      ? "bg-primary text-white border-primary shadow-sm scale-102"
                      : "bg-muted/20 text-foreground border-border hover:bg-muted/60"
                  }`}
                >
                  โต๊ะ {tbl}
                </button>
              ))}
            </div>
          </div>

          {/* Custom table number */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
              หรือระบุเลขโต๊ะอื่น ๆ:
            </label>
            <Input
              type="text"
              placeholder="ระบุเลขโต๊ะ เช่น 7, 8, VIP-1"
              value={customTable}
              onChange={(e) => {
                setCustomTable(e.target.value);
                if (e.target.value) setSelectedTable(e.target.value);
              }}
              className="h-12 rounded-2xl bg-muted/10 border-border text-center font-bold"
            />
          </div>

          {/* Enter Table Button */}
          <Button
            onClick={() => handleGoToTable(customTable || selectedTable)}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <span>เข้าสู่เมนู โต๊ะ {customTable || selectedTable}</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 pt-4 text-center">
          <div className="p-3 rounded-2xl bg-white/60 border border-border/60">
            <div className="text-xl">🤝</div>
            <p className="text-xs font-semibold text-foreground mt-1">Shared Cart</p>
            <p className="text-[10px] text-muted-foreground">ตะกร้าซิงก์กันในโต๊ะ</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 border border-border/60">
            <div className="text-xl">🔍</div>
            <p className="text-xs font-semibold text-foreground mt-1">Real-time Search</p>
            <p className="text-[10px] text-muted-foreground">ค้นหาเมนูทันใจ</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 border border-border/60">
            <div className="text-xl">🧾</div>
            <p className="text-xs font-semibold text-foreground mt-1">POS Billing</p>
            <p className="text-[10px] text-muted-foreground">คิดเงินทอนแม่นยำ</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        🍲 Thai Kitchen Dine-in System • Powered by Next.js & shadcn/ui
      </footer>
    </div>
  );
}
