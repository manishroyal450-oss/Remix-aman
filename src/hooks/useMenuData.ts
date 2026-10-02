import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { MenuItem, DEFAULT_BAKERY_ITEMS, DeliveryConfig } from '../data';

const SHEET_ID = '1otN1s4qs_QfF7jfK4uy-uTFOKhflZUXao7vTLrzQBK8';
const SHEET_NAME = 'Restaurant Menu';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
const CACHE_MENU_KEY = 'aman_sweet_menu_data_cache_v2';
const CACHE_DELIVERY_KEY = 'aman_sweet_delivery_config_cache_v2';

const getInitialCachedMenu = (): MenuItem[] => {
  try {
    const raw = localStorage.getItem(CACHE_MENU_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

const getInitialCachedDelivery = (): DeliveryConfig => {
  try {
    const raw = localStorage.getItem(CACHE_DELIVERY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.deliveryFee === 'number') return parsed;
    }
  } catch (e) {}
  return {
    deliveryFee: 40,
    deliveryDescription: 'If you take 300 rupay item , you can take free delivery',
    freeDeliveryThreshold: 300,
  };
};

export function useMenuData() {
  const [data, setData] = useState<MenuItem[]>(getInitialCachedMenu);
  const [loading, setLoading] = useState(() => getInitialCachedMenu().length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(getInitialCachedDelivery);

  const fetchData = async () => {
    try {
      const response = await fetch(`${CSV_URL}&_=${new Date().getTime()}`);
      const csvText = await response.text();
      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
      const rows = parsed.data;

      const headers = rows[0] || [];
      const kgGramColIndex = headers.findIndex((h) =>
        typeof h === 'string' && /kg\s*\/\s*gram|kg|gram|weight/i.test(h.trim())
      );
      const colIndexKgGram = kgGramColIndex !== -1 ? kgGramColIndex : 12;

      const pieceColIndex = headers.findIndex((h) =>
        typeof h === 'string' && /^piece\b/i.test(h.trim())
      );
      const colIndexPiece = pieceColIndex !== -1 ? pieceColIndex : 5;

      // Explicit column resolution for Column N (Index 13: Instagram), Column O (Index 14: Facebook), Column P (Index 15: YouTube)
      const colIndexInstagram = headers.findIndex((h) =>
        typeof h === 'string' && /instagram|insta/i.test(h.trim())
      ) !== -1 ? headers.findIndex((h) => typeof h === 'string' && /instagram|insta/i.test(h.trim())) : 13;

      const colIndexFacebook = headers.findIndex((h) =>
        typeof h === 'string' && /facebook|fb/i.test(h.trim())
      ) !== -1 ? headers.findIndex((h) => typeof h === 'string' && /facebook|fb/i.test(h.trim())) : 14;

      const colIndexYoutubeP = headers.findIndex((h, idx) =>
        idx >= 13 && typeof h === 'string' && /youtube|yt/i.test(h.trim())
      ) !== -1 ? headers.findIndex((h, idx) => idx >= 13 && typeof h === 'string' && /youtube|yt/i.test(h.trim())) : 15;

      const colIndexCol10 = 10;

      // Filter out rows where name, nativeName, and seqId are all empty
      const validRows = rows.slice(1).filter((columns) => {
        const name = columns[4] ? columns[4].trim() : '';
        const nativeName = columns[3] ? columns[3].trim() : '';
        const seqId = columns[1] ? columns[1].trim() : '';
        return name.length > 0 || nativeName.length > 0 || seqId.length > 0;
      });

      const formattedData: MenuItem[] = validRows.map((columns, index) => {
        const seqId = columns[1] ? columns[1].trim() : '';
        const rawStock = columns[9] ? columns[9].trim() : '';
        const parsedStock = rawStock ? parseInt(rawStock.replace(/[^\d-]/g, ''), 10) : NaN;
        const stock = isNaN(parsedStock) ? 0 : parsedStock;

        const priceFullStr = columns[7] ? columns[7].trim() : '';
        const priceHalfStr = columns[6] ? columns[6].trim() : '';
        const numericPrice =
          parseFloat(priceFullStr && priceFullStr !== '-' ? priceFullStr : (priceHalfStr && priceHalfStr !== '-' ? priceHalfStr : '0')) || 0;

        const rawOffer = columns[8] ? columns[8].trim() : '';
        let discount = 0;
        if (rawOffer) {
          const discountMatch = rawOffer.match(/(\d+)\s*%/);
          if (discountMatch) {
            discount = parseInt(discountMatch[1], 10);
          }
        }

        // Column N (13: Instagram), Column O (14: Facebook), Column P (15: YouTube), Column K (10: Legacy)
        const rawColN_Insta = colIndexInstagram !== -1 && columns[colIndexInstagram] ? columns[colIndexInstagram].trim() : (columns[13] ? columns[13].trim() : '');
        const rawColO_Fb = colIndexFacebook !== -1 && columns[colIndexFacebook] ? columns[colIndexFacebook].trim() : (columns[14] ? columns[14].trim() : '');
        const rawColP_Yt = colIndexYoutubeP !== -1 && columns[colIndexYoutubeP] ? columns[colIndexYoutubeP].trim() : (columns[15] ? columns[15].trim() : '');
        const rawCol10 = columns[colIndexCol10] ? columns[colIndexCol10].trim() : '';

        let instagramUrl = '';
        let facebookUrl = '';
        let youtubeUrl = '';

        const cleanUrl = (url?: string) => {
          if (!url || typeof url !== 'string') return '';
          const trimmed = url.trim();
          if (!trimmed || trimmed === '-' || trimmed === '0' || trimmed.length < 5) return '';
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
          return '';
        };

        // 1. Column N (Instagram)
        const cleanedN = cleanUrl(rawColN_Insta);
        if (cleanedN) {
          const lower = cleanedN.toLowerCase();
          if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
            facebookUrl = cleanedN;
          } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
            youtubeUrl = cleanedN;
          } else {
            instagramUrl = cleanedN;
          }
        }

        // 2. Column O (Facebook)
        const cleanedO = cleanUrl(rawColO_Fb);
        if (cleanedO) {
          const lower = cleanedO.toLowerCase();
          if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
            instagramUrl = cleanedO;
          } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
            youtubeUrl = cleanedO;
          } else {
            facebookUrl = cleanedO;
          }
        }

        // 3. Column P (YouTube)
        const cleanedP = cleanUrl(rawColP_Yt);
        if (cleanedP) {
          const lower = cleanedP.toLowerCase();
          if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
            instagramUrl = cleanedP;
          } else if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
            facebookUrl = cleanedP;
          } else {
            youtubeUrl = cleanedP;
          }
        }

        // 4. Legacy Column 10 (K): fallback if specific columns weren't set for this dish
        const cleanedCol10 = cleanUrl(rawCol10);
        if (cleanedCol10) {
          const lower = cleanedCol10.toLowerCase();
          if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
            if (!instagramUrl) instagramUrl = cleanedCol10;
          } else if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
            if (!facebookUrl) facebookUrl = cleanedCol10;
          } else {
            if (!youtubeUrl) youtubeUrl = cleanedCol10;
          }
        }

        const imageUrlCol = columns[11] ? columns[11].trim() : ((columns as any)['image_url'] || '');
        const rawKgGram = columns[colIndexKgGram] ? columns[colIndexKgGram].trim() : '';
        const cleanKgGram =
          rawKgGram && rawKgGram !== '-' && rawKgGram !== '0' && rawKgGram !== '0.0'
            ? rawKgGram
            : undefined;

        const rawPiece = columns[colIndexPiece] ? columns[colIndexPiece].trim() : '';

        const rawCategory = columns[2] ? columns[2].trim() : 'Other';
        const normalizedCategory = rawCategory.toLowerCase() === 'bakery' ? 'Bakery' : rawCategory;

        return {
          id: (index + 1).toString(),
          category: normalizedCategory,
          nativeName: columns[3] ? columns[3].trim() : '',
          name: columns[4] ? columns[4].trim() : '',
          portion: rawPiece || '-',
          piece: rawPiece,
          priceHalf: priceHalfStr,
          priceFull: priceFullStr,
          price: numericPrice,
          offer: rawOffer,
          discount: discount,
          stock: stock,
          gst: 0,
          imageName: seqId,
          image_url: imageUrlCol,
          youtubeVideo: youtubeUrl || undefined,
          instagramVideo: instagramUrl || undefined,
          facebookVideo: facebookUrl || undefined,
          kgGram: cleanKgGram
        };
      });

      // Ensure Bakery items exist so the new Bakery category is ready and browsable
      const hasBakeryInSheet = formattedData.some(
        (item) => item.category.trim().toLowerCase() === 'bakery'
      );
      const finalData = hasBakeryInSheet
        ? formattedData
        : [...formattedData, ...DEFAULT_BAKERY_ITEMS];

      // Dynamic column resolution for Column Q (delivery value) and Column R (delivery discription)
      const qColIndex = headers.findIndex((h) =>
        typeof h === 'string' && /delivery\s*(?:val|charge|fee|cost|price)/i.test(h.trim())
      );
      const colIndexDeliveryValue = qColIndex !== -1 ? qColIndex : 16;

      const rColIndex = headers.findIndex((h) =>
        typeof h === 'string' && /delivery\s*(?:disc|desc)/i.test(h.trim())
      );
      const colIndexDeliveryDesc = rColIndex !== -1 ? rColIndex : 17;

      let parsedFee = 40;
      let parsedDesc = 'If you take 300 rupay item , you can take free delivery';

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const valQ = row[colIndexDeliveryValue] ? row[colIndexDeliveryValue].trim() : '';
        const valR = row[colIndexDeliveryDesc] ? row[colIndexDeliveryDesc].trim() : '';

        if (valQ) {
          const num = parseFloat(valQ.replace(/[^\d.]/g, ''));
          if (!isNaN(num)) {
            parsedFee = num;
          }
        }
        if (valR) {
          parsedDesc = valR;
        }
        if (valQ || valR) break;
      }

      // Check if description has a threshold, e.g. "300 rupay" or "300"
      let threshold: number | null = null;
      const thresholdMatch = parsedDesc.match(/(\d+)\s*(?:rupay|rupee|rs|inr|₹)/i);
      if (thresholdMatch) {
        threshold = parseFloat(thresholdMatch[1]);
      } else {
        const genericMatch = parsedDesc.match(/(?:above|over|take|orders?\s+above|min|minimum)\s*(\d{2,5})/i);
        if (genericMatch) {
          threshold = parseFloat(genericMatch[1]);
        }
      }

      const newDeliveryConfig: DeliveryConfig = {
        deliveryFee: parsedFee,
        deliveryDescription: parsedDesc,
        freeDeliveryThreshold: threshold ?? 300,
      };

      setDeliveryConfig(newDeliveryConfig);
      setData(finalData);
      setError(null);
      setIsOffline(false);
      setLoading(false);

      // Save to offline cache
      try {
        localStorage.setItem(CACHE_MENU_KEY, JSON.stringify(finalData));
        localStorage.setItem(CACHE_DELIVERY_KEY, JSON.stringify(newDeliveryConfig));
      } catch (e) {}
    } catch (err) {
      console.warn('Network issue fetching menu data:', err);
      setIsOffline(true);
      // Fallback: check if we already have data or can get from cache
      const cached = getInitialCachedMenu();
      if (data.length > 0) {
        // Keep existing loaded data, do not crash UI
        setError(null);
      } else if (cached.length > 0) {
        setData(cached);
        setError(null);
      } else {
        setError('No internet connection');
      }
      setLoading(false);
    }
  };

  const deductStockLocally = (stockMap: Record<string, number>) => {
    setData((prev) =>
      prev.map((item) => {
        if (typeof stockMap[item.id] === 'number') {
          return { ...item, stock: stockMap[item.id] };
        }
        if (typeof stockMap[item.name] === 'number') {
          return { ...item, stock: stockMap[item.name] };
        }
        return item;
      })
    );
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        fetchData();
      }
    }, 12000);

    const handleOnline = () => {
      setIsOffline(false);
      fetchData();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { data, loading, error, refresh: fetchData, deductStockLocally, deliveryConfig, isOffline };
}
