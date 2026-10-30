"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { RestaurantTable } from "@/types/restaurant-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Users,
  Check,
  Smartphone,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface TableQrCardProps {
  table: RestaurantTable;
  baseUrl: string;
  onShowCustomerScan: (table: RestaurantTable, qrDataUrl: string) => void;
  onEdit: (table: RestaurantTable) => void;
  onDelete: (table: RestaurantTable) => void;
  onPrintSingle: (table: RestaurantTable, qrDataUrl: string) => void;
}

export function TableQrCard({
  table,
  baseUrl,
  onShowCustomerScan,
  onEdit,
  onDelete,
  onPrintSingle,
}: TableQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const cleanBase = (baseUrl || fallbackOrigin || "").replace(/\/+$/, "");
  const tableUrl = cleanBase ? `${cleanBase}/table/${encodeURIComponent(table.id)}` : "";

  useEffect(() => {
    let isMounted = true;
    if (!tableUrl) return;
    QRCode.toDataURL(tableUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1E293B",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [tableUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl);
      setCopied(true);
      toast.success(`คัดลอกลิงก์โต๊ะ ${table.id} แล้ว`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-table-${table.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`ดาวน์โหลด QR โต๊ะ ${table.id} สำเร็จ`);
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border bg-white transition-all shadow-sm hover:shadow-md overflow-hidden ${
        table.status === "INACTIVE"
          ? "border-slate-200/60 opacity-70"
          : "border-slate-200/80"
      }`}
    >
      {/* Header Info */}
      <div className="border-b border-slate-200/70 bg-slate-50/70 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 min-w-[28px] px-1.5 items-center justify-center rounded-lg bg-[#1B4332] text-white font-bold text-xs">
                {table.id}
              </span>
              <h3 className="text-base font-bold text-[#1E293B] leading-tight">
                {table.name}
              </h3>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1 font-medium text-[#1E293B]">
                <Users className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                {table.seats} ที่นั่ง
              </span>
              <span>·</span>
              <span className="rounded-md bg-white px-2 py-0.5 border border-slate-200/80 text-[11px]">
                {table.zone}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {table.status === "ACTIVE" ? (
              <Badge variant="success" className="text-[10px]">
                เปิดบริการ
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                ปิดปรับปรุง
              </Badge>
            )}

            {table.isOccupied ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#EA580C]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                มีออเดอร์ ({table.activeOrderCount || 0})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#64748B]">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                โต๊ะว่าง
              </span>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="p-4 flex flex-col items-center">
        <div className="group relative rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
          {qrDataUrl ? (
            <div className="relative h-40 w-40">
              <Image
                src={qrDataUrl}
                alt={`QR Code โต๊ะ ${table.id}`}
                fill
                sizes="160px"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-xs text-[#64748B]">
              กำลังสร้าง QR...
            </div>
          )}

          <button
            type="button"
            onClick={() => onShowCustomerScan(table, qrDataUrl)}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl font-semibold text-xs gap-1.5 p-2 text-center"
          >
            <Smartphone className="h-5 w-5 text-orange-300" aria-hidden="true" />
            <span>ขยายเต็มจอให้ลูกค้าสแกน</span>
          </button>
        </div>

        {/* URL Preview */}
        <div className="mt-3 w-full">
          <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 text-xs text-[#64748B]">
            <span className="truncate max-w-[180px]" title={tableUrl}>
              /table/{table.id}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[#1B4332] hover:underline font-medium flex items-center gap-1 text-[11px] shrink-0 ml-2"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                  <span className="text-emerald-600">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Action */}
        <div className="mt-2.5 w-full">
          <Button
            type="button"
            onClick={() => onShowCustomerScan(table, qrDataUrl)}
            className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>เปิดให้ลูกค้าสแกนโต๊ะนี้</span>
          </Button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200/70 bg-slate-50/50 p-3">
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPrintSingle(table, qrDataUrl)}
            className="h-8 rounded-lg px-1 text-[11px]"
          >
            <Printer className="h-3 w-3 mr-1 text-[#1B4332]" aria-hidden="true" />
            <span>พิมพ์</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-8 rounded-lg px-1 text-[11px]"
          >
            <Download className="h-3 w-3 mr-1 text-[#1B4332]" aria-hidden="true" />
            <span>บันทึก</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.open(tableUrl, "_blank")}
            className="h-8 rounded-lg px-1 text-[11px]"
          >
            <ExternalLink className="h-3 w-3 mr-1 text-[#1B4332]" aria-hidden="true" />
            <span>เปิดดู</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(table)}
            className="h-8 rounded-lg px-1 text-[11px]"
          >
            <Edit2 className="h-3 w-3 mr-1 text-[#1B4332]" aria-hidden="true" />
            <span>แก้ไข</span>
          </Button>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onDelete(table)}
            className="text-[11px] text-[#64748B] hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            <span>ลบโต๊ะนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
}
