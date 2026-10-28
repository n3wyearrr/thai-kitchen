"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowLeft, User, Lock, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      toast.success("เข้าสู่ระบบแม่ค้าเรียบร้อยแล้ว!", {
        description: "กำลังนำคุณเข้าสู่แดชบอร์ดจัดการร้าน...",
      });

      router.push("/merchant");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8e8d5] via-[#fffaf3] to-[#fffaf3] flex flex-col justify-between font-kanit">
      {/* Top Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>กลับหน้าแรก</span>
        </Link>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs px-3 py-1">
          ระบบจัดการร้านค้า
        </Badge>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#214d3d] text-white shadow-md">
            <ChefHat className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            เข้าสู่ระบบแม่ค้า
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Thai Kitchen • สำหรับดูออเดอร์ในครัวและคิดเงิน
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>ชื่อผู้ใช้งาน</span>
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="h-12 rounded-xl border-border bg-muted/10 text-sm focus-visible:ring-primary"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span>รหัสผ่าน</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="1234"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-border bg-muted/10 pr-10 text-sm focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 rounded-2xl bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบแม่ค้า"}</span>
            </Button>
          </form>

          {/* Account Info Box */}
          <div className="rounded-2xl bg-softOrange/60 p-3.5 border border-primary/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ข้อมูลเข้าสู่ระบบของแม่ค้า:</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              ชื่อผู้ใช้: <strong className="text-primary font-bold">admin</strong> • รหัสผ่าน: <strong className="text-primary font-bold">1234</strong>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/table/1" className="text-xs text-primary hover:underline">
            ← สำหรับลูกค้า: ไปที่หน้าสั่งอาหารโต๊ะ 1
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        🍲 Thai Kitchen • ระบบจัดการร้านอาหาร
      </footer>
    </div>
  );
}
