"use client";

import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export function MenuCard({ item, onSelect, onQuickAdd }: MenuCardProps) {
  return (
    <Card className="group overflow-hidden rounded-3xl border border-border/80 bg-white hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Clickable Image & Info */}
      <div className="cursor-pointer" onClick={() => onSelect(item)}>
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-softOrange/40">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="bg-white/95 backdrop-blur-md text-primary font-medium text-xs shadow-xs">
              {item.category}
            </Badge>
            {item.isPopular && (
              <Badge className="bg-amber-500 text-white shadow-xs text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> ยอดนิยม
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 pb-3">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.desc}
          </p>
        </CardContent>
      </div>

      {/* Footer / Price & Quick Add Button */}
      <div className="flex items-center justify-between p-5 pt-0">
        <div className="text-xl font-bold text-primary">
          {formatPrice(item.price)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSelect(item)}
            className="text-xs h-9 rounded-xl font-medium"
          >
            ดูรายละเอียด
          </Button>
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            title="เพิ่มลงตะกร้าทันที"
            className="h-9 w-9 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-xs"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
