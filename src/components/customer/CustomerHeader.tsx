"use client";

import Link from "next/link";
import { UtensilsCrossed, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerHeaderProps {
  tableId: string;
  cartCount: number;
  onOpenCart: () => void;
}

export function CustomerHeader({ tableId, cartCount, onOpenCart }: CustomerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          aria-label="กลับหน้าแรก Chanon"
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-white shadow-sm transition-transform group-hover:scale-105">
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-[#1E293B] leading-none">
              Chanon
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Thai Kitchen & Dine-in</p>
          </div>
        </Link>

        {/* Right: Table Indicator & Cart Trigger */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-[#1B4332]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>โต๊ะ {tableId}</span>
          </div>

          <Button
            onClick={onOpenCart}
            variant="outline"
            className="relative h-9 rounded-full border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-[#1E293B] shadow-sm hover:border-[#1B4332]/30 hover:bg-slate-50"
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
            <span>ตะกร้า</span>
            {cartCount > 0 && (
              <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EA580C] px-1.5 text-[11px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
