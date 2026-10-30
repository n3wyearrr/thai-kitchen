"use client";

import { useState } from "react";
import { BellRing, Check, Droplets, Receipt } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_CALL_LABELS, ServiceCall, ServiceCallType } from "@/types/service";

const BUTTONS: { type: ServiceCallType; icon: typeof BellRing }[] = [
  { type: "STAFF", icon: BellRing },
  { type: "WATER", icon: Droplets },
  { type: "BILL", icon: Receipt },
];

interface CallStaffBarProps {
  tableId: string;
  calls: ServiceCall[];
  onChanged: () => void;
}

export function CallStaffBar({ tableId, calls, onChanged }: CallStaffBarProps) {
  const [sending, setSending] = useState<ServiceCallType | null>(null);

  const send = async (type: ServiceCallType) => {
    setSending(type);
    try {
      const res = await fetch(`/api/table/${encodeURIComponent(tableId)}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      toast.success(`แจ้ง "${SERVICE_CALL_LABELS[type]}" โต๊ะ ${tableId} แล้ว รอสักครู่นะ`);
      onChanged();
    } catch {
      toast.error("ส่งคำขอไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSending(null);
    }
  };

  return (
    <section
      aria-label="บริการประจำโต๊ะ"
      className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className="text-xs font-semibold text-[#64748B]">บริการด่วนประจำโต๊ะ</p>
        <div className="grid grid-cols-3 gap-2 flex-1 sm:max-w-md">
          {BUTTONS.map(({ type, icon: Icon }) => {
            const requested = calls.some((c) => c.type === type);
            return (
              <button
                key={type}
                type="button"
                disabled={requested || sending === type}
                onClick={() => send(type)}
                className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-all ${
                  requested
                    ? "border-emerald-200 bg-emerald-50 text-[#1B4332]"
                    : "border-slate-200/80 bg-slate-50/70 text-[#1E293B] hover:border-slate-300 hover:bg-white active:scale-[0.98]"
                }`}
              >
                {requested ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-[#1B4332] shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{requested ? "แจ้งแล้ว" : SERVICE_CALL_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
