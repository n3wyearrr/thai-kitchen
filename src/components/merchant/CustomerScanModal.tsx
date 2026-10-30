"use client";

import Image from "next/image";
import { RestaurantTable } from "@/types/restaurant-table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Smartphone, Check, Copy, ExternalLink, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CustomerScanModalProps {
  table: RestaurantTable | null;
  qrDataUrl: string;
  baseUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
}

export function CustomerScanModal({
  table,
  qrDataUrl,
  baseUrl,
  open,
  onOpenChange,
  onPrint,
}: CustomerScanModalProps) {
  const [copied, setCopied] = useState(false);

  if (!table) return null;

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const tableUrl = `${cleanBase}/table/${encodeURIComponent(table.id)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl);
      setCopied(true);
      toast.success("คัดลอกลิงก์เรียบร้อยแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-xl">
        {/* Header Banner */}
        <div className="bg-[#1B4332] text-white p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold tracking-tight text-emerald-100">
              Chanon Thai Kitchen
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold text-white mt-1">
            {table.name}
          </DialogTitle>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            {table.zone} · รองรับ {table.seats} ที่นั่ง
          </p>
        </div>

        {/* Big QR Code Presentation */}
        <div className="p-6 flex flex-col items-center bg-[#FAFAF9]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {qrDataUrl ? (
              <div className="relative h-64 w-64">
                <Image
                  src={qrDataUrl}
                  alt={`QR Code โต๊ะ ${table.id}`}
                  fill
                  sizes="256px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-sm text-[#64748B]">
                กำลังโหลด QR...
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#EA580C] border border-orange-200/70">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>เปิดกล้องมือถือสแกนเพื่อสั่งอาหาร</span>
            </div>
            <p className="text-xs text-[#64748B] pt-1">
              เข้าสู่ตะกร้าร่วมของ <strong>{table.name}</strong> โดยอัตโนมัติ
            </p>
          </div>

          {/* Action Row */}
          <div className="mt-5 flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex-1 h-10 rounded-xl text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onPrint}
              className="flex-1 h-10 rounded-xl text-xs font-medium"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              <span>พิมพ์ป้าย</span>
            </Button>

            <Button
              type="button"
              onClick={() => window.open(tableUrl, "_blank")}
              className="h-10 px-3 rounded-xl text-xs"
              title="เปิดดูหน้าโต๊ะในแท็บใหม่"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
