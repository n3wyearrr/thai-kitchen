import { CartItem, SpiceLevel } from "@/types/cart";

export const SPICE_LEVELS: { value: SpiceLevel; label: string; emoji: string }[] = [
  { value: "NONE", label: "ไม่เผ็ด", emoji: "🙂" },
  { value: "LOW", label: "เผ็ดน้อย", emoji: "🌶" },
  { value: "MEDIUM", label: "เผ็ดกลาง", emoji: "🌶🌶" },
  { value: "HIGH", label: "เผ็ดมาก", emoji: "🌶🌶🌶" },
];

export function spiceLabel(spice?: SpiceLevel): string | undefined {
  return SPICE_LEVELS.find((s) => s.value === spice)?.label;
}

/** รายการที่เมนู/ตัวเลือก/หมายเหตุเหมือนกันจะรวมเป็นบรรทัดเดียวกัน */
export function cartLineKey(item: Pick<CartItem, "menuId" | "spice" | "extras" | "note">): string {
  const extras = [...(item.extras ?? [])].sort().join(",");
  return [item.menuId, item.spice ?? "", extras, (item.note ?? "").trim()].join("|");
}

/** ข้อความสรุปตัวเลือก เช่น ["เผ็ดน้อย", "+ไข่ดาว"] สำหรับแสดงใต้ชื่อเมนู */
export function describeOptions(item: Pick<CartItem, "spice" | "extras">): string[] {
  const parts: string[] = [];
  const spice = spiceLabel(item.spice);
  if (spice) parts.push(spice);
  for (const extra of item.extras ?? []) parts.push(`+${extra}`);
  return parts;
}
