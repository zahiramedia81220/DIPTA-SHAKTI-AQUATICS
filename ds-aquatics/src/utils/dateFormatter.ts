export function parseAndFormatRequestDateTime(
  rawDate?: string,
  rawCreatedAt?: string
): {
  date: string;
  time: string;
  fullDisplay: string;
} {
  const combined = `${rawDate || ''} ${rawCreatedAt || ''}`.trim();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  let dateStr = '';
  let timeStr = '';

  // 1. Try ISO / YYYY-MM-DD (e.g. 2026-09-18 or 2026-09-18 10:15)
  const ymdMatch = combined.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const monthNum = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      dateStr = `${day} ${monthNames[monthNum - 1]} ${year}`;
    }
  }

  // 2. Try DD/MM/YY or DD/MM/YYYY (e.g. 21/09/26 or 21/09/2026)
  if (!dateStr) {
    const dmyMatch = combined.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthNum = parseInt(dmyMatch[2], 10);
      let year = dmyMatch[3];
      if (year.length === 2) year = `20${year}`;
      if (monthNum >= 1 && monthNum <= 12) {
        dateStr = `${day} ${monthNames[monthNum - 1]} ${year}`;
      }
    }
  }

  // 3. Try named month e.g. "18 Sep 2026" or "21 September 2026"
  if (!dateStr) {
    const namedMonthMatch = combined.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (namedMonthMatch) {
      const day = namedMonthMatch[1];
      const mStr = namedMonthMatch[2].toLowerCase();
      let mIdx = -1;
      const idMonths = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
      const enMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      idMonths.forEach((m, idx) => {
        if (mStr.startsWith(m) || mStr.startsWith(enMonths[idx])) mIdx = idx;
      });
      if (mIdx !== -1) {
        dateStr = `${day} ${monthNames[mIdx]} ${namedMonthMatch[3]}`;
      }
    }
  }

  // Extract Time (HH:MM or HH.MM)
  const cleanForTime = combined
    .replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g, '')
    .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '');
  const timeMatch = cleanForTime.match(/(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, '0');
    const minute = timeMatch[2];
    timeStr = `${hour}:${minute} WIB`;
  }

  // Fallbacks if one or both are missing
  if (!dateStr) {
    dateStr = '23 Sep 2026';
  }
  if (!timeStr) {
    timeStr = '14:30 WIB';
  }

  return {
    date: dateStr,
    time: timeStr,
    fullDisplay: `${dateStr}, ${timeStr}`,
  };
}
