"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { menus } from "@/data/menus";
import { MenuItem, MenuCategory } from "@/types/menu";
import { CartItem, TableCart } from "@/types/cart";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { MenuCard } from "@/components/customer/MenuCard";
import { FoodDetailModal } from "@/components/customer/FoodDetailModal";
import { SharedCartSheet } from "@/components/customer/SharedCartSheet";
import { OrderTracker } from "@/components/customer/OrderTracker";
import { CallStaffBar } from "@/components/customer/CallStaffBar";
import { Order } from "@/types/order";
import { ServiceCall } from "@/types/service";
import { cartLineKey } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Search, X, ShoppingBag, Utensils, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const categories: { value: MenuCategory; shortLabel: string }[] = [
  { value: "ทั้งหมด", shortLabel: "ทั้งหมด" },
  { value: "เมนูทอดและของทานเล่น", shortLabel: "เมนูทอด & ทานเล่น" },
  { value: "อาหารจานเดียวและกับข้าว", shortLabel: "อาหารจานเดียว & กับข้าว" },
  { value: "ข้าวและเครื่องเคียง", shortLabel: "ข้าว & เครื่องเคียง" },
  { value: "น้ำจิ้มและเครื่องเคียง", shortLabel: "น้ำจิ้มรสเด็ด" },
];

