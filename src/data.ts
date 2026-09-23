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

export interface UserProfile {
  fullName: string;
  lastName: string;
  address: string;
  pinCode: string;
  contactNumber: string;
  password5Digit?: string;
}

export const menuData: MenuItem[] = [];
