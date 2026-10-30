"use client";

import { useState, useEffect } from "react";
import { RestaurantTable, TableStatus } from "@/types/restaurant-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Users, MapPin, Hash, Sparkles } from "lucide-react";

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RestaurantTable | null;
  onSave: (data: {
    id: string;
    name: string;
    seats: number;
    zone: string;
    status: TableStatus;
  }) => Promise<void>;
}

const ZONE_PRESETS = [
  "โซนห้องแอร์",
  "โซนหน้าร้าน",
  "โซนระเบียง",
  "ห้อง VIP",
  "โซนสวน",
];

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  onSave,
}: TableFormDialogProps) {
  const isEdit = Boolean(table);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(4);
  const [zone, setZone] = useState("โซนห้องแอร์");
  const [status, setStatus] = useState<TableStatus>("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (table) {
      setId(table.id);
      setName(table.name);
      setSeats(table.seats);
      setZone(table.zone);
      setStatus(table.status);
    } else {
      setId("");
      setName("");
      setSeats(4);
      setZone("โซนห้องแอร์");
      setStatus("ACTIVE");
    }
    setError("");
  }, [table, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = id.trim();
    const trimmedName = name.trim() || `โต๊ะ ${trimmedId}`;

    if (!trimmedId) {
      setError("กรุณาระบุหมายเลขโต๊ะ เช่น 1, 2, VIP-1");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: trimmedId,
        name: trimmedName,
        seats: Math.max(1, Number(seats) || 4),
        zone: zone.trim() || "โซนห้องแอร์",
        status,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึก");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xl">
        <DialogHeader className="border-b border-slate-200/70 pb-3">
          <div className="flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
            {isEdit ? <Edit className="h-3.5 w-3.5" aria-hidden="true" /> : <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{isEdit ? "แก้ไขข้อมูลโต๊ะ" : "เพิ่มโต๊ะใหม่"}</span>
          </div>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {isEdit ? `แก้ไข ${table?.name}` : "สร้างโต๊ะและสร้าง QR Code"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Table ID */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                หมายเลขหรือรหัสโต๊ะ (ID)
              </span>
            </label>
            <Input
              type="text"
              required
              disabled={isEdit}
              placeholder="เช่น 1, 2, VIP-1"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                if (!name || name === `โต๊ะ ${id}`) {
                  setName(`โต๊ะ ${e.target.value}`);
                }
              }}
              className="h-10"
            />
          </div>

          {/* Table Display Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                ชื่อเรียกโต๊ะ (Display Name)
              </span>
            </label>
            <Input
              type="text"
              required
              placeholder="เช่น โต๊ะ 1, โต๊ะริมหน้าต่าง"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Zone & Seats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                  โซนที่ตั้ง
                </span>
              </label>
              <Input
                type="text"
                placeholder="เช่น โซนห้องแอร์"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="h-10 text-xs"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {ZONE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setZone(preset)}
                    className="text-[10px] rounded-md bg-slate-100 px-2 py-0.5 text-[#64748B] hover:text-[#1E293B] transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                  จำนวนที่นั่ง
                </span>
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                required
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="h-10"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
              สถานะการให้บริการ
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setStatus("ACTIVE")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  status === "ACTIVE"
                    ? "bg-white text-[#1B4332] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                เปิดใช้งาน (ACTIVE)
              </button>
              <button
                type="button"
                onClick={() => setStatus("INACTIVE")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  status === "INACTIVE"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                ปิดปรับปรุง (INACTIVE)
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มโต๊ะและสร้าง QR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
