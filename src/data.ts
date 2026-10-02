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
  instagramVideo?: string;
  facebookVideo?: string;
  stock?: number;
  price?: number;
  discount?: number;
  gst?: number;
  kgGram?: string; // Column M (kg/gram)
  piece?: string; // Column F (piece)
}

export type SocialPlatform = 'instagram' | 'facebook' | 'youtube';

export function getCleanVideoUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (!clean || clean === '-' || clean === '0' || clean.length < 5) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return null;
}

export function detectSocialPlatform(url?: string): SocialPlatform | null {
  const clean = getCleanVideoUrl(url);
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return null;
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

/**
 * Opens WhatsApp directly via deep-link scheme on mobile (bypassing intermediate browser preview)
 * or directly via WhatsApp Web (web.whatsapp.com) on desktop/laptop.
 */
export function openWhatsAppChat(phone: string, text: string): void {
  const cleanPhone = (phone || '917017373371').replace(/\D/g, '');
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(text);

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || navigator.vendor || (window as any).opera || ''
    );

  if (isMobile) {
    // Direct app deep-link on mobile devices to bypass intermediate "Chat on WhatsApp" browser landing page
    const deepLinkUrl = phoneParam
      ? `whatsapp://send?phone=${phoneParam}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    window.location.href = deepLinkUrl;
  } else {
    // Direct WhatsApp Web on desktop/laptop to bypass intermediate "Continue to WhatsApp Web" landing page
    const desktopUrl = phoneParam
      ? `https://web.whatsapp.com/send?phone=${phoneParam}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    try {
      // '_blank' ki jagah 'whatsapp_tab' use karein
      const win = window.open(desktopUrl, 'whatsapp_tab');
      // If browser popup blocker prevented opening the tab, navigate current window directly
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = desktopUrl;
      }
    } catch {
      window.location.href = desktopUrl;
    }
  }
}

export interface UserProfile {
  fullName: string;
  lastName: string;
  address: string;
  pinCode: string;
  contactNumber: string;
  password5Digit?: string;
}

export const DEFAULT_BAKERY_ITEMS: MenuItem[] = [
  {
    id: 'bakery-1',
    category: 'Bakery',
    nativeName: 'वेज पैटीज़',
    name: 'Veg Patties',
    portion: '1 Piece',
    piece: '1 Pc',
    priceHalf: '-',
    priceFull: '30',
    price: 30,
    offer: 'Hot & Crispy',
    discount: 0,
    stock: 50,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    facebookVideo: 'https://www.facebook.com/watch/?v=10158238127394592',
    kgGram: '1 Pc'
  },
  {
    id: 'bakery-2',
    category: 'Bakery',
    nativeName: 'चॉकलेट पेस्ट्री',
    name: 'Chocolate Pastry',
    portion: '1 Piece',
    piece: '1 Pc',
    priceHalf: '-',
    priceFull: '50',
    price: 50,
    offer: 'Special 10% Off',
    discount: 10,
    stock: 40,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    instagramVideo: 'https://www.instagram.com/reel/DdRLWhgTpLk/?stkn=MWp3bW0ycXoyc3loYg==',
    kgGram: '1 Pc'
  },
  {
    id: 'bakery-3',
    category: 'Bakery',
    nativeName: 'पाइनएप्पल केक',
    name: 'Pineapple Cake',
    portion: '1 Kg',
    piece: '1 Kg',
    priceHalf: '200',
    priceFull: '350',
    price: 350,
    offer: 'Chef Special',
    discount: 0,
    stock: 20,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: 'https://youtu.be/PwTcikeQ8Wg?si=ex6YkgX90BV8RsQ1',
    kgGram: '1 Kg'
  },
  {
    id: 'bakery-4',
    category: 'Bakery',
    nativeName: 'बटर कुकीज़ / नानखटाई',
    name: 'Butter Cookies (Nan Khatai)',
    portion: '500 gm',
    piece: '500g',
    priceHalf: '60',
    priceFull: '120',
    price: 120,
    offer: '',
    discount: 0,
    stock: 45,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    kgGram: '500 gm'
  },
  {
    id: 'bakery-5',
    category: 'Bakery',
    nativeName: 'क्रीम रोल',
    name: 'Cream Roll',
    portion: '1 Piece',
    piece: '1 Pc',
    priceHalf: '-',
    priceFull: '20',
    price: 20,
    offer: '',
    discount: 0,
    stock: 60,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    kgGram: '1 Pc'
  },
  {
    id: 'bakery-6',
    category: 'Bakery',
    nativeName: 'दूध टोस्ट / रस्क',
    name: 'Milk Rusk (Toast)',
    portion: '400 gm',
    piece: '400g',
    priceHalf: '-',
    priceFull: '60',
    price: 60,
    offer: 'Crispy & Fresh',
    discount: 0,
    stock: 50,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    kgGram: '400 gm'
  },
  {
    id: 'bakery-7',
    category: 'Bakery',
    nativeName: 'ताज़ा मिल्क ब्रेड',
    name: 'Fresh Milk Bread',
    portion: '1 Packet',
    piece: '1 Pkt',
    priceHalf: '-',
    priceFull: '40',
    price: 40,
    offer: '',
    discount: 0,
    stock: 35,
    gst: 0,
    imageName: '',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    youtubeVideo: '',
    kgGram: '400 gm'
  }
];

export const menuData: MenuItem[] = [...DEFAULT_BAKERY_ITEMS];
