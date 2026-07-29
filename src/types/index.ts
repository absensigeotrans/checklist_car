export interface DamagePin {
  id: string;
  part: string;
  x: number;
  y: number;
  description: string;
}

export interface ChecklistItem {
  item: string;
  status: "ADA" | "TDK ADA";
  note: string;
}

export interface ChecklistData {
  [idNum: string]: ChecklistItem;
}

export interface DriverInfo {
  name: string;
  nik: string;
}

export interface VehicleInfo {
  type: string;
  licensePlate: string;
  mileageStart: number;
  mileageEnd: number;
}

export interface ConditionInfo {
  damages: DamagePin[];
  fuelLevel: number;
  notes: string[];
}

export interface InspectionRecord {
  inspectionId: string;
  inspectionDate: string;
  driver: DriverInfo;
  vehicle: VehicleInfo;
  checklist: ChecklistData;
  condition: ConditionInfo;
  signature: string;
  attentionNeeded: boolean;
}

export interface DriverLogEntry {
  logId: string;
  driverName: string;
  driverNik: string;
  licensePlate: string;
  logDate: string;
  logDay: string;
  workStart: string;
  workEnd: string;
  kmStart: number;
  kmEnd: number;
  userName: string;
  userSignature: string;
  remark: string;
}

export type UserRole = "driver" | "admin" | null;

export const CHECKLIST_ITEMS: string[] = [
  "AC",
  "ASBAK",
  "JAM TERPASANG",
  "KACA SPION DALAM",
  "KARPET DEPAN",
  "KARPET BELAKANG",
  "LIGHTER/ PEMANTIK API",
  "KLAKSON",
  "P3K",
  "PENAHAN SINAR MATAHARI",
  "RADIO/TAPE/CD",
  "SANDARAN KEPALA",
  "ANTENA",
  "WHELL DOP/DOP RODA",
  "KACA SPION LUAR",
  "PENAHAN LUMPUR",
  "SEGITIGA PENGAMAN",
  "TALANG AIR",
  "BAN SEREP",
  "DONGKRAK STANG",
  "TOOLS SHEET",
  "KACA FILM",
  "PERALATAN CUCI KENDARAAN",
  "KUNCI KONTAK/REMOTE KONTAK",
  "STNK",
  "ALAT PEMADAM/APAR",
  "LAMPU BEMPER",
];

export const DAMAGE_PRESETS = [
  "Baret",
  "Penyok",
  "Pecah",
  "Retak",
  "Bocor",
  "Lampu Mati",
];

export const ADMIN_PIN_HASH = "MTIzNA==";

export const PARTS_LABEL: Record<string, string> = {
  body_depan: "Depan",
  body_samping_kiri: "Samping Kiri",
  body_samping_kanan: "Samping Kanan",
  body_belakang: "Belakang",
};
