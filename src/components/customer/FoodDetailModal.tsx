"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { CartItem, SpiceLevel } from "@/types/cart";
import { SPICE_LEVELS } from "@/lib/cart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, ShoppingBag, Sparkles, Flame, Leaf, Check } from "lucide-react";

interface FoodDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  tableId: string;
}

export function FoodDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  tableId,
}: FoodDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [spice, setSpice] = useState<SpiceLevel>("MEDIUM");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  useEffect(() => {
    setQuantity(1);
    setNote("");
    setSpice("MEDIUM");
    setSelectedExtras([]);
  }, [item?.id, isOpen]);

  if (!item) return null;

  const extras = item.extras ?? [];
  const extrasPrice = extras
    .filter((e) => selectedExtras.includes(e.label))
    .reduce((sum, e) => sum + e.price, 0);
  const unitPrice = item.price + extrasPrice;

  const toggleExtra = (label: string) =>
    setSelectedExtras((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const handleAdd = () => {
    onAddToCart({
      menuId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      note: note.trim() || undefined,
      image: item.image,
      spice: item.spiceable ? spice : undefined,
      extras: selectedExtras.length ? selectedExtras : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xl">
        {/* Food Image */}
        <div className="relative aspect-[16/10] w-full bg-stone-100">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-[#1E293B] shadow-sm border border-slate-200/60">
              {item.category}
            </span>
            {item.isPopular && (
              <span className="rounded-full bg-[#FFF7ED] border border-orange-200/80 text-[#EA580C] px-2.5 py-0.5 text-xs font-semibold shadow-sm inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>ขายดี</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl font-bold text-[#1E293B]">
                {item.name}
              </DialogTitle>
              <div className="text-xl font-bold text-[#EA580C] shrink-0">
                {formatPrice(unitPrice)}
              </div>
            </div>
            <DialogDescription className="text-[#64748B] text-sm leading-relaxed">
              {item.desc}
            </DialogDescription>
          </DialogHeader>

          {/* Ingredients */}
          {item.ingredients && (
            <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/60">
              <h4 className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 mb-1">
                <Leaf className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>ส่วนประกอบและวัตถุดิบ</span>
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {item.ingredients}
              </p>
            </div>
          )}

          {/* Spice level */}
          {item.spiceable && (
            <div>
              <p className="text-xs font-semibold text-[#1E293B] mb-2">ระดับความเผ็ด</p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="ระดับความเผ็ด">
                {SPICE_LEVELS.map((level, idx) => {
                  const active = spice === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSpice(level.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 px-2 text-xs font-medium transition-all ${
                        active
                          ? "border-[#1B4332] bg-[#1B4332] text-white shadow-sm"
                          : "border-slate-200/80 bg-white text-[#1E293B] hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-0.5 h-4">
                        {idx === 0 ? (
                          <span className={`text-[11px] ${active ? "text-white/90" : "text-[#64748B]"}`}>0</span>
                        ) : (
                          Array.from({ length: idx }).map((_, i) => (
                            <Flame
                              key={i}
                              className={`h-3.5 w-3.5 ${active ? "text-orange-300" : "text-[#EA580C]"}`}
                              aria-hidden="true"
                            />
                          ))
                        )}
                      </div>
                      <span>{level.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {extras.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#1E293B] mb-2">ตัวเลือกเพิ่มเติม</p>
              <div className="flex flex-wrap gap-2">
                {extras.map((extra) => {
                  const active = selectedExtras.includes(extra.label);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleExtra(extra.label)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-[#EA580C] bg-[#FFF7ED] text-[#EA580C]"
                          : "border-slate-200/80 bg-white text-[#1E293B] hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {active ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Plus className="h-3 w-3 text-[#64748B]" aria-hidden="true" />
                      )}
                      <span>{extra.label}</span>
                      <span className="text-[11px] opacity-80">+{formatPrice(extra.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Note */}
          <div>
            <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
              หมายเหตุถึงครัว (ถ้ามี)
            </label>
            <Input
              placeholder="เช่น ไม่ใส่ผักชี, แยกน้ำจิ้ม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 text-sm bg-slate-50/50 border-slate-200/80"
            />
          </div>

          {/* Quantity and Add Button */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                aria-label="ลดจำนวน"
                className="h-9 w-9 rounded-lg hover:bg-white text-[#1E293B]"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="w-9 text-center font-semibold text-[#1E293B] text-base">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((prev) => prev + 1)}
                aria-label="เพิ่มจำนวน"
                className="h-9 w-9 rounded-lg hover:bg-white text-[#1E293B]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <Button
              onClick={handleAdd}
              variant="accent"
              className="flex-1 h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>เพิ่มลงตะกร้าโต๊ะ {tableId}</span>
              <span className="font-bold">· {formatPrice(unitPrice * quantity)}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
