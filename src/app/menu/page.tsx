"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, ShoppingBag, ArrowRight, UtensilsCrossed } from "lucide-react";
import { menus } from "@/data/menus";
import { MenuItem, MenuCategory } from "@/types/menu";
import { MenuCard } from "@/components/customer/MenuCard";
import { FoodDetailModal } from "@/components/customer/FoodDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { RestaurantTable } from "@/types/restaurant-table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const categories: MenuCategory[] = [
  "ทั้งหมด",
  "เมนูทอดและของทานเล่น",
  "อาหารจานเดียวและกับข้าว",
  "ข้าวและเครื่องเคียง",
  "น้ำจิ้มและเครื่องเคียง",
];

export default function MenuCatalogPage() {
  const router = useRouter();
  const { data: tablesData } = useSWR<RestaurantTable[]>("/api/tables", fetcher);
  const activeTables = Array.isArray(tablesData)
    ? tablesData.filter((t) => t.status === "ACTIVE")
    : [
        { id: "1", name: "โต๊ะ 1" },
        { id: "2", name: "โต๊ะ 2" },
        { id: "3", name: "โต๊ะ 3" },
        { id: "4", name: "โต๊ะ 4" },
        { id: "5", name: "โต๊ะ 5" },
        { id: "6", name: "โต๊ะ 6" },
      ];
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("ทั้งหมด");
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [isTablePromptOpen, setIsTablePromptOpen] = useState(false);
  const [customTable, setCustomTable] = useState("");

  const handleSelectTableAndGo = (tableId: string) => {
    const target = tableId.trim() || "1";
    setIsTablePromptOpen(false);
    router.push(`/table/${encodeURIComponent(target)}`);
  };

  const handleStartOrder = (item: MenuItem) => {
    setPendingItem(item);
    setIsTablePromptOpen(true);
  };

  const filteredMenus =
    selectedCategory === "ทั้งหมด"
      ? menus
      : menus.filter((m) => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B] hover:text-[#1E293B] font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>หน้าแรก</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B4332] text-white">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1E293B]">
              Chanon
            </span>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsTablePromptOpen(true)}
            className="rounded-full px-3.5 text-xs font-semibold"
          >
            <QrCode className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            <span>เลือกโต๊ะสั่งอาหาร</span>
          </Button>
        </div>
      </header>

      {/* Sticky Category Bar */}
      <nav
        aria-label="หมวดหมู่อาหาร"
        className="sticky top-16 z-30 bg-[#FAFAF9]/95 backdrop-blur-md border-b border-slate-200/80"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-[#1B4332] text-white shadow-sm"
                      : "bg-white text-[#64748B] border border-slate-200/80 hover:border-slate-300 hover:text-[#1E293B]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex-1 space-y-6">
        <div className="border border-slate-200/80 bg-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
              เมนูอาหารทั้งหมดของร้าน
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              กดเลือกเมนูที่ต้องการ แล้วระบุเลขโต๊ะเพื่อเปิดตะกร้าสั่งอาหารร่วมกัน
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => setIsTablePromptOpen(true)}
            className="h-10 rounded-xl font-semibold shrink-0"
          >
            <ShoppingBag className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>ระบุเลขโต๊ะเพื่อเริ่มสั่ง</span>
          </Button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMenus.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onSelect={(m) => setActiveModalItem(m)}
              onQuickAdd={(m) => handleStartOrder(m)}
            />
          ))}
        </div>
      </main>

      {/* Prompt Select Table Dialog */}
      <Dialog open={isTablePromptOpen} onOpenChange={setIsTablePromptOpen}>
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
              <span>เลือกโต๊ะอาหาร</span>
            </div>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">
              คุณนั่งอยู่ที่โต๊ะหมายเลขใด?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#64748B]">
              {pendingItem
                ? `เลือกหมายเลขโต๊ะของคุณ เพื่อสั่ง "${pendingItem.name}" เข้าตะกร้าประจำโต๊ะ`
                : "เลือกหมายเลขโต๊ะของคุณ เพื่อเปิดตะกร้าสั่งอาหารร่วมกัน"}
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-0.5">
              {activeTables.map((tbl) => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => handleSelectTableAndGo(tbl.id)}
                  className="flex h-14 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                >
                  <span className="text-[10px] text-[#64748B]">โต๊ะ</span>
                  <span className="text-base font-bold text-[#1E293B] truncate px-1 max-w-full">
                    {tbl.id}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
              <input
                type="text"
                placeholder="หรือระบุเลขโต๊ะ เช่น 7, VIP-1"
                value={customTable}
                onChange={(e) => setCustomTable(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-slate-200/80 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332]"
              />
              <Button
                onClick={() => handleSelectTableAndGo(customTable || "1")}
                className="h-10 rounded-xl px-4 font-semibold"
              >
                <span>ไปที่โต๊ะ</span>
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Food Detail Modal */}
      <FoodDetailModal
        item={activeModalItem}
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        onAddToCart={() => {
          setActiveModalItem(null);
          setIsTablePromptOpen(true);
        }}
        tableId="ของคุณ"
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-[#64748B]">
        Chanon Thai Kitchen · อร่อยแบบไทย ใส่ใจทุกจาน
      </footer>
    </div>
  );
}
