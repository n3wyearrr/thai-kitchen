"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, ChefHat, Clock, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Order, OrderStatus } from "@/types/order";
import { describeOptions } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

const STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "PENDING", label: "รับออเดอร์", icon: Clock },
  { status: "COOKING", label: "กำลังปรุง", icon: ChefHat },
  { status: "SERVED", label: "พร้อมเสิร์ฟ", icon: UtensilsCrossed },
];

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  COOKING: "ครัวกำลังปรุงอาหารของคุณแล้ว",
  SERVED: "อาหารเสิร์ฟแล้ว ทานให้อร่อยนะ",
};

interface OrderTrackerProps {
  orders: Order[];
}

export function OrderTracker({ orders }: OrderTrackerProps) {
  const previous = useRef<Map<string, OrderStatus> | null>(null);

  useEffect(() => {
    const current = new Map(orders.map((o) => [o.id, o.status]));
    if (previous.current) {
      for (const order of orders) {
        const before = previous.current.get(order.id);
        const message = STATUS_MESSAGES[order.status];
        if (before && before !== order.status && message) {
          toast.success(`${order.id}: ${message}`);
        }
      }
    }
    previous.current = current;
  }, [orders]);

  if (orders.length === 0) return null;

  return (
    <section aria-labelledby="tracker-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="tracker-heading" className="text-base font-semibold text-[#1E293B]">
          สถานะออเดอร์ของโต๊ะนี้
        </h2>
        <span className="text-xs text-[#64748B]">{orders.length} บิลที่สั่งแล้ว</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {orders.map((order) => {
          const activeIndex = STEPS.findIndex((s) => s.status === order.status);
          const summary = order.items
            .map((i) => {
              const opts = describeOptions(i);
              return `${i.name}${opts.length ? ` (${opts.join(", ")})` : ""} x${i.quantity}`;
            })
            .join(" · ");
          return (
            <article
              key={order.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1E293B] text-sm">{order.id}</span>
                  <span className="text-[#EA580C] font-semibold">{formatPrice(order.total)}</span>
                </div>
                <span className="text-[#64748B]">
                  สั่งเมื่อ{" "}
                  {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-[#64748B] line-clamp-2">{summary}</p>

              <ol className="flex items-center pt-1" aria-label="สถานะออเดอร์">
                {STEPS.map((step, i) => {
                  const done = i < activeIndex;
                  const current = i === activeIndex;
                  const Icon = done ? CheckCircle2 : step.icon;
                  return (
                    <li key={step.status} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                            current
                              ? "border-[#EA580C] bg-[#EA580C] text-white shadow-sm"
                              : done
                              ? "border-[#1B4332] bg-[#1B4332] text-white"
                              : "border-slate-200 bg-slate-50 text-[#64748B]"
                          } ${current && step.status !== "SERVED" ? "animate-pulse" : ""}`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span
                          className={`text-[11px] ${
                            current
                              ? "font-semibold text-[#EA580C]"
                              : done
                              ? "font-medium text-[#1B4332]"
                              : "text-[#64748B]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <span
                          className={`mx-2 mb-4 h-0.5 flex-1 rounded-full ${
                            done ? "bg-[#1B4332]" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}
