"use client";

import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerHeaderProps {
  tableId: string;
  cartCount: number;
  onOpenCart: () => void;
}

export function CustomerHeader({ tableId, cartCount, onOpenCart }: CustomerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href={`/table/${tableId}`} className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-primary">
              Thai<span className="text-foreground">Kitchen</span>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">รสชาติต้นตำรับ</p>
          </div>
        </Link>

        {/* Center / Table Badge */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-softOrange border-primary/20 text-primary">
            📍 โต๊ะ {tableId}
          </Badge>

          {/* Link to Merchant Dashboard */}
          <Link href="/merchant" title="สำหรับร้านค้า/แม่ค้า">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground">
              <Store className="mr-1.5 h-3.5 w-3.5" />
              ร้านค้า
            </Button>
          </Link>

          {/* Cart Trigger */}
          <Button
            onClick={onOpenCart}
            variant="default"
            className="relative h-11 rounded-2xl px-4 font-medium shadow-sm transition-all hover:shadow-md"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">ตะกร้าโต๊ะ</span>
            <span className="sm:hidden">ตะกร้า</span>
            {cartCount > 0 && (
              <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-primary animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
