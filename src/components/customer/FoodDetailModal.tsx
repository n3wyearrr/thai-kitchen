"use client";

import { useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { CartItem } from "@/types/cart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, ShoppingBag, Sparkles } from "lucide-react";

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

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart({
      menuId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      note: note.trim() || undefined,
      image: item.image,
    });
    setQuantity(1);
    setNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl bg-white border-border">
        {/* Food Image */}
        <div className="relative h-64 w-full bg-softOrange">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-white/90 text-primary backdrop-blur-md shadow-xs">
              {item.category}
            </Badge>
            {item.isPopular && (
              <Badge className="bg-amber-500 text-white shadow-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> ยอดนิยม
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {item.name}
              </DialogTitle>
              <div className="text-2xl font-bold text-primary shrink-0">
                {formatPrice(item.price)}
              </div>
            </div>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </DialogDescription>
          </DialogHeader>

          {/* Ingredients */}
          {item.ingredients && (
            <div className="rounded-2xl bg-muted/40 p-4 border border-border/60">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                🌿 ส่วนประกอบและวัตถุดิบ
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.ingredients}
              </p>
            </div>
          )}

          {/* Special Note */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <Input
              placeholder="เช่น เผ็ดน้อย, ไม่ใส่ผักชี, หวานน้อย"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-sm bg-muted/20 border-border"
            />
          </div>

          {/* Quantity and Add Button */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center rounded-2xl border border-border bg-muted/30 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9 rounded-xl hover:bg-white text-foreground"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-bold text-foreground text-base">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="h-9 w-9 rounded-xl hover:bg-white text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleAdd}
              className="flex-1 h-12 rounded-2xl bg-primary text-white font-medium hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>ใส่ตะกร้าโต๊ะ {tableId}</span>
              <span className="font-bold">({formatPrice(item.price * quantity)})</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
