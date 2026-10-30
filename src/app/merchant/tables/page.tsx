"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import QRCode from "qrcode";
import { RestaurantTable, TableStatus } from "@/types/restaurant-table";
import { TableQrCard } from "@/components/merchant/TableQrCard";
import { CustomerScanModal } from "@/components/merchant/CustomerScanModal";
import { TableFormDialog } from "@/components/merchant/TableFormDialog";
import { PrintableStandee } from "@/components/merchant/PrintableStandee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  PlusCircle,
  Printer,
  QrCode,
  Search,
  Settings,
  Users,
  RefreshCw,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MerchantTablesPage() {
  const router = useRouter();

  // Authentication check
  const { data: auth } = useSWR<{
    authenticated: boolean;
    user?: { name: string; role: string };
  }>("/api/auth", fetcher);

  useEffect(() => {
    if (auth && !auth.authenticated) {
      router.replace("/merchant/login");
    }
  }, [auth, router]);

  // Tables data with live stats (polled every 3 seconds)
  const {
    data: tablesData,
    mutate: mutateTables,
    isValidating,
  } = useSWR<RestaurantTable[] | { error: string }>("/api/tables", fetcher, {
    refreshInterval: 3000,
  });

  const tables = useMemo(
    () => (Array.isArray(tablesData) ? tablesData : []),
    [tablesData]
  );

  // Base URL state
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [isBaseUrlDialogOpen, setIsBaseUrlDialogOpen] = useState(false);
  const [tempBaseUrl, setTempBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chanon_qr_base_url");
      const initial = saved || window.location.origin;
      setBaseUrl(initial);
      setTempBaseUrl(initial);
    }
  }, []);

  const handleSaveBaseUrl = () => {
    const trimmed = tempBaseUrl.trim().replace(/\/+$/, "");
    if (!trimmed) {
      toast.error("กรุณาระบุ URL ที่ถูกต้อง");
      return;
    }
    setBaseUrl(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("chanon_qr_base_url", trimmed);
    }
    setIsBaseUrlDialogOpen(false);
    toast.success("บันทึกการตั้งค่า Base URL สำหรับสร้าง QR เรียบร้อย");
  };

  // Pre-generate QR map for batch print
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!baseUrl || tables.length === 0) return;
    const cleanBase = baseUrl.replace(/\/+$/, "");
    tables.forEach((t) => {
      const url = `${cleanBase}/table/${encodeURIComponent(t.id)}`;
      QRCode.toDataURL(url, {
        width: 350,
        margin: 2,
        color: { dark: "#1E293B", light: "#ffffff" },
      })
        .then((dataUrl) => {
          setQrMap((prev) => ({ ...prev, [t.id]: dataUrl }));
        })
        .catch(() => {});
    });
  }, [tables, baseUrl]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ทั้งหมด");
  const [selectedStatus, setSelectedStatus] = useState<string>("ทั้งหมด");

  const zones = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.zone) set.add(t.zone);
    });
    return ["ทั้งหมด", ...Array.from(set)];
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchQuery =
        !searchQuery.trim() ||
        table.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.zone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchZone =
        selectedZone === "ทั้งหมด" || table.zone === selectedZone;

      const matchStatus =
        selectedStatus === "ทั้งหมด" ||
        (selectedStatus === "ACTIVE" && table.status === "ACTIVE") ||
        (selectedStatus === "INACTIVE" && table.status === "INACTIVE");

      return matchQuery && matchZone && matchStatus;
    });
  }, [tables, searchQuery, selectedZone, selectedStatus]);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);

  // Customer Scan Modal State
  const [scanModalTable, setScanModalTable] = useState<RestaurantTable | null>(null);
  const [scanModalQr, setScanModalQr] = useState<string>("");

  // Delete Confirm State
  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Print Standee State
  const [singlePrintTableId, setSinglePrintTableId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (table: RestaurantTable) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  const handleSaveTable = async (data: {
    id: string;
    name: string;
    seats: number;
    zone: string;
    status: TableStatus;
  }) => {
    if (editingTable) {
      const res = await fetch(`/api/tables/${encodeURIComponent(editingTable.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          seats: data.seats,
          zone: data.zone,
          status: data.status,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "ไม่สามารถแก้ไขข้อมูลโต๊ะได้");
      }
      toast.success(`แก้ไขข้อมูล ${data.name} เรียบร้อยแล้ว`);
    } else {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "ไม่สามารถเพิ่มโต๊ะได้");
      }
      toast.success(`สร้าง ${data.name} และ QR Code เรียบร้อยแล้ว`);
    }
    mutateTables();
  };

  const handleConfirmDelete = async () => {
    if (!deletingTable) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(deletingTable.id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "ไม่สามารถลบโต๊ะได้");
      }
      toast.success(`ลบโต๊ะ ${deletingTable.id} เรียบร้อยแล้ว`);
      setDeletingTable(null);
      mutateTables();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบโต๊ะ";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowCustomerScan = (table: RestaurantTable, qrDataUrl: string) => {
    setScanModalTable(table);
    setScanModalQr(qrDataUrl);
  };

  const handlePrintSingle = (table: RestaurantTable) => {
    setSinglePrintTableId(table.id);
    setTimeout(() => {
      window.print();
      setSinglePrintTableId(null);
    }, 150);
  };

  const handlePrintAll = () => {
    setSinglePrintTableId(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Stats calculation
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "ACTIVE").length;
  const occupiedTables = tables.filter((t) => t.isOccupied).length;
  const totalSeats = tables.reduce((sum, t) => sum + (t.seats || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] print:bg-white">
      {/* Printable Area */}
      <PrintableStandee
        tables={tables}
        qrMap={qrMap}
        singleTableId={singlePrintTableId}
      />

      {/* Screen Interface */}
      <div className="print:hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href="/merchant"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#1E293B] hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>กลับหน้า POS</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B4332] text-white shadow-sm">
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold leading-tight text-[#1E293B]">
                    จัดการโต๊ะ & QR Code
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBaseUrlDialogOpen(true)}
                className="h-8 rounded-lg text-xs"
              >
                <Settings className="h-3.5 w-3.5 mr-1 text-[#64748B]" aria-hidden="true" />
                <span className="hidden md:inline">ตั้งค่า URL สแกน</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintAll}
                className="h-8 rounded-lg text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1 text-[#1B4332]" aria-hidden="true" />
                <span className="hidden sm:inline">พิมพ์ป้ายทุกโต๊ะ</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="h-8 rounded-lg text-xs font-semibold"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                <span>เพิ่มโต๊ะใหม่</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Compact KPI Summary */}
        <div className="border-b border-slate-200/70 bg-white">
          <div className="mx-auto max-w-[1440px] w-full px-4 sm:px-6 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
                <div>
                  <p className="text-[11px] font-medium text-[#64748B]">โต๊ะทั้งหมด</p>
                  <div className="text-xl font-bold text-[#1E293B] mt-0.5">
                    {totalTables} <span className="text-xs font-normal text-[#64748B]">โต๊ะ</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#1E293B]">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
                <div>
                  <p className="text-[11px] font-medium text-[#64748B]">เปิดให้บริการ</p>
                  <div className="text-xl font-bold text-[#1B4332] mt-0.5">
                    {activeTables} <span className="text-xs font-normal text-[#64748B]">โต๊ะ</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
                <div>
                  <p className="text-[11px] font-medium text-[#64748B]">กำลังใช้งาน</p>
                  <div className="text-xl font-bold text-[#EA580C] mt-0.5">
                    {occupiedTables} <span className="text-xs font-normal text-[#64748B]">โต๊ะ</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#EA580C]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C] animate-pulse" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
                <div>
                  <p className="text-[11px] font-medium text-[#64748B]">จำนวนที่นั่งรวม</p>
                  <div className="text-xl font-bold text-[#1E293B] mt-0.5">
                    {totalSeats} <span className="text-xs font-normal text-[#64748B]">ที่นั่ง</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#1E293B]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <section className="mx-auto max-w-[1440px] w-full px-4 sm:px-6 pt-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" aria-hidden="true" />
              <Input
                type="text"
                placeholder="ค้นหาเลขโต๊ะ, ชื่อโต๊ะ หรือโซน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-slate-50/70 text-xs"
              />
            </div>

            {/* Zone Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-[#64748B] mr-1">โซน:</span>
              {zones.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                    selectedZone === zone
                      ? "bg-[#1B4332] text-white border-[#1B4332]"
                      : "bg-white text-[#64748B] border-slate-200/80 hover:text-[#1E293B]"
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>

            {/* Status & Refresh */}
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedStatus("ทั้งหมด")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedStatus === "ทั้งหมด"
                      ? "bg-white text-[#1E293B] shadow-sm"
                      : "text-[#64748B]"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("ACTIVE")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedStatus === "ACTIVE"
                      ? "bg-white text-[#1B4332] shadow-sm"
                      : "text-[#64748B]"
                  }`}
                >
                  เปิดบริการ
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => mutateTables()}
                aria-label="รีเฟรชข้อมูลโต๊ะ"
                className="h-8 w-8 rounded-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin text-[#1B4332]" : ""}`} />
              </Button>
            </div>
          </div>
        </section>

        {/* Tables & QR Code Grid */}
        <main className="mx-auto max-w-[1440px] w-full px-4 sm:px-6 py-5 pb-16">
          {filteredTables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <QrCode className="mx-auto h-10 w-10 text-slate-400 mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#1E293B]">ไม่พบข้อมูลโต๊ะ</h3>
              <p className="text-xs text-[#64748B] mt-1">
                ลองเปลี่ยนคำค้นหา หรือกดเพิ่มโต๊ะใหม่เข้าสู่ระบบ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map((table) => (
                <TableQrCard
                  key={table.id}
                  table={table}
                  baseUrl={baseUrl}
                  onShowCustomerScan={handleShowCustomerScan}
                  onEdit={handleOpenEdit}
                  onDelete={(t) => setDeletingTable(t)}
                  onPrintSingle={handlePrintSingle}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Customer Scan Modal */}
      <CustomerScanModal
        table={scanModalTable}
        qrDataUrl={scanModalQr}
        baseUrl={baseUrl}
        open={Boolean(scanModalTable)}
        onOpenChange={(open) => {
          if (!open) {
            setScanModalTable(null);
            setScanModalQr("");
          }
        }}
        onPrint={() => {
          if (scanModalTable) {
            handlePrintSingle(scanModalTable);
          }
        }}
      />

      {/* Table Add / Edit Dialog */}
      <TableFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        table={editingTable}
        onSave={handleSaveTable}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingTable)}
        onOpenChange={(open) => {
          if (!open) setDeletingTable(null);
        }}
      >
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-1.5 text-red-600 font-semibold text-xs">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>ยืนยันการลบโต๊ะ</span>
            </div>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">
              ต้องการลบ {deletingTable?.name} หรือไม่?
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2 text-xs text-[#64748B]">
            <p>
              เมื่อลบโต๊ะ <strong>{deletingTable?.name}</strong> ออกจากระบบแล้ว QR Code เดิมจะไม่สามารถใช้งานได้อีก
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingTable(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "กำลังลบ..." : "ยืนยันลบโต๊ะ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Base URL Config Dialog */}
      <Dialog open={isBaseUrlDialogOpen} onOpenChange={setIsBaseUrlDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>ตั้งค่า Domain / URL สำหรับ QR Code</span>
            </div>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">
              Base URL ปลายทางของ QR
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-xs text-[#64748B] leading-relaxed">
              ระบุ URL หรือ IP ของเซิร์ฟเวอร์สำหรับสร้างลิงก์ใน QR Code ให้ลูกค้าสแกนสั่งอาหาร
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Base URL
              </label>
              <Input
                type="text"
                value={tempBaseUrl}
                onChange={(e) => setTempBaseUrl(e.target.value)}
                placeholder="เช่น http://192.168.1.10:3000"
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBaseUrlDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSaveBaseUrl}>
              บันทึกการตั้งค่า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
