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

export function exportMonthlyLogExcel(
  logs: DriverLogEntry[],
  customFileName?: string
): void {
  if (logs.length === 0) {
    alert("Tidak ada data log timesheet untuk diekspor.");
    return;
  }
  const rows = logs.map((l, idx) => ({
    No: idx + 1,
    Tanggal: l.logDate,
    Hari: l.logDay,
    "Nama Driver": l.driverName,
    "NIP Driver": l.driverNik || "-",
    Nopol: l.licensePlate,
    "Jam Kerja": `${l.workStart} - ${l.workEnd}`,
    "KM Awal": l.kmStart,
    "KM Akhir": l.kmEnd,
    "Total Jarak (KM)": Math.max(0, l.kmEnd - l.kmStart),
    Pemakai: l.userName,
    Keterangan: l.remark || "-",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet Driver");
  XLSX.writeFile(wb, customFileName || "PTK_Timesheet_Driver.xlsx");
}

export function preparePrintMarkup(rec: InspectionRecord, highlightMode = false): string {
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
    const isMissing = item.status === "TDK ADA";
    const note = escapeHtml(item.note || "");
    const bgStyle = highlightMode && isMissing ? "background-color:#fee2e2; color:#991b1b;" : "";
    const rowHtml = `
      <tr style="${bgStyle}">
        <td style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:22px; font-size:10px; font-weight:bold; padding:2px 0;">${i}</div>
        </td>
        <td style="border:1px solid #000; padding:0; vertical-align:middle;">
          <div style="display:flex; align-items:center; min-height:22px; font-size:9.5px; line-height:1.1; text-transform:uppercase; padding:2px 6px;">${escapeHtml(item.item)}</div>
        </td>
        <td style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:22px; font-size:12px; font-weight:bold; padding:2px 0; ${highlightMode && item.status === "ADA" ? "color:#15803d;" : ""}">${statusAda}</div>
        </td>
        <td style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:22px; font-size:12px; font-weight:bold; padding:2px 0; ${highlightMode && isMissing ? "color:#dc2626;" : ""}">${statusTdk}</div>
        </td>
        <td style="border:1px solid #000; padding:0; vertical-align:middle;">
          <div style="display:flex; align-items:center; min-height:22px; font-size:9px; line-height:1.1; padding:2px 4px; ${highlightMode && isMissing ? "font-weight:bold;" : ""}">${note}</div>
        </td>
      </tr>`;
    if (i <= 14) leftTableRows += rowHtml;
    else rightTableRows += rowHtml;
  }

  const getPointersHtml = (part: string) =>
    rec.condition.damages
      .filter((d) => d.part === part)
      .map(
        (d) =>
          `<svg style="position:absolute;left:calc(${d.x}% - 6px);top:calc(${d.y}% - 6px);width:12px;height:12px;z-index:100;overflow:visible;" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#ff0000" stroke="#ffffff" stroke-width="2"/><circle cx="10" cy="10" r="12" fill="none" stroke="#ff0000" stroke-width="1.5" opacity="0.6"/></svg>`
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
    <div class="official-inspection-print" style="width:100%; max-width:820px; margin:0 auto; background-color:white; color:black; padding:10px 14px; font-family:Arial,sans-serif; border:1px solid #000; box-sizing:border-box;">
      
      <!-- Header -->
      <div style="display:flex; align-items:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
        <div style="width:75px;">
          <img src="${origin}/logo_pertamina_tk.png" alt="PTK" style="height:36px; width:auto; object-fit:contain;">
        </div>
        <div style="flex:1; text-align:center;">
          <h2 style="font-size:15px; font-weight:800; text-transform:uppercase; margin:0; line-height:1.2;">PERTAMINA TRANS KONTINENTAL</h2>
          <h2 style="font-size:15px; font-weight:800; text-transform:uppercase; margin:0; line-height:1.2;">INSPECTION CHECK LIST</h2>
          <h3 style="font-size:12px; font-weight:700; margin:3px 0 0 0; text-decoration:underline; line-height:1.2;">Berita Acara Check List Kendaraan</h3>
        </div>
        <div style="width:75px;"></div>
      </div>

      <!-- Top Meta Box -->
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; margin-bottom:8px; font-size:11px; text-align:center;">
        <tr style="background-color:#f0f0f0; font-weight:bold;">
          <td style="border:1px solid #000; width:25%; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center; justify-content:center; min-height:26px; padding:2px 4px; font-size:11px; font-weight:bold;">Nama Driver</div>
          </td>
          <td style="border:1px solid #000; width:45%; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center; justify-content:center; min-height:26px; padding:2px 4px; font-size:11px; font-weight:bold;">Jenis Kendaraan / Nopol Kendaraan</div>
          </td>
          <td style="border:1px solid #000; width:30%; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center; justify-content:center; min-height:26px; padding:2px 4px; font-size:11px; font-weight:bold;">Kilometer Kendaraan (Awal / Akhir)</div>
          </td>
        </tr>
        <tr style="font-weight:bold;">
          <td style="border:1px solid #000; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center; justify-content:center; min-height:30px; padding:4px; font-size:12px;">${escapeHtml(rec.driver.name)}</div>
          </td>
          <td style="border:1px solid #000; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center; justify-content:center; min-height:30px; padding:4px; font-size:12px;">${escapeHtml(rec.vehicle.type || "-")} / ${escapeHtml(rec.vehicle.licensePlate || "-")}</div>
          </td>
          <td style="border:1px solid #000; padding:0; vertical-align:middle;">
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:30px; padding:4px; font-size:10px; line-height:1.2;">
              <div>Awal: ${rec.vehicle.mileageStart ? rec.vehicle.mileageStart.toLocaleString() : "0"}</div>
              <div>Akhir: ${rec.vehicle.mileageEnd ? rec.vehicle.mileageEnd.toLocaleString() : "0"} KM</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- 2 Columns Checklist Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        
        <!-- Left Table (1-14) -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:10px;">
          <thead>
            <tr style="background-color:#e0e0e0; font-weight:bold; text-align:center;">
              <th colspan="5" style="border:1px solid #000; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; padding:2px 4px; font-size:10px; font-weight:bold;">PERLENGKAPAN KENDARAAN (1-14)</div>
              </th>
            </tr>
            <tr style="background-color:#f5f5f5; font-weight:bold; text-align:center;">
              <th style="border:1px solid #000; width:7%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">NO</div>
              </th>
              <th style="border:1px solid #000; width:48%; padding:0; text-align:left; vertical-align:middle;">
                <div style="display:flex; align-items:center; min-height:24px; padding:0 6px; font-size:10px; font-weight:bold;">PERLENGKAPAN</div>
              </th>
              <th style="border:1px solid #000; width:12%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">ADA</div>
              </th>
              <th style="border:1px solid #000; width:12%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">TDK ADA</div>
              </th>
              <th style="border:1px solid #000; width:21%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">KET</div>
              </th>
            </tr>
          </thead>
          <tbody>${leftTableRows}</tbody>
        </table>

        <!-- Right Table (15-27) -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:10px;">
          <thead>
            <tr style="background-color:#e0e0e0; font-weight:bold; text-align:center;">
              <th colspan="5" style="border:1px solid #000; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; padding:2px 4px; font-size:10px; font-weight:bold;">PERLENGKAPAN KENDARAAN (15-27)</div>
              </th>
            </tr>
            <tr style="background-color:#f5f5f5; font-weight:bold; text-align:center;">
              <th style="border:1px solid #000; width:7%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">NO</div>
              </th>
              <th style="border:1px solid #000; width:48%; padding:0; text-align:left; vertical-align:middle;">
                <div style="display:flex; align-items:center; min-height:24px; padding:0 6px; font-size:10px; font-weight:bold;">PERLENGKAPAN</div>
              </th>
              <th style="border:1px solid #000; width:12%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">ADA</div>
              </th>
              <th style="border:1px solid #000; width:12%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">TDK ADA</div>
              </th>
              <th style="border:1px solid #000; width:21%; padding:0; vertical-align:middle;">
                <div style="display:flex; align-items:center; justify-content:center; min-height:24px; font-size:10px; font-weight:bold;">KET</div>
              </th>
            </tr>
          </thead>
          <tbody>${rightTableRows}</tbody>
        </table>

      </div>

      <!-- Physical Condition Box -->
      <div style="border:1px solid #000; margin-bottom:8px; padding:6px 8px;">
        <div style="font-size:11px; font-weight:bold; text-align:center; text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:3px; margin-bottom:6px; background-color:#f0f0f0;">
          KONDISI KENDARAAN (FISIK)
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:10px; line-height:1.25;">
          
          <!-- 1. Body Depan -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed #ccc; padding-bottom:4px;">
            <div style="flex:1; padding-right:4px;">
              <strong>1. Body Depan</strong><br/>
              ${getDamageLines("body_depan")}
            </div>
            <div style="width:48px; height:48px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_front.png" alt="Depan" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_depan")}
            </div>
          </div>

          <!-- 2. Body Samping Kiri -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed #ccc; padding-bottom:4px;">
            <div style="flex:1; padding-right:4px;">
              <strong>2. Body Samping Kiri</strong><br/>
              ${getDamageLines("body_samping_kiri")}
            </div>
            <div style="width:48px; height:48px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_left.png" alt="Kiri" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_samping_kiri")}
            </div>
          </div>

          <!-- 3. Body Samping Kanan -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-top:4px;">
            <div style="flex:1; padding-right:4px;">
              <strong>3. Body Samping Kanan</strong><br/>
              ${getDamageLines("body_samping_kanan")}
            </div>
            <div style="width:48px; height:48px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_right.png" alt="Kanan" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_samping_kanan")}
            </div>
          </div>

          <!-- 4. Body Belakang -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-top:4px;">
            <div style="flex:1; padding-right:4px;">
              <strong>4. Body Belakang</strong><br/>
              ${getDamageLines("body_belakang")}
            </div>
            <div style="width:48px; height:48px; position:relative; background:#fafafa; border:1px solid #eee; flex-shrink:0;">
              <img src="${origin}/car_rear.png" alt="Belakang" style="width:100%; height:100%; object-fit:contain;">
              ${getPointersHtml("body_belakang")}
            </div>
          </div>

        </div>

        <!-- Fuel Gauge Bar -->
        <div style="border-top:1px solid #000; margin-top:6px; padding-top:4px; display:flex; justify-content:space-between; align-items:center; font-size:10px;">
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
      <div style="font-size:10px; line-height:1.3; margin-bottom:8px;">
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
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:10px; text-align:center; table-layout:fixed;">
        <tr>
          <td style="border:1px solid #000; width:26%; padding:0; vertical-align:top; text-align:left;">
            <div style="padding:6px; min-height:65px; box-sizing:border-box;">
              <div style="font-weight:bold; font-size:10px;">Tanggal Pemeriksaan:</div>
              <div style="margin-top:14px; font-weight:bold; font-size:10px;">${dateFormatted}</div>
            </div>
          </td>
          <td style="border:1px solid #000; width:28%; padding:0; vertical-align:top; text-align:left;">
            <div style="padding:6px; min-height:65px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
              <div>
                <strong style="font-size:10px;">Nama & Tanda Tangan Driver:</strong>
                ${
                  rec.signature
                    ? `<div style="margin-top:2px;"><img src="${rec.signature}" alt="TTD" style="max-height:26px; max-width:80px; object-fit:contain;"/></div>`
                    : ""
                }
              </div>
              <div style="font-weight:bold; font-size:10px; margin-top:6px;">( ${escapeHtml(rec.driver.name)} )</div>
            </div>
          </td>
          <td style="border:1px solid #000; width:23%; padding:0; vertical-align:top; text-align:left;">
            <div style="padding:6px; min-height:65px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
              <strong style="font-size:10px;">Mengetahui Koordinator:</strong>
              <div style="font-size:10px; margin-top:6px;">( ______________ )</div>
            </div>
          </td>
          <td style="border:1px solid #000; width:23%; padding:0; vertical-align:top; text-align:left;">
            <div style="padding:6px; min-height:65px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
              <strong style="font-size:10px;">Mengetahui Asset Mgt:</strong>
              <div style="font-size:10px; margin-top:6px;">( ______________ )</div>
            </div>
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
    let kmStartStr = "";
    let kmEndStr = "";
    let kmTotalStr = "";

    if (matchedLog) {
      const startNum = Number(matchedLog.kmStart);
      const endNum = Number(matchedLog.kmEnd);

      const hasStart =
        matchedLog.kmStart !== null &&
        matchedLog.kmStart !== undefined &&
        !isNaN(startNum);
      const hasEnd =
        matchedLog.kmEnd !== null &&
        matchedLog.kmEnd !== undefined &&
        !isNaN(endNum);

      if (hasStart) kmStartStr = startNum.toLocaleString("id-ID");
      if (hasEnd) kmEndStr = endNum.toLocaleString("id-ID");
      if (hasStart && hasEnd) {
        kmTotalStr = Math.max(0, endNum - startNum).toLocaleString("id-ID");
      }
    }
    const userName = matchedLog ? escapeHtml(matchedLog.userName) : "";
    const userSig =
      matchedLog && matchedLog.userSignature
        ? `<img src="${matchedLog.userSignature}" alt="TTD" style="max-height:14px; max-width:55px; object-fit:contain; display:block; margin:0 auto;"/>`
        : "";
    const remark = matchedLog ? escapeHtml(matchedLog.remark) : "";

    tableRowsHtml += `
      <tr>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-weight:bold; font-size:8px; line-height:1.2; padding:1px 0;">${d}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${dayName}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${plate}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${workStart}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${workEnd}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${kmStartStr}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 0;">${kmEndStr}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-weight:bold; font-size:8px; line-height:1.2; padding:1px 0;">${kmTotalStr}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; font-size:8px; line-height:1.2; padding:1px 3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userName}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:17px; padding:1px 2px;">${userSig}</div>
        </td>
        <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
          <div style="display:flex; align-items:center; justify-content:flex-start; min-height:17px; font-size:8px; line-height:1.2; padding:1px 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${remark}</div>
        </td>
      </tr>`;
  }

  return `
    <div class="official-timesheet-print" style="width:1060px; margin:0 auto; background-color:#ffffff; color:#000000; padding:8px 12px; font-family:Arial,Helvetica,sans-serif; box-sizing:border-box;">
      
      <!-- Top Header -->
      <table style="width:100%; border-collapse:separate; border-spacing:0; margin-bottom:6px; padding-bottom:4px; border-bottom:2px solid #000000;">
        <tr>
          <td style="vertical-align:middle; text-align:left;">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${origin}/logo_pertamina_tk.png" alt="Pertamina Trans Kontinental" style="height:28px; width:auto; object-fit:contain; display:block;">
              <div style="font-size:12.5px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; line-height:1.2;">DRIVER DAILY TIMESHEET / REKAP HARIAN</div>
            </div>
          </td>
          <td style="vertical-align:middle; text-align:right; font-size:10px; font-weight:bold; white-space:nowrap;">
            <div style="display:inline-flex; align-items:center; gap:16px;">
              <div>
                Tahun:&nbsp;<span style="display:inline-block; border-bottom:1.5px solid #000; min-width:40px; text-align:center; padding:0 4px; line-height:1.2;">${year}</span>
              </div>
              <div>
                Bulan:&nbsp;<span style="display:inline-block; border-bottom:1.5px solid #000; min-width:65px; text-align:center; padding:0 4px; line-height:1.2;">${MONTH_NAMES[month - 1]}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Driver Metadata -->
      <table style="width:100%; border-collapse:separate; border-spacing:0; font-size:9.5px; font-weight:bold; margin-bottom:6px;">
        <tr>
          <td style="width:48%; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center;">
              <span style="white-space:nowrap;">Nama Driver (Driver's Name):&nbsp;</span>
              <span style="flex:1; border-bottom:1.5px solid #000; font-weight:normal; padding-left:4px; min-height:15px; display:flex; align-items:center; line-height:1.2;">${escapeHtml(driverName)}</span>
            </div>
          </td>
          <td style="width:4%;"></td>
          <td style="width:48%; padding:0; vertical-align:middle;">
            <div style="display:flex; align-items:center;">
              <span style="white-space:nowrap;">NIP Driver (Driver's NIP):&nbsp;</span>
              <span style="flex:1; border-bottom:1.5px solid #000; font-weight:normal; padding-left:4px; min-height:15px; display:flex; align-items:center; line-height:1.2;">${escapeHtml(driverNik || "-")}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Timesheet Grid Table -->
      <table style="width:100%; border-collapse:separate; border-spacing:0; border-top:1px solid #000000; border-left:1px solid #000000; font-size:8px; table-layout:fixed; line-height:1.1;">
        <colgroup>
          <col style="width:3.5%;" />
          <col style="width:6.0%;" />
          <col style="width:9.5%;" />
          <col style="width:5.5%;" />
          <col style="width:5.5%;" />
          <col style="width:7.0%;" />
          <col style="width:7.0%;" />
          <col style="width:6.0%;" />
          <col style="width:14.5%;" />
          <col style="width:13.0%;" />
          <col style="width:22.5%;" />
        </colgroup>
        <thead>
          <tr style="background-color:#f1f5f9; text-align:center; font-weight:bold;">
            <th rowspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:28px; font-size:7.5px; padding:2px 1px;">
                <span>Tgl</span><span style="font-weight:normal;font-size:6.5px;">(Date)</span>
              </div>
            </th>
            <th rowspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:28px; font-size:7.5px; padding:2px 1px;">
                <span>Hari</span><span style="font-weight:normal;font-size:6.5px;">(Day)</span>
              </div>
            </th>
            <th rowspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:28px; font-size:7.5px; padding:2px 1px;">
                <span>No Polisi</span><span style="font-weight:normal;font-size:6.5px;">(Plate No)</span>
              </div>
            </th>
            <th colspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7.5px; padding:1px;">
                <span>Jam Kerja</span><span style="font-weight:normal;font-size:6.5px;">(Working Hour)</span>
              </div>
            </th>
            <th colspan="3" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7.5px; padding:1px;">
                <span>Kilometer</span><span style="font-weight:normal;font-size:6.5px;">(KM)</span>
              </div>
            </th>
            <th colspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7.5px; padding:1px;">
                <span>Pemakai</span><span style="font-weight:normal;font-size:6.5px;">(User)</span>
              </div>
            </th>
            <th rowspan="2" style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:28px; font-size:7.5px; padding:2px 1px;">
                <span>Keterangan</span><span style="font-weight:normal;font-size:6.5px;">(Remark)</span>
              </div>
            </th>
          </tr>
          <tr style="background-color:#f1f5f9; text-align:center; font-weight:bold;">
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Awal</span><span style="font-weight:normal;font-size:6px;">(Start)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Akhir</span><span style="font-weight:normal;font-size:6px;">(Finish)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Awal</span><span style="font-weight:normal;font-size:6px;">(Start)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Akhir</span><span style="font-weight:normal;font-size:6px;">(Finish)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Jumlah</span><span style="font-weight:normal;font-size:6px;">(Total)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Nama</span><span style="font-weight:normal;font-size:6px;">(Name)</span>
              </div>
            </th>
            <th style="border-right:1px solid #000; border-bottom:1px solid #000; padding:0; vertical-align:middle;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:14px; font-size:7px; padding:1px;">
                <span>Tanda Tangan</span><span style="font-weight:normal;font-size:6px;">(Signature)</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Bottom 3 Sign-off Boxes -->
      <table style="width:100%; border-collapse:separate; border-spacing:0; margin-top:6px; border-top:1px solid #000000; border-left:1px solid #000000; font-size:8px; text-align:center; table-layout:fixed;">
        <tr>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; width:33.33%; padding:4px 6px; height:44px; vertical-align:top; text-align:left;">
            <strong style="display:block; font-size:8.5px; margin-bottom:1px;">Dibuat Oleh:</strong>
          </td>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; width:33.33%; padding:4px 6px; height:44px; vertical-align:top; text-align:left;">
            <strong style="display:block; font-size:8.5px; margin-bottom:1px;">Disetujui Oleh:</strong>
          </td>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; width:33.33%; padding:4px 6px; height:44px; vertical-align:top; text-align:left;">
            <strong style="display:block; font-size:8.5px; margin-bottom:1px;">Diterima Oleh:</strong>
          </td>
        </tr>
        <tr>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:2px 6px; text-align:left; font-size:8.5px; height:18px; vertical-align:middle;">
            Nama: <strong>${escapeHtml(driverName)}</strong>
          </td>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:2px 6px; text-align:left; font-size:8.5px; height:18px; vertical-align:middle;">
            Nama:
          </td>
          <td style="border-right:1px solid #000; border-bottom:1px solid #000; padding:2px 6px; text-align:left; font-size:8.5px; height:18px; vertical-align:middle;">
            Nama:
          </td>
        </tr>
      </table>

    </div>
  `;
}

export async function downloadChecklistPDFDirect(
  rec: InspectionRecord,
  element?: HTMLElement | null
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let html2pdfModule: any;
    try {
      html2pdfModule = require("html2pdf.js");
    } catch {
      html2pdfModule = await import("html2pdf.js");
    }
    const html2pdf = html2pdfModule?.default || (window as any).html2pdf || html2pdfModule;

    if (typeof html2pdf !== "function") {
      throw new Error("html2pdf module function is not available.");
    }

    let target: HTMLElement;
    let tempContainer: HTMLElement | null = null;

    if (element) {
      target = element;
    } else {
      const markup = preparePrintMarkup(rec, false);
      tempContainer = document.createElement("div");
      tempContainer.id = "pdf-checklist-temp-render";
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.width = "850px";
      tempContainer.style.zIndex = "999999";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.opacity = "1";
      tempContainer.style.pointerEvents = "none";
      tempContainer.innerHTML = markup;
      document.body.appendChild(tempContainer);
      target = (tempContainer.firstElementChild as HTMLElement) || tempContainer;

      // Wait for images to load if dynamically appended
      const images = Array.from(target.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Short delay for fonts and vectors to settle
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const safeDriver = (rec.driver?.name || "Driver").replace(/\s+/g, "_");
    const safePlate = (rec.vehicle?.licensePlate || "NoPol").replace(/\s+/g, "_");
    const fileName = `Checklist_${safeDriver}_${safePlate}.pdf`;

    const opt = {
      margin: [5, 5, 5, 5],
      filename: fileName,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 850,
        scrollY: 0,
        scrollX: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: "avoid-all" },
    };

    await html2pdf().set(opt).from(target).save();

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.error("PDF generation error:", err);
    const temp = document.getElementById("pdf-checklist-temp-render");
    if (temp && document.body.contains(temp)) {
      document.body.removeChild(temp);
    }
    alert("Terjadi kendala saat unduh PDF otomatis. Membuka jendela cetak sebagai alternatif...");
    const win = window.open("", "_blank");
    if (win) {
      const safeDriver = (rec.driver?.name || "Driver").replace(/\s+/g, "_");
      const safePlate = (rec.vehicle?.licensePlate || "NoPol").replace(/\s+/g, "_");
      const fileName = `Checklist_${safeDriver}_${safePlate}`;
      win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${fileName}</title><style>* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; padding: 0; background: white; } @media print { @page { size: A4 portrait; margin: 5mm; } body { margin: 0; } }</style></head><body>${preparePrintMarkup(rec, false)}<script>window.onload=function(){window.focus();setTimeout(function(){window.print();window.onafterprint=function(){window.close();};setTimeout(function(){window.close();},2000);},400);};<\/script></body></html>`);
      win.document.close();
    }
  }
}

export async function downloadTimesheetPDFDirect(
  logs: DriverLogEntry[],
  driverName: string,
  driverNik: string,
  month: number,
  year: number
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let html2pdfModule: any;
    try {
      html2pdfModule = require("html2pdf.js");
    } catch {
      html2pdfModule = await import("html2pdf.js");
    }
    const html2pdf =
      html2pdfModule?.default || (window as any).html2pdf || html2pdfModule;

    if (typeof html2pdf !== "function") {
      throw new Error("html2pdf module function is not available.");
    }

    const markup = prepareTimesheetPrintMarkup(
      logs,
      driverName,
      driverNik,
      month,
      year
    );

    const tempContainer = document.createElement("div");
    tempContainer.id = "pdf-timesheet-temp-render";
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "0";
    tempContainer.style.top = "0";
    tempContainer.style.width = "1060px";
    tempContainer.style.zIndex = "999999";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.style.opacity = "1";
    tempContainer.style.pointerEvents = "none";
    tempContainer.innerHTML = markup;
    document.body.appendChild(tempContainer);
    const target =
      (tempContainer.firstElementChild as HTMLElement) || tempContainer;

    // Wait for images (such as signatures and logo) to load
    const images = Array.from(target.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // Short delay for layout to settle
    await new Promise((resolve) => setTimeout(resolve, 250));

    const safeDriver = (driverName || "Driver").replace(/\s+/g, "_");
    const fileName = `Timesheet_${safeDriver}_${String(month).padStart(2, "0")}_${year}.pdf`;

    const opt = {
      margin: [5, 5, 5, 5],
      filename: fileName,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1060,
        scrollY: 0,
        scrollX: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      pagebreak: { mode: "avoid-all" },
    };

    await html2pdf().set(opt).from(target).save();

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.error("PDF generation error:", err);
    const temp = document.getElementById("pdf-timesheet-temp-render");
    if (temp && document.body.contains(temp)) {
      document.body.removeChild(temp);
    }
    alert(
      "Terjadi kendala saat unduh PDF otomatis. Membuka jendela cetak sebagai alternatif..."
    );
    const markup = prepareTimesheetPrintMarkup(
      logs,
      driverName,
      driverNik,
      month,
      year
    );
    const fileName = `Timesheet_${driverName.replace(/\s+/g, "_")}_${String(month).padStart(2, "0")}_${year}`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${fileName}</title><style>* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { margin: 0; padding: 0; background: white; } @media print { @page { size: A4 landscape; margin: 3mm; } body { margin: 0; } }</style></head><body>${markup}<script>window.onload=function(){window.focus();setTimeout(function(){window.print();window.onafterprint=function(){window.close();};setTimeout(function(){window.close();},2000);},400);};<\/script></body></html>`);
      win.document.close();
    }
  }
}

