"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Order, OrderStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice, calculateBill } from "@/lib/utils";
import {
  UtensilsCrossed,
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
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MerchantPage() {
  const router = useRouter();

  // Authentication check
  const { data: auth, error: authError } = useSWR<{ authenticated: boolean; user?: { name: string; role: string } }>(
    "/api/auth",
    fetcher
  );

  useEffect(() => {
    if (auth && !auth.authenticated) {
      router.push("/merchant/login");
    }
  }, [auth, router]);

  // SWR polling every 2 seconds for incoming kitchen orders
  const { data: orders, mutate, isValidating } = useSWR<Order[]>(
    "/api/orders",
    fetcher,
    { refreshInterval: 2000 }
  );

  // Billing Modal State
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      toast.info("ออกจากระบบเรียบร้อยแล้ว");
      router.push("/merchant/login");
      router.refresh();
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
      toast.success(`เช็คบิลโต๊ะ ${billingOrder.tableId} เรียบร้อยแล้ว!`, {
        description: `ยอดชำระ ${formatPrice(billingOrder.total)} บาท`,
      });
      setBillingOrder(null);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกการชำระเงิน");
    }
  };

  // Status visual helpers
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">⏳ รอดำเนินการ</Badge>;
      case "COOKING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">🔥 กำลังปรุง</Badge>;
      case "SERVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">🍽️ เสิร์ฟแล้ว</Badge>;
      case "PAID":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">✓ ชำระแล้ว</Badge>;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return "รอคิว";
      case "COOKING": return "กำลังปรุง";
      case "SERVED": return "เสิร์ฟแล้ว";
      case "PAID": return "ชำระเงินแล้ว";
    }
  };

  const activeOrders = orders?.filter((o) => o.status !== "PAID") || [];
  const paidOrders = orders?.filter((o) => o.status === "PAID") || [];

  // Bill calculations
  const parsedSubtotal = billingOrder ? billingOrder.subtotal : 0;
  const parsedCash = parseFloat(cashReceived) || 0;
  const parsedDiscount = parseFloat(discount) || 0;
  const bill = calculateBill(parsedSubtotal, parsedCash, parsedDiscount);

  return (
    <div className="min-h-screen bg-[#fffaf3] flex flex-col font-kanit">
      {/* Merchant Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-xs">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/table/1">
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#214d3d] text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">ระบบจัดการร้าน & แคชเชียร์</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
                  Merchant POS
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Thai Kitchen แดชบอร์ดสรุปออเดอร์และคิดเงิน</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {auth?.user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-muted/40 border border-border text-xs">
                <UserCheck className="h-4 w-4 text-emerald-700" />
                <span className="font-semibold text-foreground">{auth.user.name}</span>
                <span className="text-muted-foreground">({auth.user.role})</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isValidating}
              className="rounded-xl border-border text-xs"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isValidating ? "animate-spin text-primary" : ""}`} />
              รีเฟรช
            </Button>

            <Link href="/table/1" target="_blank">
              <Button size="sm" variant="outline" className="rounded-xl text-xs border-primary/30 text-primary hover:bg-softOrange">
                <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" />
                หน้าลูกค้า
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="rounded-xl text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50"
              title="ออกจากระบบ POS"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Overview Stat Cards */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>ออเดอร์ที่กำลังรอทำ</span>
              <BellRing className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {orders?.filter((o) => o.status === "PENDING").length || 0} โต๊ะ
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>กำลังปรุงในครัว</span>
              <ChefHat className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {orders?.filter((o) => o.status === "COOKING").length || 0} โต๊ะ
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>เสิร์ฟแล้ว รอเช็คบิล</span>
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {orders?.filter((o) => o.status === "SERVED").length || 0} โต๊ะ
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>เช็คบิลแล้ววันนี้</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-primary">
              {paidOrders.length} โต๊ะ
            </div>
          </div>
        </div>
      </section>

      {/* Main Order Dashboard */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">รายการสั่งซื้อในร้าน (Active Orders)</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              แสดงโต๊ะที่สั่งอาหารเข้ามาแบบเรียลไทม์ พร้อมคิดเงินและคำนวณเงินทอน
            </p>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white/70 p-12 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-bold text-foreground">ไม่มีออเดอร์ค้างในขณะนี้</h3>
            <p className="text-sm text-muted-foreground">
              เมื่อลูกค้าโต๊ะใดสแกนสั่งอาหาร รายการจะแสดงขึ้นที่หน้านี้อัตโนมัติ
            </p>
            <Link href="/table/1">
              <Button variant="outline" className="mt-2 rounded-xl text-primary border-primary">
                ลองสั่งอาหารจากหน้าลูกค้า (โต๊ะ 1)
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map((order) => (
              <Card
                key={order.id}
                className="rounded-3xl border-border bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <CardHeader className="border-b border-border/70 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-foreground">
                          โต๊ะ {order.tableId}
                        </span>
                        <span className="text-xs text-muted-foreground">({order.id})</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(order.createdAt).toLocaleTimeString("th-TH")}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between text-sm py-1 border-b border-border/40 last:border-0"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">
                              {item.name}
                            </span>
                            <span className="text-xs text-primary font-bold ml-2">
                              x{item.quantity}
                            </span>
                            {item.note && (
                              <p className="text-xs text-amber-600 italic">
                                หมายเหตุ: {item.note}
                              </p>
                            )}
                          </div>
                          <span className="font-medium text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-base font-bold border-t border-border">
                      <span className="text-foreground">ยอดรวมทั้งสิ้น</span>
                      <span className="text-xl text-primary font-bold">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-5 pt-0 flex flex-col gap-2.5">
                  {/* Status Toggle Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    <Button
                      size="sm"
                      variant={order.status === "PENDING" ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(order.id, "PENDING")}
                      className="text-xs h-9 rounded-xl"
                    >
                      รอทำ
                    </Button>
                    <Button
                      size="sm"
                      variant={order.status === "COOKING" ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(order.id, "COOKING")}
                      className="text-xs h-9 rounded-xl"
                    >
                      กำลังปรุง
                    </Button>
                    <Button
                      size="sm"
                      variant={order.status === "SERVED" ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(order.id, "SERVED")}
                      className="text-xs h-9 rounded-xl"
                    >
                      เสิร์ฟครบ
                    </Button>
                  </div>

                  {/* Billing Button */}
                  <Button
                    onClick={() => handleOpenBilling(order)}
                    className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>เช็คบิล / คำนวณเงินทอน</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Billing & Change Calculator Modal */}
      <Dialog open={Boolean(billingOrder)} onOpenChange={(open) => !open && setBillingOrder(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white border-border">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
              <Receipt className="h-4 w-4" />
              <span>คิดเงิน & ออกบิล</span>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              เช็คบิล โต๊ะ {billingOrder?.tableId}
            </DialogTitle>
          </DialogHeader>

          {billingOrder && (
            <div className="space-y-4 pt-2">
              {/* Order breakdown */}
              <div className="rounded-2xl bg-muted/40 p-4 space-y-2 border border-border/60">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ยอดรวมค่าอาหาร</span>
                  <span className="font-semibold text-foreground">{formatPrice(bill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ส่วนลด (บาท)</span>
                  <Input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-8 w-24 text-right rounded-lg bg-white border-border text-xs"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>ยอดสุทธิที่ต้องชำระ</span>
                  <span className="text-2xl text-primary font-bold">
                    {formatPrice(bill.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Cash Received & Quick buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  จำนวนเงินสดที่รับมา (บาท)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-12 text-lg font-bold rounded-2xl bg-white border-border"
                  placeholder="0"
                />

                {/* Quick denomination pills */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[bill.grandTotal, 100, 500, 1000].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(amount.toString())}
                      className="rounded-xl text-xs h-8 hover:bg-softOrange hover:text-primary"
                    >
                      {amount === bill.grandTotal ? "พอดี" : `฿${amount}`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Change Display */}
              <div
                className={`rounded-2xl p-4 border flex items-center justify-between ${
                  bill.cashReceived >= bill.grandTotal
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                <div>
                  <div className="text-xs font-medium">เงินทอน (Change)</div>
                  <div className="text-2xl font-extrabold mt-0.5">
                    {bill.cashReceived >= bill.grandTotal
                      ? formatPrice(bill.change)
                      : "เงินไม่พอชำระ"}
                  </div>
                </div>
                <CheckCircle2
                  className={`h-8 w-8 ${
                    bill.cashReceived >= bill.grandTotal ? "text-emerald-600" : "text-red-400"
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setBillingOrder(null)}
                  className="rounded-2xl h-12 flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={bill.cashReceived < bill.grandTotal}
                  className="rounded-2xl h-12 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  ยืนยันชำระเงิน & เคลียร์โต๊ะ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
