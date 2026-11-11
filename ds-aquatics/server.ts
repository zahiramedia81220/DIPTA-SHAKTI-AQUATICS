import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy-initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DS Aquatics Club Management',
    hasGemini: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Gemini AI Assistant endpoint
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { action, payload } = req.body;
    const ai = getGemini();

    if (!ai) {
      // Fallback responses when API key is not configured
      if (action === 'coach_report_notes') {
        return res.json({
          success: true,
          result: `Siswa menunjukkan dedikasi dan antusiasme tinggi selama proses pembelajaran renang. Terus pertahankan ritme kayuhan dan kelenturan pernapasan saat di air. Pertahankan semangat untuk melangkah ke tingkat kompetensi berikutnya bersama DS Aquatics!`,
          mode: 'fallback',
        });
      }
      if (action === 'attendance_narrative') {
        return res.json({
          success: true,
          result: `Rekapitulasi kehadiran siswa DS AQUATICS menunjukkan kedisiplinan dan partisipasi aktif yang konsisten di Kolam Lestarindo dan Front One. Seluruh sesi latihan berjalan teratur sesuai kurikulum kepelatihan Coach Dewi Setyaningsih.`,
          mode: 'fallback',
        });
      }
      if (action === 'audit_system') {
        return res.json({
          success: true,
          result: `Sistem manajemen DS AQUATICS berjalan stabil. Seluruh data jadwal matriks, status absensi, dan data member terintegrasi secara rapi dan siap dicetak ke dokumen resmi A4.`,
          mode: 'fallback',
        });
      }
      return res.status(400).json({ error: 'Aksi tidak dikenal' });
    }

    if (action === 'coach_report_notes') {
      const { studentName, level, period, scores } = payload || {};
      const scoreSummary = Array.isArray(scores)
        ? scores.map((s: any) => `- ${s.name}: ${s.score}/100 (${s.predicate})`).join('\n')
        : 'Evaluasi umum';

      const prompt = `Anda adalah asisten kepala pelatih renang DS AQUATICS (Coach Dewi Setyaningsih).
Tuliskan "Catatan Pembinaan Khusus & Saran Pelatih" yang profesional, hangat, edukatif, dan memotivasi untuk siswa berikut:
- Nama Siswa: ${studentName || 'Siswa'}
- Tingkatan: ${level || 'Pemula'}
- Periode Evaluasi: ${period || 'Bulan ini'}
- Hasil Nilai Indikator Ujian:
${scoreSummary}

Instruksi penulisan:
1. Buat dalam 2-3 paragraf ringkas dan berbobot dalam Bahasa Indonesia resmi namun bersahabat.
2. Sorot pencapaian positif siswa dan berikan 1-2 saran teknis spesifik (seperti pernapasan, streamline meluncur, kekuatan kayuhan kaki/tangan).
3. Berikan kalimat penutup penyemangat untuk kenaikan tingkat berikutnya.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        result: response.text?.trim() || '',
      });
    }

    if (action === 'attendance_narrative') {
      const { totalMembers, totalAttendedSessions, activeRate, period } = payload || {};
      const prompt = `Anda adalah sistem manajemen akademik klub renang DS AQUATICS Boyolali.
Tuliskan 1 paragraf ringkasan eksekutif (3-4 kalimat) resmi untuk Laporan Rekapitulasi Absensi & Kehadiran Siswa:
- Periode: ${period || 'Bulan Berjalan'}
- Total Siswa: ${totalMembers || 0} orang
- Total Sesi Kehadiran Terlaksana: ${totalAttendedSessions || 0} sesi
- Rata-rata Keaktifan Siswa: ${activeRate || 0}%

Tuliskan dalam Bahasa Indonesia formal yang cocok diletakkan di bawah kop surat resmi sebelum tabel absensi dicetak ke PDF ukuran A4.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        result: response.text?.trim() || '',
      });
    }

    if (action === 'audit_system') {
      const { membersCount, totalSlots, offSlots, presentSlots, pendingRequests } = payload || {};
      const prompt = `Anda adalah AI Audit & System Assistant untuk klub renang DS AQUATICS.
Berikan audit singkat (3 poin utama) mengenai kesehatan operasional klub:
- Jumlah Member Terdaftar: ${membersCount}
- Total Slot Waktu Terjadwal: ${totalSlots}
- Slot Hadir: ${presentSlots}
- Slot OFF/Pelatih Sibuk: ${offSlots}
- Antrean Pengajuan Jadwal: ${pendingRequests}

Berikan status operasional, rekomendasi alokasi pelatih, dan saran peningkatan kapasitas latihan. Gunakan bahasa Indonesia profesional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        result: response.text?.trim() || '',
      });
    }

    return res.status(400).json({ error: 'Action not supported' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Terjadi kendala saat memproses kecerdasan buatan Gemini.',
      details: error?.message,
    });
  }
});

// Vite Middleware / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DS Aquatics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
