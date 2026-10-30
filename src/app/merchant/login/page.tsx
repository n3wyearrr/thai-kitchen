"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowLeft, User, Lock, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";

export default function MerchantLoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";
  const [username, setUsername] = useState(isDev ? "admin" : "");
  const [password, setPassword] = useState(isDev ? "1234" : "");
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

      toast.success("เข้าสู่ระบบสำเร็จ", {
        description: "กำลังนำคุณเข้าสู่แดชบอร์ดจัดการร้าน POS...",
      });

      await globalMutate("/api/auth", { authenticated: true, user: data.user }, false);
      router.replace("/merchant");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B] hover:text-[#1E293B] font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>กลับหน้าแรก</span>
        </Link>
        <Badge variant="success" className="text-xs px-3 py-1 font-medium">
          POS & Kitchen System
        </Badge>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332] text-white shadow-sm">
            <ChefHat className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            เข้าสู่ระบบจัดการร้าน (POS)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Chanon Thai Kitchen · สำหรับมอนิเตอร์ออเดอร์ในครัวและแคชเชียร์
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>ชื่อผู้ใช้งาน</span>
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="h-11 rounded-xl bg-slate-50/60 text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>รหัสผ่าน</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="1234"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-slate-50/60 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#1B4332] hover:bg-[#143325] text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบแคชเชียร์"}</span>
            </Button>
          </form>

          {/* Account Info Box */}
          {isDev && (
            <div className="rounded-xl bg-[#FFF7ED] p-3.5 border border-orange-200/70 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#EA580C]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>บัญชีทดสอบ (โหมดพัฒนา):</span>
              </div>
              <p className="text-xs text-[#1E293B]">
                ชื่อผู้ใช้: <strong className="font-semibold">admin</strong> · รหัสผ่าน:{" "}
                <strong className="font-semibold">1234</strong>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#64748B]">
        Chanon Thai Kitchen · ระบบจัดการร้านอาหาร
      </footer>
    </div>
  );
}
