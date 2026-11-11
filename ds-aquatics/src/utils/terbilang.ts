/**
 * Fungsi Konversi Angka ke Kata Terbilang Rupiah Resmi Bahasa Indonesia
 * Contoh:
 * 750000 -> "Tujuh Ratus Lima Puluh Ribu Rupiah"
 * 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilangRupiah(angka: number): string {
  const cleanNumber = Math.floor(Math.abs(Number(angka) || 0));
  if (cleanNumber === 0) return 'Nol Rupiah';

  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return (konversi(n - 10) + ' Belas').trim();
    } else if (n < 100) {
      const sisa = n % 10;
      return (konversi(Math.floor(n / 10)) + ' Puluh ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 200) {
      const sisa = n - 100;
      return ('Seratus ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 1000) {
      const sisa = n % 100;
      return (konversi(Math.floor(n / 100)) + ' Ratus ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 2000) {
      const sisa = n - 1000;
      return ('Seribu ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 1000000) {
      const sisa = n % 1000;
      return (konversi(Math.floor(n / 1000)) + ' Ribu ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 1000000000) {
      const sisa = n % 1000000;
      return (konversi(Math.floor(n / 1000000)) + ' Juta ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return (konversi(Math.floor(n / 1000000000)) + ' Miliar ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    } else {
      const sisa = n % 1000000000000;
      return (konversi(Math.floor(n / 1000000000000)) + ' Triliun ' + (sisa > 0 ? konversi(sisa) : '')).trim();
    }
  }

  const hasilKata = konversi(cleanNumber).replace(/\s+/g, ' ').trim();
  return hasilKata ? `${hasilKata} Rupiah` : 'Nol Rupiah';
}
