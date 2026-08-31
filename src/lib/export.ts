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

      if (hasStart) kmStartStr = startNum.toLocaleString();
      if (hasEnd) kmEndStr = endNum.toLocaleString();
      if (hasStart && hasEnd) {
        kmTotalStr = Math.max(0, endNum - startNum).toLocaleString();
      }
    }
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
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${kmStartStr}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center;">${kmEndStr}</td>
        <td style="border:1px solid #000; padding:0px 2px; text-align:center; font-weight:bold;">${kmTotalStr}</td>
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
          NIP Driver (Driver's NIP): 
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
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.width = "850px";
      tempContainer.style.zIndex = "-9999";
      tempContainer.style.opacity = "0.01";
      tempContainer.style.pointerEvents = "none";
      tempContainer.style.backgroundColor = "#ffffff";
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
    }

    const safeDriver = (rec.driver?.name || "Driver").replace(/\s+/g, "_");
    const safePlate = (rec.vehicle?.licensePlate || "NoPol").replace(/\s+/g, "_");
    const fileName = `Checklist_${safeDriver}_${safePlate}.pdf`;

    const opt = {
      margin: [5, 5, 5, 5],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        windowWidth: 1024,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(target).save();

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.error("PDF generation error:", err);
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
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "0";
    tempContainer.style.top = "0";
    tempContainer.style.width = "1050px";
    tempContainer.style.zIndex = "-9999";
    tempContainer.style.opacity = "0.01";
    tempContainer.style.pointerEvents = "none";
    tempContainer.style.backgroundColor = "#ffffff";
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

    const safeDriver = (driverName || "Driver").replace(/\s+/g, "_");
    const fileName = `Timesheet_${safeDriver}_${String(month).padStart(2, "0")}_${year}.pdf`;

    const opt = {
      margin: [4, 4, 4, 4],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        windowWidth: 1100,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    await html2pdf().set(opt).from(target).save();

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.error("PDF generation error:", err);
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

