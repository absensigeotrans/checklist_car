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
  const dateObj = new Date(rec.inspectionDate);
  const dateFormatted =
    dateObj.toLocaleDateString("id-ID") +
    " " +
    dateObj.toLocaleTimeString("id-ID");

  let leftTableHtml = "";
  let rightTableHtml = "";
  for (let i = 1; i <= 27; i++) {
    const item = rec.checklist[i];
    if (!item) continue;
    const statusAda = item.status === "ADA" ? "✓" : "";
    const statusTdk = item.status === "TDK ADA" ? "✓" : "";
    const note = item.note || "";
    const rowHtml = `
      <tr>
        <td style="text-align:center;font-size:0.65rem;">${i}</td>
        <td style="font-size:0.65rem;">${item.item}</td>
        <td style="text-align:center;font-weight:bold;font-size:0.7rem;">${statusAda}</td>
        <td style="text-align:center;font-weight:bold;font-size:0.7rem;">${statusTdk}</td>
        <td style="font-size:0.6rem;">${note}</td>
      </tr>`;
    if (i <= 14) leftTableHtml += rowHtml;
    else rightTableHtml += rowHtml;
  }

  const getPointersHtml = (part: string) =>
    rec.condition.damages
      .filter((d) => d.part === part)
      .map(
        (d) =>
          `<div style="position:absolute;left:calc(${d.x}% - 5px);top:calc(${d.y}% - 5px);width:10px;height:10px;background-color:red;border:1px solid white;border-radius:50%;z-index:100;box-shadow:0 0 2px rgba(0,0,0,0.5);"></div>`
      )
      .join("");

  return `
    <div class="official-form-print" style="width:100%;max-width:800px;margin:0 auto;background-color:white;color:black;padding:6px 10px;font-family:Arial,sans-serif;border:1px solid #000;box-sizing:border-box;">
      <div class="print-header" style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid black;padding-bottom:3px;margin-bottom:5px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <img src="/logo_pertamina_tk.png" alt="PTK" style="height:38px;width:auto;object-fit:contain;">
        </div>
        <div class="print-header-text" style="text-align:center;flex:1;">
          <h2 style="font-size:1.05rem;font-weight:700;text-transform:uppercase;margin:0;line-height:1.2;">BERITA ACARA CHECK LIST KENDARAAN</h2>
          <h3 style="font-size:0.85rem;font-weight:500;margin:2px 0 0 0;text-decoration:underline;line-height:1.2;">PT PERTAMINA TRANS KONTINENTAL</h3>
        </div>
      </div>
      <table class="print-meta-table" style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tr>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">Nama Driver</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${escapeHtml(rec.driver.name)}</td>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">Tanggal</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${dateFormatted}</td>
        </tr>
        <tr>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">Jenis Kendaraan</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${escapeHtml(rec.vehicle.type)}</td>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">No. Polisi</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${escapeHtml(rec.vehicle.licensePlate)}</td>
        </tr>
        <tr>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">KM Awal</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${rec.vehicle.mileageStart.toLocaleString()} KM</td>
          <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;text-align:center;">KM Akhir</th>
          <td style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;">${rec.vehicle.mileageEnd.toLocaleString()} KM</td>
        </tr>
      </table>

      <div class="print-layout-columns" style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:6px;margin-bottom:4px;">
        <div>
          <table class="print-checklist-table" style="width:100%;border-collapse:collapse;margin-bottom:4px;">
            <thead>
              <tr>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">No</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">PERLENGKAPAN</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">ADA</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">TDK</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">KET</th>
              </tr>
            </thead>
            <tbody>${leftTableHtml}</tbody>
          </table>
          <table class="print-checklist-table" style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">No</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">PERLENGKAPAN</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">ADA</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">TDK</th>
                <th style="border:1px solid black;padding:2px 4px;font-size:0.7rem;color:black;background-color:#f0f0f0;">KET</th>
              </tr>
            </thead>
            <tbody>${rightTableHtml}</tbody>
          </table>
        </div>

        <div class="print-condition-container" style="border:1px solid black;padding:4px 8px;">
          <div class="print-condition-title" style="font-weight:700;font-size:0.75rem;text-align:center;border-bottom:1px solid black;padding-bottom:2px;margin-bottom:4px;text-transform:uppercase;">KONDISI FISIK</div>
          <div class="print-vehicle-view" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:6px;">
            <div class="print-vehicle-item" style="border:1px dashed #ccc;padding:4px;display:flex;flex-direction:column;align-items:center;font-size:0.7rem;">
              <span>Depan</span>
              <div style="width:55px;height:55px;position:relative;background:#f9f9f9;">
                <img src="/car_front.png" alt="Depan" style="width:100%;height:100%;object-fit:contain;">
                ${getPointersHtml("body_depan")}
              </div>
            </div>
            <div class="print-vehicle-item" style="border:1px dashed #ccc;padding:4px;display:flex;flex-direction:column;align-items:center;font-size:0.7rem;">
              <span>Belakang</span>
              <div style="width:55px;height:55px;position:relative;background:#f9f9f9;">
                <img src="/car_rear.png" alt="Belakang" style="width:100%;height:100%;object-fit:contain;">
                ${getPointersHtml("body_belakang")}
              </div>
            </div>
            <div class="print-vehicle-item" style="border:1px dashed #ccc;padding:4px;display:flex;flex-direction:column;align-items:center;font-size:0.7rem;">
              <span>Kiri</span>
              <div style="width:55px;height:55px;position:relative;background:#f9f9f9;">
                <img src="/car_left.png" alt="Kiri" style="width:100%;height:100%;object-fit:contain;">
                ${getPointersHtml("body_samping_kiri")}
              </div>
            </div>
            <div class="print-vehicle-item" style="border:1px dashed #ccc;padding:4px;display:flex;flex-direction:column;align-items:center;font-size:0.7rem;">
              <span>Kanan</span>
              <div style="width:55px;height:55px;position:relative;background:#f9f9f9;">
                <img src="/car_right.png" alt="Kanan" style="width:100%;height:100%;object-fit:contain;">
                ${getPointersHtml("body_samping_kanan")}
              </div>
            </div>
          </div>
          <div style="font-size:0.65rem;margin-bottom:4px;line-height:1.2;">
            <strong>Keterangan Kerusakan:</strong><br/>
            ${["body_depan","body_samping_kiri","body_samping_kanan","body_belakang"].map(p => {
              const d = rec.condition.damages.filter(dd => dd.part === p);
              return d.length ? d.map((dd, i) => `${getPartLabel(p)} ${i+1}: ${dd.description}`).join("<br/>") : "";
            }).filter(Boolean).join("<br/>") || "Tidak ada kerusakan"
            }
          </div>
          <div style="font-size:0.68rem;margin-top:3px;border-top:1px solid #ccc;padding-top:4px;line-height:1.2;">
            <strong>Catatan Lain:</strong><br/>
            1. ${escapeHtml(rec.condition.notes[0]) || "-"}<br/>
            2. ${escapeHtml(rec.condition.notes[1]) || "-"}<br/>
            3. ${escapeHtml(rec.condition.notes[2]) || "-"}
          </div>
        </div>
      </div>

      <div class="print-fuel-gauge" style="display:flex;flex-direction:column;align-items:center;margin-top:6px;font-size:0.75rem;">
        <span>Bahan Bakar: ${rec.condition.fuelLevel}%</span>
      </div>

      <table class="print-footer-table" style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="border:1px solid black;padding:3px 6px;width:25%;height:55px;vertical-align:top;font-size:0.68rem;position:relative;box-sizing:border-box;">
            <span class="sig-label" style="font-weight:600;display:inline-block;line-height:1.2;">Dibuat Oleh,<br/>(Driver)</span>
            <img src="${escapeHtml(rec.signature)}" alt="TTD" style="max-height:35px;max-width:100%;position:absolute;bottom:12px;left:8px;"/>
          </td>
          <td style="border:1px solid black;padding:3px 6px;width:25%;height:55px;vertical-align:top;font-size:0.68rem;position:relative;box-sizing:border-box;">
            <span class="sig-label" style="font-weight:600;display:inline-block;line-height:1.2;">Mengetahui,<br/>(Koordinator)</span>
          </td>
          <td style="border:1px solid black;padding:3px 6px;width:25%;height:55px;vertical-align:top;font-size:0.68rem;position:relative;box-sizing:border-box;">
            <span class="sig-label" style="font-weight:600;display:inline-block;line-height:1.2;">Menyetujui,<br/>(Asset Mgmt)</span>
          </td>
          <td style="border:1px solid black;padding:3px 6px;width:25%;height:55px;vertical-align:top;font-size:0.68rem;position:relative;box-sizing:border-box;">
            <span class="sig-label" style="font-weight:600;display:inline-block;line-height:1.2;">NIK Driver:</span><br/>
            <span style="font-size:0.65rem;">${escapeHtml(rec.driver.nik)}</span>
          </td>
        </tr>
      </table>
    </div>`;
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
