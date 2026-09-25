import { CartItem, getItemUnitPrice, getCleanItemName } from '../data';

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
  customerName?: string;
  phone?: string;
  items: OrderItemPayload[];
  totalAmount: number;
}

export interface OrderSubmissionResult {
  success: boolean;
  payload: OrderSubmissionPayload;
  remainingStockMap: Record<string, number>;
}

/**
 * Submits order to Google Apps Script Web App on checkout / order complete.
 */
export async function submitOrderAndDeductStock(
  items: CartItem[],
  customUrl?: string,
  providedTotal?: number,
  customerName?: string,
  phone?: string
): Promise<OrderSubmissionResult> {
  const TARGET_URL =
    customUrl && customUrl.trim() && !customUrl.includes('AKfycbyf2i7_script_webapp_deployment_id')
      ? customUrl.trim()
      : SCRIPT_URL;

  // Aggregate quantities by clean base item name
  const qtyMap: Record<string, number> = {};
  for (const item of items) {
    const cleanName = getCleanItemName(item.name || (item as any).title || (item as any).itemName || 'Item');
    qtyMap[cleanName] = (qtyMap[cleanName] || 0) + Number(item.quantity || (item as any).qty || 1);
  }

  const payload: OrderSubmissionPayload = {
    customerName: customerName || 'Customer',
    phone: phone || '',
    items: Object.entries(qtyMap).map(([name, qty]) => ({
      name,
      qty
    })),
    totalAmount: Math.round(
      typeof providedTotal === 'number' && providedTotal > 0
        ? providedTotal
        : items.reduce((sum, item) => sum + getItemUnitPrice(item, item.selectedPortion) * item.quantity, 0)
    ),
  };

  console.log('Sending payload to sheet:', payload);

  // Compute remaining stock for local UI instant synchronization
  const remainingStockMap: Record<string, number> = {};
  for (const item of items) {
    const cleanName = getCleanItemName(item.name);
    const orderedQty = qtyMap[cleanName] || item.quantity;
    const currentStock = typeof item.stock === 'number' ? item.stock : 100;
    const remainingStock = Math.max(0, currentStock - orderedQty);
    remainingStockMap[item.id] = remainingStock;
    remainingStockMap[item.name] = remainingStock;
    remainingStockMap[cleanName] = remainingStock;
  }

  try {
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

