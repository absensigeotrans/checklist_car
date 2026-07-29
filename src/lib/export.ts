import * as XLSX from "xlsx";
import type { InspectionRecord, DriverLogEntry } from "@/types";
import { escapeHtml } from "./utils";

export function exportAllToExcel(records: InspectionRecord[]): void {
  if (records.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }
  const rows: Record<string, unknown>[] = [];
  records.forEach((rec) => {
    const itemAnswers: Record<string, unknown> = {};
    Object.entries(rec.checklist).forEach(([num, data]) => {
      itemAnswers[`Item ${num} (${data.item})`] = data.status;
      itemAnswers[`Ket Item ${num}`] = data.note;
    });
    const damagesText = rec.condition.damages
      .map((d) => `${d.part}: ${d.description}`)
      .join("; ");
    rows.push({
      "Tanggal Inspeksi": new Date(rec.inspectionDate).toLocaleString("id-ID"),
      "Nama Driver": rec.driver.name,
      "Jenis Kendaraan": rec.vehicle.type,
      "No Polisi": rec.vehicle.licensePlate,
      "KM Awal": rec.vehicle.mileageStart,
      "KM Akhir": rec.vehicle.mileageEnd,
      "Total Jarak (KM)": rec.vehicle.mileageEnd - rec.vehicle.mileageStart,
      "Level Bahan Bakar (%)": rec.condition.fuelLevel,
      "Catatan 1": rec.condition.notes[0],
      "Catatan 2": rec.condition.notes[1],
      "Catatan 3": rec.condition.notes[2],
      "Daftar Kerusakan": damagesText,
      "Butuh Perhatian (Defective)": rec.attentionNeeded ? "YA" : "TIDAK",
      ...itemAnswers,
    });
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inspections");
  XLSX.writeFile(wb, "PTK_Checklist_Laporan_Semua.xlsx");
}

export function exportMonthlyLogExcel(logs: DriverLogEntry[]): void {
  if (logs.length === 0) return;
  const rows = logs.map((l) => ({
    Tanggal: l.logDate,
    Hari: l.logDay,
    Nopol: l.licensePlate,
    "Jam Kerja": `${l.workStart} - ${l.workEnd}`,
    "KM Awal": l.kmStart,
    "KM Akhir": l.kmEnd,
    Jarak: l.kmEnd - l.kmStart,
    Pemakai: l.userName,
    Keterangan: l.remark,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Driver Logs");
  XLSX.writeFile(wb, "PTK_LogSheet_Driver.xlsx");
}

export function preparePrintMarkup(rec: InspectionRecord): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const dateObj = new Date(rec.inspectionDate);
  const dateFormatted =
    dateObj.toLocaleDateString("id-ID") +
    " " +
    dateObj.toLocaleTimeString("id-ID");

  let leftTableRows = "";
  let rightTableRows = "";

  for (let i = 1; i <= 27; i++) {
    const item = rec.checklist[i];
    if (!item) continue;
    const statusAda = item.status === "ADA" ? "✓" : "";
    const statusTdk = item.status === "TDK ADA" ? "✓" : "";
    const note = escapeHtml(item.note || "");
    const rowHtml = `
      <tr style="height:18px;">
        <td style="border:1px solid #000; text-align:center; font-size:0.6rem;">${i}</td>
        <td style="border:1px solid #000; padding:1px 3px; font-size:0.58rem; text-transform:uppercase;">${escapeHtml(item.item)}</td>
        <td style="border:1px solid #000; text-align:center; font-weight:bold; font-size:0.65rem;">${statusAda}</td>
        <td style="border:1px solid #000; text-align:center; font-weight:bold; font-size:0.65rem;">${statusTdk}</td>
        <td style="border:1px solid #000; padding:1px 3px; font-size:0.55rem;">${note}</td>
      </tr>`;
    if (i <= 14) leftTableRows += rowHtml;
    else rightTableRows += rowHtml;
  }

  const getPointersHtml = (part: string) =>
    rec.condition.damages
      .filter((d) => d.part === part)
      .map(
        (d) =>
          `<svg style="position:absolute;left:calc(${d.x}% - 6px);top:calc(${d.y}% - 6px);width:12px;height:12px;z-index:100;overflow:visible;" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#ff0000" stroke="#ffffff" stroke-width="2"/></svg>`
      )
      .join("");

  const getDamageLines = (part: string) => {
    const damages = rec.condition.damages.filter((d) => d.part === part);
    if (damages.length === 0) return "a. ....................................................";
    return damages
      .map((d, idx) => `${String.fromCharCode(97 + idx)}. ${escapeHtml(d.description)}`)
      .join("<br/>");
  };

  const fuel = rec.condition.fuelLevel || 0;
  const isE = fuel <= 12.5;
  const is14 = fuel > 12.5 && fuel <= 37.5;
  const is12 = fuel > 37.5 && fuel <= 62.5;
  const is34 = fuel > 62.5 && fuel <= 87.5;
  const isF = fuel > 87.5;

  return `
    <div class="official-inspection-print" style="width:100%; max-width:850px; margin:0 auto; background-color:white; color:black; padding:8px 12px; font-family:Arial,sans-serif; border:1px solid #000; box-sizing:border-box;">
      
      <!-- Header -->
      <div style="display:flex; align-items:center; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:6px;">
        <div style="width:70px;">
          <img src="${origin}/logo_pertamina_tk.png" alt="PTK" style="height:36px; width:auto; object-fit:contain;">
        </div>
        <div style="flex:1; text-align:center;">
          <h2 style="font-size:0.95rem; font-weight:800; text-transform:uppercase; margin:0; line-height:1.2;">PERTAMINA TRANS KONTINENTAL</h2>
          <h2 style="font-size:0.95rem; font-weight:800; text-transform:uppercase; margin:0; line-height:1.2;">INSPECTION CHECK LIST</h2>
          <h3 style="font-size:0.75rem; font-weight:700; margin:1px 0 0 0; text-decoration:underline; line-height:1.2;">Berita Acara Check List Kendaraan</h3>
        </div>
        <div style="width:70px;"></div>
      </div>

      <!-- Top Meta Box -->
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; margin-bottom:6px; font-size:0.68rem; text-align:center;">
        <tr style="background-color:#f0f0f0; font-weight:bold;">
          <td style="border:1px solid #000; width:25%; padding:3px;">Nama Driver</td>
          <td style="border:1px solid #000; width:45%; padding:3px;">Jenis Kendaraan / Nopol Kendaraan</td>
          <td style="border:1px solid #000; width:30%; padding:3px;">Kilometer Kendaraan (Awal / Akhir)</td>
        </tr>
        <tr style="font-weight:bold; height:24px;">
          <td style="border:1px solid #000; padding:3px;">${escapeHtml(rec.driver.name)}</td>
          <td style="border:1px solid #000; padding:3px;">${escapeHtml(rec.vehicle.type || "-")} / ${escapeHtml(rec.vehicle.licensePlate || "-")}</td>
          <td style="border:1px solid #000; padding:3px; line-height:1.2;">
            Awal: ${rec.vehicle.mileageStart ? rec.vehicle.mileageStart.toLocaleString() : "0"}<br/>
            Akhir: ${rec.vehicle.mileageEnd ? rec.vehicle.mileageEnd.toLocaleString() : "0"} KM
          </td>
        </tr>
      </table>

      <!-- 2 Columns Checklist Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
        
        <!-- Left Table (1-14) -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:0.6rem;">
          <thead>
            <tr style="background-color:#e0e0e0; font-weight:bold; text-align:center;">
              <th colspan="5" style="border:1px solid #000; padding:2px;">PERLENGKAPAN KENDARAAN (1-14)</th>
            </tr>
            <tr style="background-color:#f5f5f5; font-weight:bold; text-align:center;">
              <th style="border:1px solid #000; width:7%; padding:2px;">NO</th>
              <th style="border:1px solid #000; width:48%; padding:2px; text-align:left;">PERLENGKAPAN</th>
              <th style="border:1px solid #000; width:12%; padding:2px;">ADA</th>
              <th style="border:1px solid #000; width:12%; padding:2px;">TDK ADA</th>
              <th style="border:1px solid #000; width:21%; padding:2px;">KET</th>
            </tr>
          </thead>
          <tbody>${leftTableRows}</tbody>
        </table>

        <!-- Right Table (15-27) -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:0.6rem;">
          <thead>
            <tr style="background-color:#e0e0e0; font-weight:bold; text-align:center;">
              <th colspan="5" style="border:1px solid #000; padding:2px;">PERLENGKAPAN KENDARAAN (15-27)</th>
            </tr>
            <tr style="background-color:#f5f5f5; font-weight:bold; text-align:center;">
              <th style="border:1px solid #000; width:7%; padding:2px;">NO</th>
              <th style="border:1px solid #000; width:48%; padding:2px; text-align:left;">PERLENGKAPAN</th>
              <th style="border:1px solid #000; width:12%; padding:2px;">ADA</th>
              <th style="border:1px solid #000; width:12%; padding:2px;">TDK ADA</th>
              <th style="border:1px solid #000; width:21%; padding:2px;">KET</th>
            </tr>
          </thead>
          <tbody>${rightTableRows}</tbody>
        </table>

      </div>

      <!-- Physical Condition Box -->
      <div style="border:1px solid #000; margin-bottom:6px; padding:4px 6px;">
        <div style="font-size:0.7rem; font-weight:bold; text-align:center; text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:4px; background-color:#f0f0f0;">
          KONDISI KENDARAAN (FISIK)
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.62rem; line-height:1.2;">
          
          <!-- 1. Body Depan -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed #ccc; padding-bottom:3px;">
            <div style="flex:1;">
              <strong>1. Body Depan</strong><br/>
              ${getDamageLines("body_depan")}
            </div>
            <div style="width:45px; height:45px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_front.png" alt="Depan" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_depan")}
            </div>
          </div>

          <!-- 2. Body Samping Kiri -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed #ccc; padding-bottom:3px;">
            <div style="flex:1;">
              <strong>2. Body Samping Kiri</strong><br/>
              ${getDamageLines("body_samping_kiri")}
            </div>
            <div style="width:45px; height:45px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_left.png" alt="Kiri" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_samping_kiri")}
            </div>
          </div>

          <!-- 3. Body Samping Kanan -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-top:2px;">
            <div style="flex:1;">
              <strong>3. Body Samping Kanan</strong><br/>
              ${getDamageLines("body_samping_kanan")}
            </div>
            <div style="width:45px; height:45px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_right.png" alt="Kanan" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_samping_kanan")}
            </div>
          </div>

          <!-- 4. Body Belakang -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-top:2px;">
            <div style="flex:1;">
              <strong>4. Body Belakang</strong><br/>
              ${getDamageLines("body_belakang")}
            </div>
            <div style="width:45px; height:45px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_rear.png" alt="Belakang" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_belakang")}
            </div>
          </div>

        </div>

        <!-- Fuel Gauge Bar -->
        <div style="border-top:1px solid #000; margin-top:4px; padding-top:3px; display:flex; justify-content:space-between; align-items:center; font-size:0.65rem;">
          <div><strong>Level Bahan Bakar:</strong> ${rec.condition.fuelLevel}%</div>
          <div style="font-weight:bold; letter-spacing:2px;">
            <span style="${isE ? "color:red; text-decoration:underline;" : "color:#666;"}">E</span>
            &nbsp;
            <span style="${is14 ? "color:red; text-decoration:underline;" : "color:#666;"}">1/4</span>
            &nbsp;
            <span style="${is12 ? "color:red; text-decoration:underline;" : "color:#666;"}">1/2</span>
            &nbsp;
            <span style="${is34 ? "color:red; text-decoration:underline;" : "color:#666;"}">3/4</span>
            &nbsp;
            <span style="${isF ? "color:red; text-decoration:underline;" : "color:#666;"}">F</span>
          </div>
        </div>

      </div>

      <!-- Notes & Attention Box -->
      <div style="font-size:0.62rem; line-height:1.25; margin-bottom:6px;">
        <strong>Perhatian !</strong><br/>
        1. Perlengkapan/kondisi mobil harus jelas perinciannya.<br/>
        2. Driver bertanggung jawab atas kelengkapan dan alat-alat kendaraan yang ada.<br/>
        3. Driver bertanggung jawab atas KEBERSIHAN kendaraan Setiap harinya.<br/>
        <strong>Catatan :</strong><br/>
        1. ${escapeHtml(rec.condition.notes?.[0] || "")}<br/>
        2. ${escapeHtml(rec.condition.notes?.[1] || "")}<br/>
        3. ${escapeHtml(rec.condition.notes?.[2] || "")}
      </div>

      <!-- Footer Signatures Grid -->
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:0.65rem; text-align:center; table-layout:fixed;">
        <tr style="height:55px;">
          <td style="border:1px solid #000; width:26%; padding:2px; vertical-align:top; text-align:left;">
            <strong>Tanggal Pemeriksaan Kendaraan:</strong><br/>
            <div style="margin-top:14px; font-weight:bold;">${dateFormatted}</div>
          </td>
          <td style="border:1px solid #000; width:28%; padding:2px; vertical-align:top; text-align:left; position:relative;">
            <strong>Nama & Tanda Tangan Driver:</strong><br/>
            ${
              rec.signature
                ? `<img src="${rec.signature}" alt="TTD" style="max-height:28px; max-width:80px; object-fit:contain; margin-top:2px;"/>`
                : ""
            }
            <div style="position:absolute; bottom:2px; left:4px; font-weight:bold;">( ${escapeHtml(rec.driver.name)} )</div>
          </td>
          <td style="border:1px solid #000; width:23%; padding:2px; vertical-align:top; text-align:left; position:relative;">
            <strong>Mengetahui Koordinator Kendaraan:</strong><br/>
            <div style="position:absolute; bottom:2px; left:4px;">( ______________ )</div>
          </td>
          <td style="border:1px solid #000; width:23%; padding:2px; vertical-align:top; text-align:left; position:relative;">
            <strong>Mengetahui Asset Management:</strong><br/>
            <div style="position:absolute; bottom:2px; left:4px;">( ______________ )</div>
          </td>
        </tr>
      </table>

    </div>
  `;
}

function getPartLabel(part: string): string {
  const labels: Record<string, string> = {
    body_depan: "Depan",
    body_samping_kiri: "Kiri",
    body_samping_kanan: "Kanan",
    body_belakang: "Belakang",
  };
  return labels[part] || part;
}

const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function prepareTimesheetPrintMarkup(
  logs: DriverLogEntry[],
  driverName: string,
  driverNik: string,
  month: number,
  year: number
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const daysInMonth = new Date(year, month, 0).getDate();
  let tableRowsHtml = "";

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayName = INDO_DAYS[dateObj.getDay()];

    const matchedLog = logs.find(
      (l) => l.logDate.startsWith(dateStr) || l.logDate === dateStr
    );

    const plate = matchedLog ? escapeHtml(matchedLog.licensePlate) : "";
    const workStart = matchedLog ? escapeHtml(matchedLog.workStart) : "";
    const workEnd = matchedLog ? escapeHtml(matchedLog.workEnd) : "";
    const kmStart =
      matchedLog && matchedLog.kmStart ? matchedLog.kmStart.toLocaleString() : "";
    const kmEnd =
      matchedLog && matchedLog.kmEnd ? matchedLog.kmEnd.toLocaleString() : "";
    const kmTotal =
      matchedLog && matchedLog.kmEnd && matchedLog.kmStart && matchedLog.kmEnd >= matchedLog.kmStart
        ? (matchedLog.kmEnd - matchedLog.kmStart).toLocaleString()
        : "";
    const userName = matchedLog ? escapeHtml(matchedLog.userName) : "";
    const userSig =
      matchedLog && matchedLog.userSignature
        ? `<img src="${matchedLog.userSignature}" alt="TTD" style="max-height:20px; max-width:60px; object-fit:contain; display:block; margin:0 auto;"/>`
        : "";
    const remark = matchedLog ? escapeHtml(matchedLog.remark) : "";

    tableRowsHtml += `
      <tr style="height:14px;">
        <td style="border:1px solid #000; padding:0px 2px; text-align:center; font-weight:bold;">${d}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${dayName}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${plate}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${workStart}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${workEnd}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${kmStart}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${kmEnd}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center; font-weight:bold;">${kmTotal}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${userName}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center; vertical-align:middle;">${userSig}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:left;">${remark}</td>
      </tr>`;
  }

  return `
    <div class="official-timesheet-print" style="width:100%; max-width:960px; margin:0 auto; background-color:white; color:black; padding:4px 8px; font-family:Arial,sans-serif; box-sizing:border-box;">
      
      <!-- Top Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${origin}/logo_pertamina_tk.png" alt="Pertamina Trans Kontinental" style="height:28px; width:auto; object-fit:contain;">
        </div>
        <div style="font-size:0.7rem; font-weight:bold; text-align:right;">
          Tahun (Year): <span style="border-bottom:1px solid #000; padding:0 8px; display:inline-block;">${year}</span>
          &nbsp;&nbsp;&nbsp;&nbsp;
          Bulan (Month): <span style="border-bottom:1px solid #000; padding:0 8px; display:inline-block;">${MONTH_NAMES[month - 1]}</span>
        </div>
      </div>

      <!-- Driver Metadata -->
      <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:5px;">
        <div style="width:48%;">
          Nama Driver (Driver's Name): 
          <div style="border-bottom:1px solid #000; min-height:14px; width:100%; font-weight:normal; margin-top:1px;">${escapeHtml(driverName)}</div>
        </div>
        <div style="width:48%;">
          NIK Driver (Driver's NIK): 
          <div style="border-bottom:1px solid #000; min-height:14px; width:100%; font-weight:normal; margin-top:1px;">${escapeHtml(driverNik)}</div>
        </div>
      </div>

      <!-- Timesheet Grid Table -->
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:0.53rem; table-layout:fixed; line-height:1.1;">
        <thead>
          <tr style="background-color:#ffffff; text-align:center; font-weight:bold;">
            <th rowspan="2" style="border:1px solid #000; width:4.5%; padding:1px 1px;">Tanggal<br/><span style="font-weight:normal;font-size:0.48rem;">(Date)</span></th>
            <th rowspan="2" style="border:1px solid #000; width:6.5%; padding:1px 1px;">Hari<br/><span style="font-weight:normal;font-size:0.48rem;">(Day)</span></th>
            <th rowspan="2" style="border:1px solid #000; width:10%; padding:1px 1px;">Nomer Polisi<br/><span style="font-weight:normal;font-size:0.48rem;">(Vehicle Number)</span></th>
            <th colspan="2" style="border:1px solid #000; padding:1px 1px;">Jam Kerja<br/><span style="font-weight:normal;font-size:0.48rem;">(Working Hour)</span></th>
            <th colspan="3" style="border:1px solid #000; padding:1px 1px;">KM<br/><span style="font-weight:normal;font-size:0.48rem;">(Kilometer)</span></th>
            <th colspan="2" style="border:1px solid #000; padding:1px 1px;">Pemakai<br/><span style="font-weight:normal;font-size:0.48rem;">(User)</span></th>
            <th rowspan="2" style="border:1px solid #000; width:13.5%; padding:1px 1px;">Keterangan<br/><span style="font-weight:normal;font-size:0.48rem;">(Remark)</span></th>
          </tr>
          <tr style="background-color:#ffffff; text-align:center; font-weight:bold;">
            <th style="border:1px solid #000; width:6.5%; padding:1px 1px;">Awal<br/><span style="font-weight:normal;font-size:0.48rem;">(Start)</span></th>
            <th style="border:1px solid #000; width:6.5%; padding:1px 1px;">Akhir<br/><span style="font-weight:normal;font-size:0.48rem;">(Finish)</span></th>
            <th style="border:1px solid #000; width:7.5%; padding:1px 1px;">Awal<br/><span style="font-weight:normal;font-size:0.48rem;">(Start)</span></th>
            <th style="border:1px solid #000; width:7.5%; padding:1px 1px;">Akhir<br/><span style="font-weight:normal;font-size:0.48rem;">(Finish)</span></th>
            <th style="border:1px solid #000; width:7.5%; padding:1px 1px;">Jumlah<br/><span style="font-weight:normal;font-size:0.48rem;">(Total)</span></th>
            <th style="border:1px solid #000; width:14%; padding:1px 1px;">Nama<br/><span style="font-weight:normal;font-size:0.48rem;">(Name)</span></th>
            <th style="border:1px solid #000; width:14%; padding:1px 1px;">Tanda Tangan<br/><span style="font-weight:normal;font-size:0.48rem;">(Signature)</span></th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Bottom 3 Sign-off Boxes -->
      <table style="width:100%; border-collapse:collapse; margin-top:6px; border:1px solid #000; font-size:0.65rem; text-align:center; table-layout:fixed;">
        <tr>
          <td style="border:1px solid #000; width:33.33%; padding:4px 6px; height:52px; vertical-align:top;">
            <strong style="display:block; margin-bottom:2px;">Dibuat Oleh</strong>
          </td>
          <td style="border:1px solid #000; width:33.33%; padding:4px 6px; height:52px; vertical-align:top;">
            <strong style="display:block; margin-bottom:2px;">Disetujui Oleh</strong>
          </td>
          <td style="border:1px solid #000; width:33.33%; padding:4px 6px; height:52px; vertical-align:top;">
            <strong style="display:block; margin-bottom:2px;">Diterima Oleh</strong>
          </td>
        </tr>
        <tr>
          <td style="border:1px solid #000; padding:3px 6px; text-align:left;">
            Nama: ${escapeHtml(driverName)}
          </td>
          <td style="border:1px solid #000; padding:3px 6px; text-align:left;">
            Nama:
          </td>
          <td style="border:1px solid #000; padding:3px 6px; text-align:left;">
            Nama:
          </td>
        </tr>
      </table>

    </div>
  `;
}

