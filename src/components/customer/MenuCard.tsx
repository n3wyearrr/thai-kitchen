"use client";

import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Plus, Flame, Sparkles } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export function MenuCard({ item, onSelect, onQuickAdd }: MenuCardProps) {
  const isAvailable = item.isAvailable !== false;
  const hasOptions = Boolean(item.spiceable || (item.extras && item.extras.length > 0));

  return (
    <Card
      onClick={() => isAvailable && onSelect(item)}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white flex flex-col justify-between transition-all duration-200 ${
        !isAvailable
          ? "opacity-65 bg-slate-50/60 cursor-not-allowed"
          : "cursor-pointer shadow-sm hover:shadow-md hover:border-slate-300/80"
      }`}
    >
      {/* Top: Image & Badges */}
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 ease-out ${
              isAvailable ? "group-hover:scale-105" : "grayscale"
            }`}
          />

          {/* Soft Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.isPopular && isAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-[#FFF7ED]/95 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-[#EA580C] shadow-sm">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>ขายดี · แนะนำ</span>
              </span>
            )}
            {item.spiceable && isAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200/70 bg-red-50/95 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-red-700 shadow-sm">
                <Flame className="h-3 w-3" aria-hidden="true" />
                <span>เลือกระดับเผ็ดได้</span>
              </span>
            )}
          </div>

          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center">
              <span className="rounded-full bg-white/95 px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                สินค้าหมดชั่วคราว
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 pb-2">
          <div className="text-[11px] font-medium text-[#64748B] mb-0.5">
            {item.category}
          </div>
          <h3 className="text-base font-semibold text-[#1E293B] group-hover:text-[#1B4332] transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="mt-1 text-xs text-[#64748B] line-clamp-2 leading-relaxed">
            {item.desc}
          </p>
        </div>
      </div>

      {/* Bottom: Price & Minimal Add Control */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-[#EA580C]">
            {formatPrice(item.price)}
          </span>
        </div>

        {isAvailable ? (
          <div className="flex items-center gap-2">
            {hasOptions && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item);
                }}
                className="h-8 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 text-xs font-medium text-[#1E293B] transition-colors hover:bg-slate-100 hover:border-slate-300"
              >
                เลือก
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(item);
              }}
              aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EA580C] text-white shadow-sm transition-all hover:bg-[#C2410C] hover:shadow active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-400">ของหมด</span>
        )}
      </div>
    </Card>
  );
}
