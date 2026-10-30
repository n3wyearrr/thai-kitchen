import Link from "next/link";
import Image from "next/image";
import { ScanLine, UtensilsCrossed, BellRing, Smartphone, ArrowRight, Sparkles, Store } from "lucide-react";
import { menus } from "@/data/menus";
import { formatPrice } from "@/lib/utils";

const heroDish = menus[0]; // ไก่ทอดสูตรเด็ด
const secondDish = menus[1]; // หมูทอด
const thirdDish = menus[4]; // ผัดกะเพราโบราณ
const popularMenus = menus.filter((m) => m.isPopular).slice(0, 4);

const steps = [
  { icon: ScanLine, title: "สแกน QR ประจำโต๊ะ", text: "สแกนจากป้ายตั้งโต๊ะเพื่อเข้าสู่ระบบสั่งอาหารของโต๊ะคุณ" },
  { icon: UtensilsCrossed, title: "เลือกเมนูร่วมกัน", text: "เพื่อนในโต๊ะเดียวกันเห็นรายการในตะกร้าแบบเรียลไทม์" },
  { icon: BellRing, title: "ส่งออเดอร์เข้าครัว", text: "รายการส่งตรงถึงครัวและติดตามสถานะอาหารได้ทันที" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="กลับหน้าแรก Chanon"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-white shadow-sm">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1E293B]">
              Chanon
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/menu"
              className="text-xs sm:text-sm font-medium text-[#1E293B] hover:text-[#1B4332] transition-colors"
            >
              เมนูอาหารทั้งหมด
            </Link>
            <Link
              href="/merchant"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:border-slate-300 hover:text-[#1E293B] transition-colors"
            >
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ระบบหลังบ้าน POS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-xs font-medium text-emerald-100">
              <Smartphone className="h-3.5 w-3.5 text-orange-300" aria-hidden="true" />
              <span>Smart QR Dine-in · สั่งอาหารผ่านมือถือไม่ต้องโหลดแอป</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white">
              อร่อยครบรสแบบไทยแท้
              <span className="block text-orange-300 mt-1">สแกนสั่งได้ทันทีที่โต๊ะคุณ</span>
            </h1>

            <p className="max-w-lg text-sm sm:text-base text-emerald-100/85 leading-relaxed">
              สแกน QR Code บนโต๊ะอาหารเพื่อเปิดเมนูและแชร์ตะกร้าร่วมกับเพื่อนในโต๊ะเดียวกัน
              ปรับระดับความเผ็ดได้ตามใจ ส่งตรงเข้าห้องครัวทันที
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/table/1"
                className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C2410C] transition-all"
              >
                <span>ทดลองสั่งอาหาร (โต๊ะ 1)</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15 transition-all"
              >
                <span>ดูเมนูทั้งหมด</span>
              </Link>
            </div>
          </div>

          {/* Clean Modern Dish Showcase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-white/15 shadow-lg">
              <Image
                src={heroDish.image}
                alt={heroDish.name}
                fill
                priority
                sizes="(min-width: 1024px) 25vw, 80vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4">
                <span className="inline-block rounded-full bg-[#EA580C] px-2.5 py-0.5 text-[10px] font-semibold text-white mb-1">
                  เมนูแนะนำ
                </span>
                <p className="text-sm font-semibold text-white">{heroDish.name}</p>
                <p className="text-xs text-orange-200 font-semibold">{formatPrice(heroDish.price)}</p>
              </div>
            </div>
            <div className="grid grid-rows-2 gap-4 col-span-2 sm:col-span-1">
              <div className="relative aspect-[16/9] sm:aspect-auto overflow-hidden rounded-2xl border border-white/15 shadow-lg">
                <Image
                  src={secondDish.image}
                  alt={secondDish.name}
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs font-semibold text-white">{secondDish.name}</p>
                </div>
              </div>
              <div className="relative aspect-[16/9] sm:aspect-auto overflow-hidden rounded-2xl border border-white/15 shadow-lg">
                <Image
                  src={thirdDish.image}
                  alt={thirdDish.name}
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs font-semibold text-white">{thirdDish.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 -mt-6 relative z-10">
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1B4332] font-semibold text-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[#EA580C]">ขั้นตอนที่ {i + 1}</div>
                <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{title}</p>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Popular menu preview */}
      <section aria-labelledby="popular-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] mb-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ยอดนิยมประจำร้าน</span>
            </div>
            <h2 id="popular-heading" className="text-2xl font-bold tracking-tight text-[#1E293B]">
              เมนูขายดีต้องลอง
            </h2>
          </div>
          <Link
            href="/menu"
            className="text-xs sm:text-sm font-semibold text-[#1B4332] hover:underline inline-flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {popularMenus.map((m) => (
            <li
              key={m.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5">
                <p className="text-[11px] text-[#64748B]">{m.category}</p>
                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  <span className="font-semibold text-sm text-[#1E293B] truncate">{m.name}</span>
                  <span className="shrink-0 font-bold text-sm text-[#EA580C]">{formatPrice(m.price)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Callout Banner */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-[#1E293B] flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span>พร้อมเริ่มสั่งอาหารสำหรับโต๊ะของคุณแล้วหรือยัง?</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              สแกน QR Code จากป้ายประจำโต๊ะ หรือกดเลือกโต๊ะเพื่อนั่งทานในร้านได้ทันที
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#1B4332] text-white font-semibold text-xs shadow-sm hover:bg-[#143325] shrink-0 transition-colors"
          >
            เลือกโต๊ะ & ดูเมนูอาหาร
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white py-6 text-[#64748B]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-medium text-[#1E293B]">Chanon Thai Kitchen · อร่อยแบบไทย ใส่ใจทุกจาน</span>
          <div className="flex items-center gap-5">
            <Link href="/menu" className="hover:text-[#1E293B] transition-colors">
              เมนูทั้งหมด
            </Link>
            <Link href="/merchant/tables" className="hover:text-[#1E293B] transition-colors">
              จัดการ QR โต๊ะ
            </Link>
            <Link href="/merchant" className="hover:text-[#1E293B] transition-colors">
              แคชเชียร์ & ห้องครัว (POS)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