export default function TablePage({ params }: { params: { tableId: string } }) {
  const tableId = params.tableId || "1";

  // ดึงรายการเมนูสดจาก Database (รวมสถานะของหมด isAvailable)
  const { data: dbMenus } = useSWR<MenuItem[]>(
    "/api/menus",
    fetcher,
    { fallbackData: menus, refreshInterval: 5000 }
  );
  const currentMenus = Array.isArray(dbMenus) ? dbMenus : menus;

  // Real-time cart polling via SWR (every 1.5 seconds)
  const { data: cart, mutate } = useSWR<TableCart>(
    `/api/table/${tableId}/cart`,
    fetcher,
    { refreshInterval: 1500 }
  );

  // ออเดอร์ที่ยังไม่จ่ายเงิน + คำขอพนักงานของโต๊ะนี้
  const { data: tableStatus, mutate: mutateStatus } = useSWR<{
    orders: Order[];
    calls: ServiceCall[];
  }>(`/api/table/${tableId}/status`, fetcher, { refreshInterval: 3000 });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("ทั้งหมด");
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const menuTopRef = useRef<HTMLDivElement | null>(null);

  const handleCategorySelect = (cat: MenuCategory) => {
    setSelectedCategory(cat);
    if (cat === "ทั้งหมด") {
      menuTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const targetEl = sectionRefs.current[cat];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const postCart = async (body: unknown): Promise<TableCart> => {
    const res = await fetch(`/api/table/${tableId}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("cart request failed");
    return res.json();
  };

  // Cart operations
  const handleAddToCart = async (cartItem: CartItem) => {
    try {
      const res = await fetch(`/api/table/${tableId}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", item: cartItem }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ไม่สามารถเพิ่มลงตะกร้าได้");
        return;
      }
      mutate(data, false);
      toast.success(`เพิ่ม ${cartItem.name} ลงในตะกร้าโต๊ะ ${tableId} แล้ว`);
    } catch {
      toast.error("ไม่สามารถเพิ่มลงตะกร้าได้");
    }
  };

  const handleUpdateQuantity = async (lineKey: string, delta: number) => {
    if (!cart) return;
    const item = cart.items.find((i) => cartLineKey(i) === lineKey);
    if (!item) return;
    try {
      const updatedCart = await postCart({
        action: "setQuantity",
        lineKey,
        quantity: item.quantity + delta,
      });
      mutate(updatedCart, false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  const handleRemoveItem = async (lineKey: string) => {
    if (!cart) return;
    const item = cart.items.find((i) => cartLineKey(i) === lineKey);
    if (!item) return;
    try {
      const updatedCart = await postCart({ action: "remove", lineKey });
      mutate(updatedCart, false);
      toast.info(`นำ ${item.name} ออกจากตะกร้าแล้ว`);
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleQuickAdd = (menuItem: MenuItem) => {
    if (menuItem.spiceable || (menuItem.extras && menuItem.extras.length > 0)) {
      setActiveModalItem(menuItem);
      return;
    }
    handleAddToCart({
      menuId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      image: menuItem.image,
    });
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch(`/api/table/${tableId}/cart`, { method: "DELETE" });
      const cleared = await res.json();
      mutate(cleared, false);
      toast.info(`ล้างตะกร้าโต๊ะ ${tableId} เรียบร้อยแล้ว`);
    } catch {
      toast.error("ไม่สามารถล้างตะกร้าได้");
    }
  };

  const cartItemsCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartTotal = cart?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;

  const query = searchQuery.trim().toLowerCase();
  const searchedMenus = currentMenus.filter((menu) => {
    if (!query) return true;
    return (
      menu.name.toLowerCase().includes(query) ||
      menu.desc.toLowerCase().includes(query) ||
      menu.category.toLowerCase().includes(query) ||
      (menu.ingredients && menu.ingredients.toLowerCase().includes(query))
    );
  });

  const categoryGroups = categories
    .filter((c) => c.value !== "ทั้งหมด")
    .map((c) => ({
      category: c.value,
      label: c.shortLabel,
      items: searchedMenus.filter((m) => m.category === c.value),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#1E293B]">
      {/* Header */}
      <CustomerHeader
        tableId={tableId}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Compact Welcome & Search Section */}
      <section className="bg-white border-b border-slate-200/70 pt-5 pb-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332] mb-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>สั่งอาหารร่วมกันที่ โต๊ะ {tableId}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E293B]">
                เลือกเมนูอร่อยประจำวันนี้
              </h1>
            </div>
            <p className="text-xs text-[#64748B]">
              ปรุงสดใหม่ทุกจาน · เลือกระดับความเผ็ดได้ตามชอบ
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="ค้นหาชื่อเมนู เช่น ไก่ทอด, กะเพรา, แกงส้ม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-10 rounded-xl bg-slate-50/80 border-slate-200/80 text-sm focus-visible:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Category Bar (Horizontal Scrollable Pills with Smooth Scroll) */}
      <nav
        aria-label="หมวดหมู่อาหาร"
        className="sticky top-16 z-30 bg-[#FAFAF9]/95 backdrop-blur-md border-b border-slate-200/80"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-[#1B4332] text-white shadow-sm"
                      : "bg-white text-[#64748B] border border-slate-200/80 hover:border-slate-300 hover:text-[#1E293B]"
                  }`}
                >
                  {cat.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        ref={menuTopRef}
        className="mx-auto max-w-5xl flex-1 px-4 sm:px-6 py-6 pb-28 w-full space-y-6 scroll-mt-28"
      >
        <OrderTracker orders={tableStatus?.orders ?? []} />
        <CallStaffBar
          tableId={tableId}
          calls={tableStatus?.calls ?? []}
          onChanged={() => mutateStatus()}
        />

        {/* Menu Sections by Category */}
        {categoryGroups.length > 0 ? (
          <div className="space-y-8">
            {categoryGroups.map((group) => (
              <section
                key={group.category}
                ref={(el) => {
                  sectionRefs.current[group.category] = el;
                }}
                className="space-y-3.5 scroll-mt-32"
              >
                <div className="flex items-baseline justify-between border-b border-slate-200/70 pb-2">
                  <h2 className="text-lg font-semibold text-[#1E293B]">
                    {group.category}
                  </h2>
                  <span className="text-xs text-[#64748B]">
                    {group.items.length} รายการ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {group.items.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={(menuItem) => setActiveModalItem(menuItem)}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3 bg-white my-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF7ED] text-[#EA580C]">
              <Utensils className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1E293B]">
                ไม่พบเมนูอาหารที่คุณค้นหา
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                ลองค้นหาด้วยคำอื่น หรือเลือกดูเมนูทั้งหมดในร้าน
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ทั้งหมด");
              }}
              className="rounded-full"
            >
              ล้างคำค้นหา
            </Button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Summary Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1B4332] p-3 pl-4 text-white shadow-lg border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white font-semibold text-sm">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-emerald-100/90 leading-none">
                  ตะกร้าร่วม โต๊ะ {tableId}
                </div>
                <div className="text-sm sm:text-base font-semibold truncate mt-1">
                  {cartItemsCount} รายการ <span className="mx-1.5 opacity-50">|</span>{" "}
                  <span className="font-bold text-orange-300">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsCartOpen(true)}
              variant="accent"
              className="h-11 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-semibold shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <span>ดูตะกร้า / ยืนยันการสั่ง</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Food Detail Modal Popup */}
      <FoodDetailModal
        item={activeModalItem}
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        onAddToCart={handleAddToCart}
        tableId={tableId}
      />

      {/* Shared Table Cart Sheet */}
      <SharedCartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableId={tableId}
        cart={cart || null}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={() => {
          mutate();
          mutateStatus();
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-[#64748B]">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-[#1E293B]">Chanon Thai Kitchen</span>
          <span>ระบบสั่งอาหารผ่าน QR Code ประจำโต๊ะ · โต๊ะ {tableId}</span>
        </div>
      </footer>
    </div>
  );
}
