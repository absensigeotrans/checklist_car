# Product Requirements Document (PRD)
## Digitalization of Pertamina Trans Kontinental Vehicle Inspection Checklist

| Document Info | Value |
| --- | --- |
| **Project Name** | PTK Digital Checklist System |
| **Status** | Draft / Proposed |
| **Created Date** | July 14, 2026 |
| **Target Users** | Drivers, Fleet Coordinators, Asset Management Admins |

---

## 1. Product Overview

The **PTK Digital Checklist System** aims to digitalize the paper-based "Berita Acara Check List Kendaraan" currently used by Pertamina Trans Kontinental. 

### Core Objectives:
1. **For Drivers/Inspectors**: Provide a mobile-friendly, interactive, and fast tool to inspect vehicles before and after shifts.
2. **For Admin & Asset Management**: Provide a centralized web-based dashboard to view inspection histories, track fleet health in real-time, search and filter records, and export reports easily.
3. **Official PDF Archiving**: Support single-click generation of PDF reports formatted exactly like the original official paper inspection sheet to comply with administrative auditing requirements.

---

## 2. User Roles & Key Workflows

### 2.1. Driver / Inspector (Mobile-First Web App)
- **Log Inspection**: Access the checklist on a mobile device or tablet.
- **Fill Vehicle Info**: Enter driver details, vehicle type/plate, and current mileage.
- **Checklist Form**: Tap checklist options (ADA / TIDAK ADA) and add notes.
- **Inspect Vehicle Condition**:
  - Point and mark damage locations (scratches, dents) on a visual interactive vehicle diagram (front, left, right, rear).
  - Drag the fuel gauge indicator to match the actual dashboard status.
- **Sign & Submit**: Sign digitally on a touch signature canvas, then submit the checklist.

### 2.2. Fleet Coordinator / Asset Management (Desktop Dashboard)
- **Access Control**: Access to the Admin Panel is gated by a PIN code (default: `1234`) to prevent unauthorized drivers from viewing or modifying records.
- **Monitor Fleet Health**: View a list of recent inspections and overall vehicle health trends.
- **Review Inspections**: View complete details of a specific inspection, including the signed document, marked damage pins, and notes.
- **Data Export ("Tarik Data")**:
  - **Excel/CSV Export**: Export all raw checklist records for any date range to aggregate stats on mileage, equipment status, and common issues.
  - **Official PDF Export**: Generate a printable, neat PDF of the original "Berita Acara Check List Kendaraan" structure, complete with signatures.

---

## 3. Functional Requirements & Feature Specifications

### 3.1. Driver Inspection Form (Mobile UX)

#### A. Driver & Vehicle Information
- **Nama Driver**: Text field for driver name (no login or phone number required).
- **Jenis Kendaraan / Nopol Kendaraan**: Dropdown/text combo for selecting the vehicle model and inputting the license plate.
- **Kilometer Awal & Kilometer Akhir**: Numeric inputs for starting and ending odometer values (where Kilometer Akhir must be greater than or equal to Kilometer Awal).

#### B. Perlengkapan Kendaraan Checklist (Vehicle Equipment)
A list of 27 items to be checked. For each item, the driver selects **ADA** (Present) or **TDK ADA** (Absent), and can optionally add a **KET** (Remarks/Notes) text input.

**List of Items:**
1. AC
2. ASBAK (Ash Tray)
3. JAM TERPASANG (Installed Clock)
4. KACA SPION DALAM (Internal Rearview Mirror)
5. KARPET DEPAN (Front Carpet)
6. KARPET BELAKANG (Rear Carpet)
7. LIGHTER / PEMANTIK API (Cigarette Lighter)
8. KLAKSON (Horn)
9. P3K (First Aid Kit)
10. PENAHAN SINAR MATAHARI (Sun Visor)
11. RADIO / TAPE / CD
12. SANDARAN KEPALA (Headrest)
13. ANTENA (Antenna)
14. WHEEL DOP / DOP RODA (Wheel Hubcaps)
15. KACA SPION LUAR (External Mirrors)
16. PENAHAN LUMPUR (Mudguards)
17. SEGITIGA PENGAMAN (Safety Triangle)
18. TALANG AIR (Door Visor / Rain Deflector)
19. BAN SEREP (Spare Tire)
20. DONGKRAK + STANG (Jack & Handle)
21. TOOLS SHEET (Tool Kit Bag/Sheet)
22. KACA FILM (Window Tint)
23. PERALATAN CUCI KENDARAAN (Car Wash Equipment)
24. KUNCI KONTAK / REMOTE KONTAK (Ignition Key / Remote)
25. STNK (Vehicle Registration Certificate)
26. ALAT PEMADAM / APAR (Fire Extinguisher)
27. LAMPU BEMPER (Bumper Lights)

