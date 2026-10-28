"use client";

import { useState } from "react";
import Image from "next/image";
import { TableCart, CartItem } from "@/types/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag, Send, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SharedCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  cart: TableCart | null;
  onUpdateQuantity: (menuId: number, delta: number) => void;
  onRemoveItem: (menuId: number) => void;
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
        body: JSON.stringify({
          tableId,
          items,
        }),
      });

      if (!res.ok) throw new Error("ไม่สามารถส่งออเดอร์ได้");

      const createdOrder = await res.json();
      toast.success(`ส่งออเดอร์ ${createdOrder.id} โต๊ะ ${tableId} เรียบร้อยแล้ว!`, {
        description: "รายการอาหารถูกส่งเข้าห้องครัวของทางร้านแล้วครับ",
      });
      onOrderSuccess();
      onClose();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-md p-6 bg-white border-border">
        {/* Header */}
        <SheetHeader className="text-left border-b border-border pb-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Users className="h-4 w-4" />
            <span>Shared Table Cart</span>
          </div>
          <SheetTitle className="text-2xl font-bold text-foreground">
            ตะกร้าอาหาร โต๊ะ {tableId}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 bg-softOrange/60 p-2.5 rounded-xl border border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <span>คนที่สแกน QR โต๊ะ {tableId} จะเห็นและสั่งอาหารในตะกร้านี้ร่วมกัน</span>
          </SheetDescription>
        </SheetHeader>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-softOrange text-primary">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-base">ตะกร้าโต๊ะยังว่างอยู่</p>
                <p className="text-xs mt-1">เลือกเมนูอร่อย ๆ ด้านนอกเพื่อเพิ่มลงในตะกร้าได้เลยครับ</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.menuId}-${item.note || ""}`}
                className="flex items-center gap-3.5 rounded-2xl border border-border/70 p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                {item.image && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-softOrange shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {item.name}
                  </h4>
                  {item.note && (
                    <p className="text-[11px] text-primary truncate italic mt-0.5">
                      โน้ต: {item.note}
                    </p>
                  )}
                  <div className="text-sm font-bold text-primary mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 shrink-0 bg-white rounded-xl border border-border/80 p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.menuId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.menuId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.menuId)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  title="ลบรายการ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Actions */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border pt-4 flex-col gap-3">
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>จำนวนรายการทั้งหมด</span>
                <span>{totalQuantity} จาน</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>ยอดรวมทั้งโต๊ะ</span>
                <span className="text-xl text-primary font-bold">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCart}
                className="h-12 rounded-2xl text-xs text-muted-foreground hover:text-red-500"
              >
                ล้างตะกร้า
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-2xl bg-primary text-white font-medium hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "กำลังส่งออเดอร์..." : "ยืนยันการสั่งอาหาร"}</span>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
