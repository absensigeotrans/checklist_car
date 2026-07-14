// api/config.js - Vercel Serverless Function
// Berkas ini akan berjalan di sisi server Vercel untuk membaca Environment Variables secara aman.

module.exports = (req, res) => {
  // Set headers untuk mencegah caching agar konfigurasi selalu diperbarui
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/json');
  
  // Mengembalikan variabel lingkungan dari Vercel
  res.status(200).json({
    URL: process.env.SUPABASE_URL || "",
    KEY: process.env.SUPABASE_KEY || ""
  });
};
