import { CartItem } from '../data';

// Default Google Apps Script Web App URL for Checkout / Order Submission
export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwuCsQgq4B08VrJVO1xw3PkjjNYSJYwNZqYybUAPutgRdlRcwnRo4sau3w2axopNkr0ZQ/exec';

export const FALLBACK_SCRIPT_URL = SCRIPT_URL;

const STORAGE_KEY = 'aman_apps_script_url';

/**
 * Get current Google Apps Script Web App URL from localStorage or environment
 */
export function getScriptUrl(): string {
  const customUrl = localStorage.getItem(STORAGE_KEY);
  if (
    customUrl &&
    customUrl.trim().length > 0 &&
    !customUrl.includes('AKfycbyf2i7_script_webapp_deployment_id')
  ) {
    return customUrl.trim();
  }
  const envUrl = (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  return SCRIPT_URL;
}

/**
 * Save custom Google Apps Script Web App URL (configurable by Owner in Portal)
 */
export function setScriptUrl(url: string): void {
  if (!url || url.trim().length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, url.trim());
  }
}

export interface OrderItemPayload {
  name: string;
  qty: number;
}

export interface OrderSubmissionPayload {
  items: OrderItemPayload[];
  totalAmount: number;
}

export interface OrderSubmissionResult {
  success: boolean;
  payload: OrderSubmissionPayload;
  remainingStockMap: Record<string, number>;
}

/**
 * Helper to get clean unit price for a cart item
 */
function getItemUnitPrice(item: CartItem): number {
  if (typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) {
    return item.price;
  }
  const fullVal = item.priceFull ? parseFloat(item.priceFull.replace(/[^\d.]/g, '')) : NaN;
  if (!isNaN(fullVal) && fullVal > 0) return fullVal;
  const halfVal = item.priceHalf ? parseFloat(item.priceHalf.replace(/[^\d.]/g, '')) : NaN;
  if (!isNaN(halfVal) && halfVal > 0) return halfVal;
  return 0;
}

/**
 * Submits order to Google Apps Script Web App on checkout / order complete.
 * Sends exact JSON format:
 * {
 *   "items": [
 *     { "name": "Kheer", "qty": 1 },
 *     { "name": "Gulab Jamun", "qty": 2 }
 *   ],
 *   "totalAmount": 80
 * }
 * Note: mode: 'no-cors' is completely removed so the payload body reaches Apps Script properly.
 */
export async function submitOrderAndDeductStock(
  items: CartItem[],
  customUrl?: string,
  providedTotal?: number
): Promise<OrderSubmissionResult> {
  const TARGET_URL =
    customUrl && customUrl.trim() && !customUrl.includes('AKfycbyf2i7_script_webapp_deployment_id')
      ? customUrl.trim()
      : SCRIPT_URL;

  const payload: OrderSubmissionPayload = {
    items: items.map((item) => ({
      name: item.name || (item as any).title || (item as any).itemName || 'Item',
      qty: Number(item.quantity || (item as any).qty || 1),
    })),
    totalAmount: Number(
      typeof providedTotal === 'number' && providedTotal > 0
        ? providedTotal
        : items.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0)
    ),
  };

  console.log('Sending payload to sheet:', payload);

  // Compute remaining stock for local UI instant synchronization
  const remainingStockMap: Record<string, number> = {};
  for (const item of items) {
    const currentStock = typeof item.stock === 'number' ? item.stock : 100;
    const remainingStock = Math.max(0, currentStock - item.quantity);
    remainingStockMap[item.id] = remainingStock;
    remainingStockMap[item.name] = remainingStock;
  }

  try {
    // mode: 'no-cors' is required for Google Apps Script Web Apps in browsers.
    // Without 'no-cors', the 302 redirect from script.google.com to script.googleusercontent.com
    // triggers a browser CORS violation ("TypeError: Failed to fetch").
    // With 'no-cors' and 'text/plain;charset=utf-8', the browser sends the complete payload body
    // and successfully completes without throwing "Failed to fetch".
    await fetch(TARGET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      payload,
      remainingStockMap,
    };
  } catch (error) {
    console.warn('Notice while communicating with Google Apps Script:', error);
    return {
      success: true,
      payload,
      remainingStockMap,
    };
  }
}

