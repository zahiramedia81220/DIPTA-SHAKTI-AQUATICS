import { ClubSettings, InvoiceHeaderSettings } from '../types';

/** Kop invoice dengan nilai bawaan jika belum diatur. */
export function getInvoiceHeader(settings: ClubSettings): Required<InvoiceHeaderSettings> {
  const h = settings.invoiceHeader || {};
  return {
    clubName: h.clubName || 'DS AQUATICS CLUB',
    tagline: h.tagline || 'Pusat Pembinaan Akuatik Prestasi • Boyolali, Jawa Tengah',
    contactLine: h.contactLine || `WhatsApp: ${settings.phoneWa || '-'} • Instagram: @dsaquatics.official`,
    logoDataUrl: h.logoDataUrl || '',
    city: h.city || 'Boyolali',
    signatureText: h.signatureText || 'Dewi Setyaningsih',
    signerName: h.signerName || 'Coach Dewi Setyaningsih',
    signerTitle: h.signerTitle || 'Kepala Pelatih & Founder DS Aquatics',
  };
}

export const escapeHtml = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** HTML kop surat untuk dokumen cetak. */
export function letterheadHtml(settings: ClubSettings): string {
  const h = getInvoiceHeader(settings);
  const logo = h.logoDataUrl
    ? `<img src="${h.logoDataUrl}" alt="logo" style="width:56px;height:56px;object-fit:contain;border-radius:10px">`
    : `<div style="width:56px;height:56px;border-radius:10px;background:#0f172a;color:#22d3ee;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px">DS</div>`;
  return `<div style="display:flex;gap:12px;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px">
    ${logo}
    <div><div style="font-size:18px;font-weight:900">${escapeHtml(h.clubName)}</div>
    <div style="font-size:10px;text-transform:uppercase;font-weight:600;color:#475569">${escapeHtml(h.tagline)}</div>
    <div style="font-size:10px;color:#64748b">${escapeHtml(h.contactLine)}</div></div></div>`;
}

/**
 * Cetak / Simpan PDF lewat jendela terpisah (tidak bergantung CSS halaman aplikasi).
 * Di dialog cetak, pilih "Simpan sebagai PDF".
 */
export function printHtml(title: string, bodyHtml: string): boolean {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:24px;font-size:11px}
    h1{font-size:15px;margin:4px 0 2px} .muted{color:#64748b}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #cbd5e1;padding:5px 6px;text-align:left;vertical-align:top}
    th{background:#f1f5f9;font-size:10px;text-transform:uppercase}
    td.num,th.num{text-align:right;white-space:nowrap}
    .sum{display:flex;gap:10px;margin-top:10px}
    .sum div{flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:8px}
    .sum b{display:block;font-size:13px;margin-top:2px}
    @page{size:A4;margin:12mm}
    @media print{body{margin:0}}
  </style></head><body>${bodyHtml}
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},300)}<\/script>
  </body></html>`);
  w.document.close();
  return true;
}

/** Blok tanda tangan (dari pengaturan Kop Invoice). */
export function signatureHtml(settings: ClubSettings, dateText: string): string {
  const h = getInvoiceHeader(settings);
  return `<div style="display:flex;justify-content:flex-end;margin-top:28px;page-break-inside:avoid">
    <div style="text-align:center;width:230px">
      <div>${escapeHtml(h.city)}, ${escapeHtml(dateText)}</div>
      <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#155e75;padding:16px 0 6px">${escapeHtml(h.signatureText)}</div>
      <div style="border-top:1px solid #94a3b8;padding-top:3px;font-weight:700">${escapeHtml(h.signerName)}</div>
      <div class="muted" style="font-size:10px">${escapeHtml(h.signerTitle)}</div>
    </div></div>`;
}

/**
 * Cetak HANYA satu elemen halaman (mis. kuitansi / rapor / jadwal) dengan gaya visual yang sama,
 * di jendela terpisah — bukan seluruh website.
 */
export function printElement(el: HTMLElement | null, title: string, orientation: 'portrait' | 'landscape' = 'portrait'): boolean {
  if (!el) return false;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) =>
      n.tagName === 'LINK' ? `<link rel="stylesheet" href="${(n as HTMLLinkElement).href}">` : `<style>${n.innerHTML}</style>`
    )
    .join('\n');
  const w = window.open('', '_blank', 'width=1000,height=1100');
  if (!w) return false;
  const maxW = orientation === 'landscape' ? '277mm' : '190mm';
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <base href="${location.origin}/">${styles}
  <style>
    @page{size:A4 ${orientation};margin:10mm}
    html,body{background:#fff!important;margin:0;padding:0}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    .no-print,.print\\:hidden{display:none!important}
    .print-wrap{max-width:${maxW};margin:0 auto;padding:12px}
    @media print{.print-wrap{padding:0}}
  </style></head><body><div class="print-wrap">${el.outerHTML}</div>
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},500)}<\/script>
  </body></html>`);
  w.document.close();
  return true;
}
