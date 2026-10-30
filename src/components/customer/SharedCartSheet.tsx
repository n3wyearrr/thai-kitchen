"use client";

import { useState } from "react";
import Image from "next/image";
import { TableCart } from "@/types/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { cartLineKey, describeOptions } from "@/lib/cart";
import { Trash2, Plus, Minus, ShoppingBag, Send, Users } from "lucide-react";
import { toast } from "sonner";

interface SharedCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  cart: TableCart | null;
  onUpdateQuantity: (lineKey: string, delta: number) => void;
  onRemoveItem: (lineKey: string) => void;
  onClearCart: () => void;
  onOrderSuccess: () => void;
}

export function SharedCartSheet({
  isOpen,
  onClose,
  tableId,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}: SharedCartSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = cart?.items || [];
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!items.length) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ไม่สามารถส่งออเดอร์ได้");
      }

      const createdOrder = await res.json();
      toast.success(`ส่งออเดอร์ ${createdOrder.id} โต๊ะ ${tableId} เรียบร้อยแล้ว`, {
        description: "รายการอาหารถูกส่งเข้าห้องครัวของทางร้านแล้ว",
      });
      onOrderSuccess();
      onClose();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-md p-6 bg-white border-l border-slate-200/80">
        {/* Header */}
        <SheetHeader className="text-left border-b border-slate-200/70 pb-4">
          <div className="inline-flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ตะกร้าร่วมประจำโต๊ะ</span>
          </div>
          <SheetTitle className="text-xl font-bold text-[#1E293B]">
            ตะกร้าอาหาร โต๊ะ {tableId}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#64748B] flex items-center gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 text-[#1B4332]">
            <span>ทุกคนที่สแกน QR โต๊ะ {tableId} สามารถเลือกอาหารและดูรายการในตะกร้านี้ร่วมกันแบบเรียลไทม์</span>
          </SheetDescription>
        </SheetHeader>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-[#64748B] space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#64748B]">
                <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B] text-sm">ยังไม่มีรายการอาหารในตะกร้า</p>
                <p className="text-xs text-[#64748B] mt-1">เลือกเมนูที่ต้องการเพื่อเพิ่มลงตะกร้าโต๊ะ {tableId}</p>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const lineKey = cartLineKey(item);
              const options = describeOptions(item);
              return (
                <div
                  key={lineKey}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  {item.image && (
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-stone-100 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#1E293B] text-sm truncate">
                      {item.name}
                    </h4>
                    {options.length > 0 && (
                      <p className="text-[11px] text-[#64748B] mt-0.5">{options.join(" · ")}</p>
                    )}
                    {item.note && (
                      <p className="text-[11px] text-[#EA580C] truncate mt-0.5">
                        หมายเหตุ: {item.note}
                      </p>
                    )}
                    <div className="text-sm font-semibold text-[#EA580C] mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 shrink-0 bg-white rounded-lg border border-slate-200/80 p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(lineKey, -1)}
                      aria-label="ลดจำนวน"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#1E293B] hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold text-[#1E293B]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(lineKey, 1)}
                      aria-label="เพิ่มจำนวน"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#1E293B] hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(lineKey)}
                    className="p-1.5 text-[#64748B] hover:text-red-600 transition-colors shrink-0"
                    title="ลบรายการ"
                    aria-label={`ลบ ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Actions */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-slate-200/80 pt-4 flex-col gap-3">
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>จำนวนรายการทั้งหมด</span>
                <span>{totalQuantity} รายการ</span>
              </div>
              <div className="flex justify-between items-baseline text-base font-semibold text-[#1E293B]">
                <span>ยอดรวมประจำโต๊ะ</span>
                <span className="text-xl text-[#EA580C] font-bold">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2.5 w-full pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCart}
                className="h-11 px-4 rounded-xl text-xs text-[#64748B] hover:text-red-600 hover:border-red-200"
              >
                ล้างตะกร้า
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                variant="accent"
                className="flex-1 h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{isSubmitting ? "กำลังส่งออเดอร์..." : "ยืนยันการสั่งอาหาร"}</span>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
