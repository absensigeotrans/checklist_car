export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function formatDateID(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID") + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID");
}

export function getDayFromDate(dateStr: string): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[new Date(dateStr).getDay()];
}

export function simpleHash(str: string): string {
  if (!str) return "";
  return btoa(String(str));
}

export function getDamagePercentCategory(value: number): string {
  if (value <= 30) return "Ringan";
  if (value <= 70) return "Sedang";
  return "Berat";
}

export function getPartLabel(part: string): string {
  const labels: Record<string, string> = {
    body_depan: "Depan",
    body_samping_kiri: "Samping Kiri",
    body_samping_kanan: "Samping Kanan",
    body_belakang: "Belakang",
  };
  return labels[part] || part;
}
