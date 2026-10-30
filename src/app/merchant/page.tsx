"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { Order, OrderStatus } from "@/types/order";
import { SERVICE_CALL_LABELS, ServiceCall } from "@/types/service";
import { MenuItem } from "@/types/menu";
import { SalesReport } from "@/lib/store";
import { describeOptions } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice, calculateBill } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Receipt,
  Calculator,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  ChefHat,
  BellRing,
  LogOut,
  UserCheck,
  Volume2,
  VolumeX,
  AlertTriangle,
  QrCode,
  Package,
  BarChart3,
  Award,
  UtensilsCrossed,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** ออเดอร์ที่ยังไม่เสิร์ฟและรอเกิน 15 นาทีจะขึ้น Badge เตือน */
const OVERDUE_MINUTES = 15;

function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

function isOverdue(order: Order, now: number): boolean {
  return (
    (order.status === "PENDING" || order.status === "COOKING") &&
    minutesSince(order.createdAt, now) >= OVERDUE_MINUTES
  );
}

export default function MerchantPage() {
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

  // SWR polling every 2 seconds for incoming kitchen orders
  const { data: ordersData, mutate, isValidating } = useSWR<Order[] | { error: string }>(
    "/api/orders",
    fetcher,
    { refreshInterval: 2000 }
  );
  const orders = Array.isArray(ordersData) ? ordersData : undefined;

  // คำขอจากโต๊ะ (เรียกพนักงาน / ขอน้ำ / เช็คบิล)
  const { data: callsData, mutate: mutateCalls } = useSWR<ServiceCall[] | { error: string }>(
    "/api/calls",
    fetcher,
    { refreshInterval: 2000 }
  );
  const calls = Array.isArray(callsData) ? callsData : [];

  // ดึงรายการเมนูเพื่อจัดการสต็อก/ของหมด
  const { data: menusData, mutate: mutateMenus } = useSWR<MenuItem[]>(
    "/api/menus",
    fetcher,
    { refreshInterval: 4000 }
  );
  const stockMenus = Array.isArray(menusData) ? menusData : [];

  // ดึงรายงานสรุปยอดขายประจำวัน
  const { data: reportData, mutate: mutateReport } = useSWR<SalesReport>(
    "/api/reports/daily",
    fetcher,
    { refreshInterval: 5000 }
  );

  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "report">("orders");

  // ---- เสียงแจ้งเตือน & ออเดอร์รอนาน ----
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const seenRef = useRef<{ orders: Set<string>; calls: Set<number>; overdue: Set<string> } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const playChime = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx || !soundOnRef.current) return;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }, []);

  const toggleSound = () => {
    if (soundOnRef.current) {
      soundOnRef.current = false;
      setSoundOn(false);
      return;
    }
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioRef.current = audioRef.current ?? new AudioCtor();
    void audioRef.current.resume();
    soundOnRef.current = true;
    setSoundOn(true);
    playChime();
  };

  useEffect(() => {
    if (!orders || !Array.isArray(callsData)) return;
    const overdueIds = orders.filter((o) => isOverdue(o, now)).map((o) => o.id);

    if (!seenRef.current) {
      seenRef.current = {
        orders: new Set(orders.map((o) => o.id)),
        calls: new Set(callsData.map((c) => c.id)),
        overdue: new Set(overdueIds),
      };
      return;
    }

    const seen = seenRef.current;
    let ring = false;
    for (const o of orders) {
      if (!seen.orders.has(o.id)) {
        seen.orders.add(o.id);
        if (o.status === "PENDING") {
          toast.info(`ออเดอร์ใหม่ โต๊ะ ${o.tableId}`);
          ring = true;
        }
      }
    }
    for (const c of callsData) {
      if (!seen.calls.has(c.id)) {
        seen.calls.add(c.id);
        toast.warning(`โต๊ะ ${c.tableId}: ${SERVICE_CALL_LABELS[c.type]}`);
        ring = true;
      }
    }
    for (const id of overdueIds) {
      if (!seen.overdue.has(id)) {
        seen.overdue.add(id);
        toast.error(`ออเดอร์ ${id} รอนานเกิน ${OVERDUE_MINUTES} นาทีแล้ว`);
        ring = true;
      }
    }
    if (ring) playChime();
  }, [orders, callsData, now, playChime]);

  const handleToggleStock = async (menuId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/menus/${menuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (!res.ok) throw new Error();
      mutateMenus();
      toast.success(
        !currentStatus
          ? "เปิดจำหน่ายเมนูนี้ (In-Stock) แล้ว"
          : "ปิดจำหน่ายเมนูนี้ (Out-of-Stock) แล้ว"
      );
    } catch {
      toast.error("ไม่สามารถอัปเดตสถานะเมนูได้");
    }
  };

  const handleResolveCall = async (id: number) => {
    try {
      const res = await fetch(`/api/calls/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      mutateCalls();
    } catch {
      toast.error("ไม่สามารถอัปเดตคำขอได้");
    }
  };

  // Billing Modal State
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      await globalMutate("/api/auth", { authenticated: false }, false);
      toast.info("ออกจากระบบเรียบร้อยแล้ว");
      router.replace("/merchant/login");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("ไม่สามารถเปลี่ยนสถานะได้");
      toast.success(`อัปเดตสถานะออเดอร์เป็น ${getStatusLabel(newStatus)} เรียบร้อย`);
      mutate();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleOpenBilling = (order: Order) => {
    setBillingOrder(order);
    setCashReceived(order.total.toString());
    setDiscount("0");
  };

  const handleConfirmPayment = async () => {
    if (!billingOrder) return;
    try {
      await handleUpdateStatus(billingOrder.id, "PAID");
      toast.success(`เช็คบิลโต๊ะ ${billingOrder.tableId} เรียบร้อยแล้ว`, {
        description: `ยอดชำระ ${formatPrice(billingOrder.total)}`,
      });
      setBillingOrder(null);
      mutateReport();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกการชำระเงิน");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="warning" className="gap-1 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span>รับออเดอร์</span>
          </Badge>
        );
      case "COOKING":
        return (
          <Badge className="border-sky-200 bg-sky-50 text-sky-800 gap-1 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
            <span>กำลังปรุง</span>
          </Badge>
        );
      case "SERVED":
        return (
          <Badge variant="success" className="gap-1 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>พร้อมเสิร์ฟ</span>
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="secondary" className="font-medium">
            ชำระแล้ว
          </Badge>
        );
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "รับออเดอร์";
      case "COOKING":
        return "กำลังปรุง";
      case "SERVED":
        return "พร้อมเสิร์ฟ";
      case "PAID":
        return "ชำระเงินแล้ว";
    }
  };

  const activeOrders = orders?.filter((o) => o.status !== "PAID") || [];
  const paidOrders = orders?.filter((o) => o.status === "PAID") || [];
  const pendingCount = orders?.filter((o) => o.status === "PENDING").length || 0;
  const cookingCount = orders?.filter((o) => o.status === "COOKING").length || 0;
  const servedCount = orders?.filter((o) => o.status === "SERVED").length || 0;
  const soldOutCount = stockMenus.filter((m) => m.isAvailable === false).length;

  // Bill calculations
  const parsedSubtotal = billingOrder ? billingOrder.subtotal : 0;
  const parsedCash = parseFloat(cashReceived) || 0;
  const parsedDiscount = parseFloat(discount) || 0;
  const bill = calculateBill(parsedSubtotal, parsedCash, parsedDiscount);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] flex flex-col">
      {/* Compact POS & KDS Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="กลับหน้าแรก"
              aria-label="กลับหน้าแรก"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B4332] text-white shadow-sm">
              <ChefHat className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-base font-bold text-[#1E293B] tracking-tight">
                Chanon POS & Kitchen
              </h1>
              <span className="hidden md:inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-[#1B4332]">
                LIVE KDS
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {auth?.user && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-xs text-[#64748B]">
                <UserCheck className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span className="font-medium text-[#1E293B]">{auth.user.name}</span>
              </div>
            )}

            <Button
              variant={soundOn ? "default" : "outline"}
              size="sm"
              onClick={toggleSound}
              aria-pressed={soundOn}
              className="h-8 text-xs font-medium rounded-lg"
              title="เปิด/ปิดเสียงแจ้งเตือนเมื่อมีออเดอร์ใหม่"
            >
              {soundOn ? (
                <Volume2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="mr-1.5 h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{soundOn ? "เสียงแจ้งเตือน: เปิด" : "เปิดเสียงเตือน"}</span>
            </Button>

            <Link
              href="/merchant/tables"
              className="inline-flex items-center h-8 px-3 rounded-lg border border-slate-200/90 bg-white text-[#1E293B] text-xs font-medium hover:bg-slate-50 shadow-sm transition-colors"
              title="จัดการโต๊ะและพิมพ์ป้าย QR Code"
            >
              <QrCode className="mr-1.5 h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
              <span className="hidden sm:inline">จัดการโต๊ะ & QR</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isValidating}
              className="h-8 text-xs font-medium rounded-lg"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isValidating ? "animate-spin text-[#1B4332]" : "text-[#64748B]"}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="h-8 text-xs text-[#64748B] hover:text-red-600 hover:bg-red-50/60 rounded-lg"
              title="ออกจากระบบ POS"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1" aria-hidden="true" />
              <span className="hidden md:inline">ออก</span>
            </Button>
          </div>
        </div>
      </header>

      {/* High-Density KPI Summary Cards & Mode Switcher */}
      <div className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-[1440px] w-full px-4 sm:px-6 py-3 space-y-3">
          {/* Compact 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
              <div>
                <p className="text-[11px] font-medium text-[#64748B]">รอรับออเดอร์</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#1E293B]">{pendingCount}</span>
                  <span className="text-xs text-[#64748B]">โต๊ะ</span>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
                <BellRing className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
              <div>
                <p className="text-[11px] font-medium text-[#64748B]">กำลังปรุงในครัว</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#1E293B]">{cookingCount}</span>
                  <span className="text-xs text-[#64748B]">โต๊ะ</span>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60">
                <ChefHat className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
              <div>
                <p className="text-[11px] font-medium text-[#64748B]">เสิร์ฟแล้ว · รอคิดเงิน</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#1E293B]">{servedCount}</span>
                  <span className="text-xs text-[#64748B]">โต๊ะ</span>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <Receipt className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAFAF9] px-3.5 py-2.5 shadow-sm">
              <div>
                <p className="text-[11px] font-medium text-[#64748B]">ยอดขายชำระแล้ววันนี้</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#1B4332]">
                    {formatPrice(reportData?.totalRevenue ?? 0)}
                  </span>
                  <span className="text-[11px] text-[#64748B]">({paidOrders.length} บิล)</span>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#EA580C] border border-orange-200/60">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-white text-[#1E293B] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                <UtensilsCrossed className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>รายการออเดอร์สด ({activeOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stock")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "stock"
                    ? "bg-white text-[#1E293B] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                <Package className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
                <span>จัดการสต็อกเมนู</span>
                {soldOutCount > 0 && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-semibold text-red-700">
                    หมด {soldOutCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "report"
                    ? "bg-white text-[#1E293B] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>สรุปยอดขายวันนี้</span>
              </button>
            </div>

            <div className="text-xs text-[#64748B] hidden sm:block">
              อัปเดตข้อมูลเรียลไทม์อัตโนมัติทุก 2 วินาที
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1440px] w-full flex-1 px-4 sm:px-6 py-5 space-y-5">
        {/* Table Service Calls Alert Strip */}
        {calls.length > 0 && (
          <section
            aria-label="คำขอจากโต๊ะ"
            className="rounded-xl border border-orange-200/90 bg-[#FFF7ED] p-3.5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#EA580C]">
                <BellRing className="h-4 w-4 animate-bounce" aria-hidden="true" />
                <span>คำขอรับบริการจากลูกค้า ({calls.length} รายการ)</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {calls.map((call) => (
                  <li
                    key={call.id}
                    className="inline-flex items-center gap-2.5 rounded-lg border border-orange-200/80 bg-white px-3 py-1.5 shadow-sm"
                  >
                    <div className="text-xs">
                      <span className="font-semibold text-[#1E293B]">
                        โต๊ะ {call.tableId}
                      </span>
                      <span className="mx-1.5 text-slate-300">|</span>
                      <span className="font-medium text-[#EA580C]">
                        {SERVICE_CALL_LABELS[call.type]}
                      </span>
                      <span className="ml-2 text-[11px] text-[#64748B]">
                        ({minutesSince(call.createdAt, now)} นาทีที่แล้ว)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleResolveCall(call.id)}
                      className="h-6 rounded-md bg-[#1B4332] px-2.5 text-[11px] hover:bg-[#143325]"
                    >
                      รับทราบ
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* TAB 1: LIVE KITCHEN & CASHIER ORDERS (KDS GRID) */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#1B4332]">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-[#1E293B]">
                  ไม่มีออเดอร์ค้างในขณะนี้
                </h3>
                <p className="text-xs text-[#64748B]">
                  เมื่อลูกค้าสแกน QR สั่งอาหาร รายการจะเด้งขึ้นมาบนหน้าจอ KDS นี้โดยอัตโนมัติ
                </p>
                <div className="pt-1">
                  <Link href="/table/1">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs font-semibold">
                      ทดลองเปิดหน้าสั่งอาหารลูกค้า (โต๊ะ 1)
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeOrders.map((order) => {
                  const overdue = isOverdue(order, now);
                  const waited = minutesSince(order.createdAt, now);
                  return (
                    <Card
                      key={order.id}
                      className={`flex flex-col justify-between rounded-2xl bg-white overflow-hidden transition-all ${
                        overdue
                          ? "border-red-300 ring-1 ring-red-200/80 shadow-md"
                          : "border-slate-200/80 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {/* KDS Card Header: Table - Wait Time - Status */}
                      <div>
                        <div
                          className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                            overdue
                              ? "bg-red-50/70 border-red-200/70"
                              : "bg-slate-50/70 border-slate-200/70"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg bg-[#1B4332] text-white font-bold text-sm">
                              {order.tableId}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-[#1E293B]">
                                  โต๊ะ {order.tableId}
                                </span>
                                <span className="text-[11px] text-[#64748B]">
                                  #{order.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                <span>
                                  {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {getStatusBadge(order.status)}
                            {(order.status === "PENDING" || order.status === "COOKING") && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  overdue
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-slate-100 text-[#64748B]"
                                }`}
                              >
                                {overdue && <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />}
                                <span>รอ {waited} นาที</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* KDS Order Items List */}
                        <div className="p-4 space-y-2.5">
                          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-0.5">
                            {order.items.map((item, idx) => {
                              const opts = describeOptions(item);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-slate-100 px-1 text-[11px] font-bold text-[#1E293B]">
                                        x{item.quantity}
                                      </span>
                                      <span className="font-semibold text-[#1E293B] text-sm leading-snug">
                                        {item.name}
                                      </span>
                                    </div>
                                    {opts.length > 0 && (
                                      <p className="text-[11px] font-medium text-[#EA580C] pl-6 mt-0.5">
                                        {opts.join(" · ")}
                                      </p>
                                    )}
                                    {item.note && (
                                      <p className="text-[11px] text-amber-700 bg-amber-50/80 rounded px-1.5 py-0.5 mt-1 ml-6 inline-block">
                                        โน้ต: {item.note}
                                      </p>
                                    )}
                                  </div>
                                  <span className="font-medium text-[#64748B] shrink-0 pt-0.5">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* KDS Card Footer: Total + Segmented Status Control + Checkout CTA */}
                      <div className="p-4 pt-0 space-y-2.5">
                        <div className="flex items-baseline justify-between border-t border-slate-200/70 pt-2.5">
                          <span className="text-xs font-medium text-[#64748B]">
                            ยอดรวม ({order.items.reduce((s, i) => s + i.quantity, 0)} รายการ)
                          </span>
                          <span className="text-lg font-bold text-[#EA580C]">
                            {formatPrice(order.total)}
                          </span>
                        </div>

                        {/* Segmented Status Switch */}
                        <div
                          className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
                          role="group"
                          aria-label={`เปลี่ยนสถานะออเดอร์โต๊ะ ${order.tableId}`}
                        >
                          {(
                            [
                              { status: "PENDING", label: "รับออเดอร์" },
                              { status: "COOKING", label: "กำลังปรุง" },
                              { status: "SERVED", label: "พร้อมเสิร์ฟ" },
                            ] as { status: OrderStatus; label: string }[]
                          ).map((step) => {
                            const active = order.status === step.status;
                            return (
                              <button
                                key={step.status}
                                type="button"
                                onClick={() => handleUpdateStatus(order.id, step.status)}
                                className={`h-7 rounded-lg text-[11px] font-semibold transition-all ${
                                  active
                                    ? "bg-white text-[#1B4332] shadow-sm"
                                    : "text-[#64748B] hover:text-[#1E293B]"
                                }`}
                              >
                                {step.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Checkout Button */}
                        <Button
                          onClick={() => handleOpenBilling(order)}
                          className="w-full h-9 rounded-xl bg-[#1B4332] hover:bg-[#143325] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>คิดเงิน / เช็คบิล ({formatPrice(order.total)})</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STOCK & MENU TOGGLE (iOS-Style Modern Switch) */}
        {activeTab === "stock" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#1E293B]">
                  จัดการสต็อกและสถานะเมนูอาหาร
                </h2>
                <p className="text-xs text-[#64748B]">
                  สลับสวิตช์เพื่อเปิด-ปิดการขายแบบเรียลไทม์ เมนูที่ปิดจะแสดงสถานะ &ldquo;สินค้าหมดชั่วคราว&rdquo; บนมือถือลูกค้าทันที
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  พร้อมขาย {stockMenus.length - soldOutCount}
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  ของหมด {soldOutCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {stockMenus.map((menu) => {
                const isAvail = menu.isAvailable !== false;
                return (
                  <div
                    key={menu.id}
                    className={`rounded-2xl border p-4 bg-white shadow-sm flex items-center justify-between gap-4 transition-colors ${
                      isAvail
                        ? "border-slate-200/80"
                        : "border-slate-200/60 bg-slate-50/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isAvail ? "text-[#1E293B]" : "text-[#64748B] line-through"
                          }`}
                        >
                          {menu.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{menu.category}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-bold text-[#EA580C]">
                          {formatPrice(menu.price)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isAvail
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : "bg-slate-200/70 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAvail ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isAvail ? "In-Stock (พร้อมขาย)" : "Out-of-Stock (ของหมด)"}
                        </span>
                      </div>
                    </div>

                    {/* iOS / Modern Web Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAvail}
                      aria-label={`สลับสถานะจำหน่าย ${menu.name}`}
                      onClick={() => handleToggleStock(menu.id, isAvail)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]/40 ${
                        isAvail ? "bg-[#1B4332]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isAvail ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DAILY SALES REPORT */}
        {activeTab === "report" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                รายงานยอดขายประจำวัน (Daily Sales Report)
              </h2>
              <p className="text-xs text-[#64748B]">
                สรุปยอดขายจริงจากบิลที่ชำระเงินเสร็จสิ้นแล้วทั้งหมดในวันนี้
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs text-[#64748B] font-medium">รายได้สุทธิทั้งหมด</p>
                <p className="text-2xl font-bold text-[#1B4332] mt-1.5">
                  {formatPrice(reportData?.totalRevenue ?? 0)}
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">คำนวณจากบิลที่ชำระเงินแล้ว</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs text-[#64748B] font-medium">จำนวนบิลที่ปิดแล้ว</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1.5">
                  {reportData?.totalOrders ?? 0} โต๊ะ
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">เช็คบิลและเคลียร์โต๊ะเรียบร้อย</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs text-[#64748B] font-medium">จำนวนจานที่ขายได้</p>
                <p className="text-2xl font-bold text-[#EA580C] mt-1.5">
                  {reportData?.totalDishesSold ?? 0} จาน
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">รวมทุกหมวดหมู่อาหาร</p>
              </div>
            </div>

            {/* Top Selling Dishes */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-[#1E293B] flex items-center gap-2">
                <Award className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                <span>5 อันดับเมนูขายดีประจำวัน</span>
              </h3>

              {!reportData?.topDishes || reportData.topDishes.length === 0 ? (
                <p className="text-xs text-[#64748B] py-4">ยังไม่มีข้อมูลยอดขายที่ปิดบิลในขณะนี้</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reportData.topDishes.map((dish, i) => (
                    <div key={dish.name} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[#1E293B] font-semibold text-xs">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-[#1E293B] text-sm">{dish.name}</p>
                          <p className="text-xs text-[#64748B]">ขายได้ {dish.count} จาน</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-[#1B4332]">{formatPrice(dish.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* POS Cashier Checkout Modal */}
      <Dialog open={Boolean(billingOrder)} onOpenChange={(open) => !open && setBillingOrder(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xl">
          <DialogHeader className="border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-1.5 text-[#1B4332] font-semibold text-xs">
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              <span>POS CASHIER CHECKOUT</span>
            </div>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">
              คิดเงิน โต๊ะ {billingOrder?.tableId}{" "}
              <span className="text-xs font-normal text-[#64748B]">({billingOrder?.id})</span>
            </DialogTitle>
          </DialogHeader>

          {billingOrder && (
            <div className="space-y-4 pt-1">
              {/* Order Summary Breakdown */}
              <div className="rounded-xl bg-slate-50/90 p-4 space-y-2.5 border border-slate-200/70">
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>ยอดรวมค่าอาหาร ({billingOrder.items.reduce((s, i) => s + i.quantity, 0)} รายการ)</span>
                  <span className="font-semibold text-[#1E293B]">{formatPrice(bill.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>ส่วนลดท้ายบิล (บาท)</span>
                  <Input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-8 w-24 text-right rounded-lg bg-white border-slate-200 text-xs font-medium"
                  />
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/80">
                  <span className="text-sm font-semibold text-[#1E293B]">ยอดสุทธิที่ต้องชำระ</span>
                  <span className="text-2xl font-bold text-[#EA580C]">
                    {formatPrice(bill.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Cash Received Input & Quick Cash Denominations */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                  <span>รับเงินสดจากลูกค้า (บาท)</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-12 text-lg font-bold rounded-xl bg-white border-slate-300 focus-visible:border-[#1B4332]"
                  placeholder="0"
                />

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "พอดี", value: bill.grandTotal },
                    { label: "฿100", value: 100 },
                    { label: "฿500", value: 500 },
                    { label: "฿1,000", value: 1000 },
                  ].map((btn) => {
                    const isSelected = Number(cashReceived) === btn.value;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setCashReceived(btn.value.toString())}
                        className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-[#1B4332] bg-[#1B4332] text-white shadow-sm"
                            : "border-slate-200/90 bg-slate-50 text-[#1E293B] hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Highlighted Change Box (Soft Emerald Green) */}
              <div
                className={`rounded-xl p-4 border flex items-center justify-between transition-colors ${
                  bill.cashReceived >= bill.grandTotal
                    ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}
              >
                <div>
                  <div className="text-xs font-medium opacity-80">เงินทอนลูกค้า (Change)</div>
                  <div className="text-2xl font-bold mt-0.5 tracking-tight">
                    {bill.cashReceived >= bill.grandTotal
                      ? formatPrice(bill.change)
                      : `ขาดอีก ${formatPrice(bill.grandTotal - bill.cashReceived)}`}
                  </div>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    bill.cashReceived >= bill.grandTotal
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setBillingOrder(null)}
                  className="rounded-xl h-11 flex-1 font-medium"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={bill.cashReceived < bill.grandTotal}
                  className="rounded-xl h-11 flex-[1.5] bg-[#1B4332] hover:bg-[#143325] text-white font-semibold"
                >
                  ยืนยันรับเงิน & ปิดบิลโต๊ะ {billingOrder.tableId}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