*Note: Order normalized to 1-27 from the original paper's numbered layout.*

#### C. Kondisi Kendaraan (Vehicle Condition & Diagrams)
- **Interactive Damage Plotter**:
  - Display 4 high-quality vectors/diagrams representing the vehicle's perspective: **Body Depan** (Front), **Body Samping Kiri** (Left), **Body Samping Kanan** (Right), and **Body Belakang** (Rear).
  - Tapping/clicking on a diagram lets the user place a pin (colored red/orange). A small modal pops up asking for details of the issue (e.g., "Penyok / Baret", "Lampu Pecah").
  - The pins and their coordinates are saved.
- **Fuel Gauge Selector**:
  - Interactive slider or dial mimicking the car's fuel meter (E - 1/4 - 1/2 - 3/4 - F).
- **Notes (Catatan)**:
  - 3 text fields mapping to "Catatan 1", "Catatan 2", and "Catatan 3".

#### D. Submission & Signatures
- **Tanggal Pemeriksaan Kendaraan**: Read-only current date and time (captured from system server time for integrity).
- **Digital Signature**: An interactive canvas area where the driver signs with a touch or stylus.
- **Submit Verification**: Ensures all 27 checklist items have a selected status (ADA or TDK ADA) and a signature has been drawn.

---

### 3.2. Admin Dashboard (Desktop UX)

#### A. Central Dashboard View
- **Overview Cards**: Active Inspections Today, Vehicles Needing Service (items reported as `TDK ADA` or body damages pinned), Fleet Active status.
- **Inspection Logs Table**:
  - Filterable by Date Range, Driver Name, License Plate, and Checklist Status.
  - Search bar.
- **Details Modal/Page**: Detailed view of an inspection, showing driver info, vehicle mileage, ticked checklist items, fuel status, interactive vehicle damage coordinates, and signatures.

#### B. Data Export & Reports ("Tarik Data")
- **Export to Excel (.xlsx)**:
  - Admin filters the date range and clicks "Export Excel".
  - Generates a structured spreadsheet containing columns for all driver fields, checklist responses (ADA/TDK ADA for all 27 items), fuel levels, notes, and damage list.
- **Export to PDF (.pdf)**:
  - Generates a PDF sheet styled exactly like the official Pertamina Trans Kontinental checklist form (including logo, signatures, layout, and fuel gauge).
- **Export to Word (.docx)**:
  - Generates a Word Document report containing the driver details, vehicle condition summary, checklist table, and notes in a professional layout.

---

## 4. Visual Design & Aesthetic Strategy

To align with modern design standards and Pertamina's branding:
1. **Branding & Theme**:
   - **Primary Palette**: Pertamina Brand colors (Vibrant Red `hsl(354, 85%, 48%)`, Royal Blue `hsl(211, 100%, 42%)`, Clean Green `hsl(145, 63%, 42%)`).
   - **Interface Style**: Light mode by default with clean card components, glassmorphism shadows, and generous spacing. A sleek dark mode is optional but supported.
   - **Typography**: Modern sans-serif fonts (e.g., `Outfit` or `Inter` via Google Fonts).
2. **Interactive Elements**:
   - Hover scales and active state transitions for all checklist toggle pills (ADA/TDK ADA).
   - Real-time gauge updates when adjusting the fuel slider.
   - Clean, visible feedback when drawing on the signature canvas.

---

## 5. Proposed Data Model (JSON Structure)

```json
{
  "inspectionId": "insp_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "inspectionDate": "2026-07-14T08:54:00+07:00",
  "driver": {
    "name": "Budi Santoso",
    "phone": "081234567890"
  },
  "vehicle": {
    "type": "Toyota Innova Reborn",
    "licensePlate": "B 1234 PTK",
    "mileage": 45230
  },
  "checklist": {
    "1": { "item": "AC", "status": "ADA", "notes": "Dingin" },
    "2": { "item": "ASBAK", "status": "ADA", "notes": "" },
    "3": { "item": "JAM TERPASANG", "status": "TDK ADA", "notes": "Mati baterai" },
    "...": "..."
  },
  "condition": {
    "damages": [
      {
        "view": "body_samping_kiri",
        "x": 45.2,
        "y": 62.8,
        "description": "Baret panjang pintu belakang"
      }
    ],
    "fuelLevel": "1/2",
    "notes": [
      "Mobil perlu dicuci luar dalam",
      "Ban serep terisi angin cukup",
      ""
    ]
  },
  "signatures": {
    "driver": "data:image/png;base64,iVBORw0KGgo...",
    "coordinator": null,
    "assetManagement": null
  }
}
```
