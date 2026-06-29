import { Solar } from 'lunar-javascript';

/**
 * Gets Vietnamese Can-Chi name of a year.
 */
export function getCanChiYear(year: number): string {
  const cans = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
  const chis = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
  
  if (isNaN(year) || year <= 0) return '';
  const can = cans[year % 10];
  const chi = chis[year % 12];
  return `${can} ${chi}`;
}

export interface LunarDateResult {
  lunarDateStr: string; // e.g. "Ngày 29 tháng 6 năm Quý Mão"
  canChiYear: string;   // e.g. "Quý Mão"
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
}

/**
 * Converts a Solar Date string (e.g. "15/08/2023", "2023-08-15" or just "2023") 
 * to Vietnamese Lunar Calendar Date representation.
 */
export function convertSolarToLunar(dateStr: string): LunarDateResult | null {
  if (!dateStr) return null;
  
  const cleanStr = dateStr.trim();
  
  let year = 0;
  let month = 0;
  let day = 0;
  
  // Parse YYYY-MM-DD
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  } 
  // Parse DD/MM/YYYY
  else if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } 
  // Parse single 4-digit year
  else if (cleanStr.length === 4 && !isNaN(Number(cleanStr))) {
    year = parseInt(cleanStr, 10);
  }
  
  if (year <= 0) return null;
  
  const canChiYear = getCanChiYear(year);
  
  // If only a year is available
  if (month <= 0 || day <= 0) {
    return {
      lunarDateStr: `Năm ${canChiYear}`,
      canChiYear,
      lunarDay: 0,
      lunarMonth: 0,
      isLeapMonth: false
    };
  }
  
  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    const lDay = lunar.getDay();
    const lMonth = Math.abs(lunar.getMonth());
    const lYear = lunar.getYear();
    
    let isLeapMonth = false;
    try {
      const fullStr = lunar.toString();
      isLeapMonth = fullStr.includes('闰') || (typeof lunar.isLeap === 'function' && lunar.isLeap());
    } catch (e) {
      // ignore
    }
    
    const lunarCanChiYear = getCanChiYear(lYear) || canChiYear;
    const leapText = isLeapMonth ? ' (Nhuận)' : '';
    
    return {
      lunarDateStr: `Ngày ${lDay} tháng ${lMonth}${leapText} năm ${lunarCanChiYear}`,
      canChiYear: lunarCanChiYear,
      lunarDay: lDay,
      lunarMonth: lMonth,
      isLeapMonth
    };
  } catch (err) {
    console.warn('Exception converting solar to lunar, falling back to can chi year:', err);
    return {
      lunarDateStr: `Năm ${canChiYear}`,
      canChiYear,
      lunarDay: 0,
      lunarMonth: 0,
      isLeapMonth: false
    };
  }
}

/**
 * Extracts 4-digit year from date string.
 */
export function getYearFromDateStr(dateStr?: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.trim();
  const lastFour = clean.match(/\d{4}$/);
  if (lastFour) return parseInt(lastFour[0], 10);
  const firstFour = clean.match(/^\d{4}/);
  if (firstFour) return parseInt(firstFour[0], 10);
  return 0;
}

export interface AgeResult {
  label: string; // "Tuổi hiện tại", "Hưởng thọ" or "Hưởng dương"
  value: string; // "X tuổi"
}

/**
 * Computes actual age for living or longevity for deceased.
 */
export function getAgeOrLongevityText(member: { isAlive: boolean; birthDate?: string; deathDate?: string }): AgeResult | null {
  const birthYear = getYearFromDateStr(member.birthDate);
  if (!birthYear || birthYear <= 0) return null;
  
  if (member.isAlive) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < 0) return null;
    return {
      label: "Tuổi hiện tại",
      value: `${age} tuổi`
    };
  } else {
    const deathYear = getYearFromDateStr(member.deathDate);
    if (!deathYear || deathYear <= 0) return null;
    const age = deathYear - birthYear;
    if (age < 0) return null;
    
    const label = age >= 60 ? "Hưởng thọ" : "Hưởng dương";
    return {
      label,
      value: `${age} tuổi`
    };
  }
}
