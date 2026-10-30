"use client";

import Image from "next/image";
import { RestaurantTable } from "@/types/restaurant-table";
import { UtensilsCrossed, Smartphone, Sparkles } from "lucide-react";

interface PrintableStandeeProps {
  tables: RestaurantTable[];
  qrMap: Record<string, string>; // tableId -> dataUrl
  singleTableId?: string | null;
}

export function PrintableStandee({
  tables,
  qrMap,
  singleTableId,
}: PrintableStandeeProps) {
  const displayTables = singleTableId
    ? tables.filter((t) => t.id === singleTableId)
    : tables;

  if (displayTables.length === 0) return null;

  return (
    <div id="printable-standees" className="hidden print:block font-kanit">
      <div className="grid grid-cols-2 gap-6 p-4">
        {displayTables.map((table) => {
          const qr = qrMap[table.id];
          return (
            <div
              key={table.id}
              className="break-inside-avoid border-4 border-[#30251e] bg-white p-6 rounded-md text-center shadow-none flex flex-col items-center justify-between min-h-[460px]"
            >
              {/* Brand Header */}
              <div className="w-full border-b-2 border-[#30251e] pb-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#c65324] text-white font-bold">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-[#30251e]">
                    Chanon Thai Kitchen
                  </span>
                </div>
                <p className="text-xs text-[#806f61] mt-0.5">
                  อร่อยแบบไทย ใส่ใจทุกจาน • Smart Dine-in
                </p>
              </div>

              {/* Table Number Highlight */}
              <div className="my-3 py-1 px-4 bg-[#fff0e3] border-2 border-[#c65324] rounded-sm">
                <span className="text-xs font-semibold text-[#806f61]">หมายเลข</span>
                <div className="text-3xl font-extrabold text-[#c65324] leading-tight">
                  {table.name}
                </div>
                <div className="text-[11px] font-medium text-[#30251e]">
                  {table.zone} ({table.seats} ที่นั่ง)
                </div>
              </div>

              {/* QR Code */}
              <div className="border-2 border-[#30251e] p-2 bg-white rounded-sm my-2">
                {qr ? (
                  <div className="relative h-48 w-48">
                    <Image
                      src={qr}
                      alt={`QR Code โต๊ะ ${table.id}`}
                      fill
                      sizes="192px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center text-xs text-gray-400">
                    QR Code
                  </div>
                )}
              </div>

              {/* Scan Steps */}
              <div className="w-full border-t-2 border-[#30251e] pt-3 text-xs text-[#30251e] space-y-1">
                <p className="font-bold text-[#c65324] flex items-center justify-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  สแกนสั่งอาหารด้วยตนเอง
                </p>
                <p className="text-[11px] text-[#806f61]">
                  1. เปิดกล้องมือถือสแกน QR Code ด้านบน
                </p>
                <p className="text-[11px] text-[#806f61]">
                  2. เลือกเมนูและส่งออเดอร์ร่วมกันกับเพื่อนในโต๊ะได้ทันที
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
