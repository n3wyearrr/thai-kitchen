"use client";

import { useState } from "react";
import useSWR from "swr";
import { menus } from "@/data/menus";
import { MenuItem, MenuCategory } from "@/types/menu";
import { CartItem, TableCart } from "@/types/cart";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { MenuCard } from "@/components/customer/MenuCard";
import { FoodDetailModal } from "@/components/customer/FoodDetailModal";
import { SharedCartSheet } from "@/components/customer/SharedCartSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { Search, X, ShoppingBag, Utensils, Sparkles } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const categories: MenuCategory[] = [
  "ทั้งหมด",
  "อาหารจานเดียว",
  "ต้มและแกง",
  "ของว่าง",
  "เครื่องดื่ม",
];

export default function TablePage({ params }: { params: { tableId: string } }) {
  const tableId = params.tableId || "1";

  // Real-time cart polling via SWR (every 1.5 seconds)
  const { data: cart, mutate } = useSWR<TableCart>(
    `/api/table/${tableId}/cart`,
    fetcher,
    { refreshInterval: 1500 }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("ทั้งหมด");
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart operations
  const handleAddToCart = async (cartItem: CartItem) => {
    try {
      const res = await fetch(`/api/table/${tableId}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", item: cartItem }),
      });
      const updatedCart = await res.json();
      mutate(updatedCart, false);
      toast.success(`เพิ่ม ${cartItem.name} ลงในตะกร้าโต๊ะ ${tableId} แล้ว`);
    } catch {
      toast.error("ไม่สามารถเพิ่มลงตะกร้าได้");
    }
  };

  const handleUpdateQuantity = async (menuId: number, delta: number) => {
    if (!cart) return;
    const item = cart.items.find((i) => i.menuId === menuId);
    if (!item) return;

    const newQty = item.quantity + delta;
    try {
      const res = await fetch(`/api/table/${tableId}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          item: { ...item, quantity: newQty },
        }),
      });
      const updatedCart = await res.json();
      mutate(updatedCart, false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  const handleRemoveItem = async (menuId: number) => {
    if (!cart) return;
    const item = cart.items.find((i) => i.menuId === menuId);
    if (!item) return;

    try {
      const res = await fetch(`/api/table/${tableId}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", item }),
      });
      const updatedCart = await res.json();
      mutate(updatedCart, false);
      toast.info(`นำ ${item.name} ออกจากตะกร้าแล้ว`);
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
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

  // Filtered menus
  const filteredMenus = menus.filter((menu) => {
    const matchesCategory =
      selectedCategory === "ทั้งหมด" || menu.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      menu.name.toLowerCase().includes(query) ||
      menu.desc.toLowerCase().includes(query) ||
      menu.category.toLowerCase().includes(query) ||
      (menu.ingredients && menu.ingredients.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <CustomerHeader
        tableId={tableId}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-softOrange/40 to-background py-8 sm:py-12 border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-softOrange px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>โต๊ะ {tableId} • สแกนและแชร์ตะกร้าร่วมกันได้</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            อร่อยแบบไทย ใส่ใจทุกจาน
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            อาหารไทยรสชาติต้นตำรับ ปรุงสดใหม่ด้วยวัตถุดิบคัดสรรพิเศษทุกวัน
          </p>

          {/* Real-time Search Box */}
          <div className="relative mx-auto max-w-xl pt-3">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="🔍 ค้นหาเมนูอาหาร ส่วนประกอบ หรือความชอบ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-12 rounded-2xl bg-white shadow-sm border-border text-base focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Category Tabs */}
      <main className="mx-auto max-w-6xl flex-1 px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">เมนูแนะนำของร้าน</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              กดที่รูปเพื่อดูส่วนผสม หรือกดปุ่มบวกเพื่อใส่ตะกร้าโต๊ะ {tableId}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val as MenuCategory)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Grid */}
        {filteredMenus.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredMenus.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onSelect={(menuItem) => setActiveModalItem(menuItem)}
                onQuickAdd={(menuItem) =>
                  handleAddToCart({
                    menuId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: 1,
                    image: menuItem.image,
                  })
                }
              />
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 bg-white/50 my-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-softOrange text-primary">
              <Utensils className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                ไม่พบเมนูอาหารที่คุณค้นหา
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ลองค้นหาด้วยคำอื่น หรือเลือกดูหมวดหมู่ทั้งหมด
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ทั้งหมด");
              }}
              className="rounded-xl border-primary text-primary hover:bg-softOrange"
            >
              ดูเมนูทั้งหมด
            </Button>
          </div>
        )}
      </main>

      {/* Floating Cart Button for Mobile / Instant Access */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-6 right-4 sm:right-8 z-40 animate-in slide-in-from-bottom duration-300">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="h-14 rounded-full px-6 bg-primary text-white hover:bg-primary-hover shadow-2xl flex items-center gap-3 border-2 border-white"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">
                {cartItemsCount}
              </span>
            </div>
            <div className="text-left font-medium">
              <span className="text-xs block opacity-90">ตะกร้าโต๊ะ {tableId}</span>
              <span className="font-bold text-sm">{formatPrice(cartTotal)}</span>
            </div>
          </Button>
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
        onOrderSuccess={() => mutate()}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-[#214d3d] text-white py-8 text-center text-sm space-y-2">
        <p className="font-semibold text-base">🍲 Thai Kitchen | ร้านอาหารไทย</p>
        <p className="text-xs text-white/80">
          อร่อยแบบไทย รสชาติต้นตำรับ • สั่งอาหารผ่าน QR Code ประจำโต๊ะ
        </p>
        <p className="text-[11px] text-white/60">© 2026 Thai Kitchen. All rights reserved.</p>
      </footer>
    </div>
  );
}
