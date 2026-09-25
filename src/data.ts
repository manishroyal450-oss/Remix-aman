export interface MenuItem {
  id: string;
  category: string;
  name: string; // english
  nativeName: string; // hindi
  priceHalf?: string;
  priceFull?: string;
  portion?: string;
  offer?: string;
  imageName?: string;
  image_url?: string;
  youtubeVideo?: string;
  stock?: number;
  price?: number;
  discount?: number;
  gst?: number;
  kgGram?: string; // Column M (kg/gram)
  piece?: string; // Column F (piece)
}

export function formatPieceUnit(pieceVal?: string): string {
  if (!pieceVal) return '';
  const trimmed = pieceVal.trim();
  // Do NOT show if empty, '-', '0', or placeholder
  if (!trimmed || trimmed === '-' || trimmed === '0') return '';

  const lower = trimmed.toLowerCase();

  // If explicitly '/piece', 'piece', 'pc', '/pc', or 'per piece'
  if (
    lower === '/piece' ||
    lower === 'piece' ||
    lower === '/pc' ||
    lower === 'pc' ||
    lower === 'per piece' ||
    lower === '/ per piece' ||
    lower === '1 piece' ||
    lower === '/1 piece'
  ) {
    return '/piece';
  }

  // If user typed a specific piece quantity like "2 piece", "4 pieces", "2 pc"
  if (/^(\d+)\s*(piece|pc|pieces|pcs)$/i.test(trimmed)) {
    return `/${trimmed}`;
  }

  // If user explicitly prefixed with '/', e.g. '/piece' or '/plate'
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // If user typed words containing piece/pc
  if (lower.includes('piece') || lower.includes('pc')) {
    return `/${trimmed}`;
  }

  return '';
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedPortion?: 'Half' | 'Full' | string;
  unitPrice?: number;
}

export function parsePriceNumber(val?: string | number): number {
  if (typeof val === 'number') {
    return isNaN(val) || val < 0 ? 0 : val;
  }
  if (!val || typeof val !== 'string') return 0;
  const cleaned = val.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function getItemUnitPrice(item: MenuItem | CartItem, portion?: 'Half' | 'Full' | string): number {
  // If cart item already has a valid unitPrice, use it
  if ('unitPrice' in item && typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) && item.unitPrice > 0) {
    return item.unitPrice;
  }

  const effPortion = portion || ('selectedPortion' in item ? item.selectedPortion : undefined);
  const halfPrice = parsePriceNumber(item.priceHalf);
  const fullPrice = parsePriceNumber(item.priceFull);

  if (effPortion === 'Half' && halfPrice > 0) {
    return halfPrice;
  }
  if (effPortion === 'Full' && fullPrice > 0) {
    return fullPrice;
  }

  // Fallbacks: if requested portion was not found or 0
  if (halfPrice > 0 && fullPrice === 0) return halfPrice;
  if (fullPrice > 0 && halfPrice === 0) return fullPrice;
  if (fullPrice > 0) return fullPrice;
  if (halfPrice > 0) return halfPrice;

  // General item.price
  if (typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) {
    return item.price;
  }

  return 0;
}

export function hasBothPortions(item: MenuItem | CartItem): boolean {
  const half = parsePriceNumber(item.priceHalf);
  const full = parsePriceNumber(item.priceFull);
  return half > 0 && full > 0;
}

export function getCleanItemName(rawName: string): string {
  if (!rawName) return '';
  return rawName.replace(/\s*\((Half|Full)\)\s*$/i, '').trim();
}

export interface UserProfile {
  fullName: string;
  lastName: string;
  address: string;
  pinCode: string;
  contactNumber: string;
  password5Digit?: string;
}

export const menuData: MenuItem[] = [];
