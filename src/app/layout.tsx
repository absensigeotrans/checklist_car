import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "PTK Inspection Check List",
  description: "Berita Acara Checklist Kendaraan - Pertamina Trans Kontinental",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
