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
  unitPrice?: number;
  itemTotal?: number;
}

export interface OrderSubmissionPayload {
  customerName?: string;
  phone?: string;
  orderPreference?: string;
  orderType?: string;
  tableNumber?: string;
  pickupNote?: string;
  specialInstructions?: string;
  deliveryAddress?: string;
  items: OrderItemPayload[];
  totalAmount: number;
  itemsTotal?: number;
  coustomtotal?: number;
  customtotal?: number;
  coustomTotal?: number;
  customTotal?: number;
  totalUnits?: number;
  unit?: string;
  itemsSummary?: string;
  orderDate?: string;
}

export interface OrderSubmissionResult {
  success: boolean;
  payload: OrderSubmissionPayload;
  remainingStockMap: Record<string, number>;
}

export const GOOGLE_APPS_SCRIPT_ONE_ROW_CODE = `/**
 * AMAN SWEET & RESTAURANT - 1-ROW BILLING & STOCK DEDUCTION SCRIPT
 * Google Sheet: Extensions > Apps Script me paste karein.
 * 
 * Ise use karne se:
 * - Har order ka sara billing EK HI ROW me add hoga (e.g. 600 + 400 = 1,000)
 * - Column G (Date) me '03/10/2026' aayega
 * - Column H (coustomtotal) me pura '1000' aayega (alag-alag rows me nahi)
 * - Column I (Unit) me 'Pcs' aayega
 * - 'Restaurant Menu' sheet se stock bhi deduct hoga
 */

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Billing Sheet ko select karein (Sheet2 ya Orders)
    var billingSheet = ss.getSheetByName("Sheet2") || ss.getSheetByName("Sheet 2") || ss.getSheetByName("Orders") || ss.getActiveSheet();

    // Order ka Grand Total calculate karein (600 + 400 = 1,000)
    var grandTotal = 0;
    if (typeof data.coustomtotal === "number" && data.coustomtotal > 0) {
      grandTotal = data.coustomtotal;
    } else if (typeof data.totalAmount === "number" && data.totalAmount > 0) {
      grandTotal = data.totalAmount;
    } else if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function(item) {
        grandTotal += (item.itemTotal || ((item.unitPrice || 0) * (item.qty || 1)) || 0);
      });
    }

    var totalQty = 0;
    var itemSummaries = [];
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function(item) {
        var q = item.qty || 1;
        totalQty += q;
        itemSummaries.push(item.name + " (" + q + "x)");
      });
    }

    var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var year = now.getFullYear();
    var formattedDate = day + "/" + month + "/" + year; // e.g. 03/10/2026

    var customerName = data.customerName || "Customer";
    var customerPhone = data.phone || "";
    var unitStr = (data.unit && String(data.unit).indexOf("Pcs") !== -1) ? data.unit : (totalQty + " Pcs");

    // Dynamic Header Detection for Sheet2
    var lastRow = billingSheet.getLastRow();
    var headers = lastRow > 0 ? billingSheet.getRange(1, 1, 1, Math.max(12, billingSheet.getLastColumn())).getValues()[0] : [];

    var dateCol = -1;
    var totalCol = -1;
    var unitCol = -1;

    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "").toLowerCase().trim();
      if (h === "date") dateCol = c;
      if (h.indexOf("coustomtotal") !== -1 || h.indexOf("customtotal") !== -1 || h.indexOf("total") !== -1) {
        if (totalCol === -1) totalCol = c;
      }
      if (h === "unit") unitCol = c;
    }

    // Default column mapping agar header na mile:
    // Col G (Index 6): Date | Col H (Index 7): coustomtotal | Col I (Index 8): Unit
    if (dateCol === -1) dateCol = 6;
    if (totalCol === -1) totalCol = 7;
    if (unitCol === -1) unitCol = 8;

    var rowLength = Math.max(10, totalCol + 2);
    var rowData = new Array(rowLength);
    for (var r = 0; r < rowLength; r++) rowData[r] = "";

    var orderType = data.orderType || (data.orderPreference === "dine-in" ? ("Dine-In (" + (data.tableNumber || "Table 2") + ")") : data.orderPreference === "takeaway" ? "Takeaway" : "Delivery");
    var fullSummary = "[" + orderType + "] " + itemSummaries.join(", ");
    if (data.specialInstructions) fullSummary += " | Note: " + data.specialInstructions;

    rowData[0] = Math.max(1, lastRow); // S.No
    rowData[1] = "ORD-" + now.getTime();
    rowData[2] = customerName;
    rowData[3] = customerPhone;
    rowData[4] = fullSummary;
    rowData[5] = 0;
    rowData[dateCol] = formattedDate;
    rowData[totalCol] = grandTotal; // EK HI ROW ME PURA 1,000!
    rowData[unitCol] = unitStr;
    if (rowData.length > 9) rowData[9] = 0;

    // EK HI ROW ADD KAREIN (Multiple rows nahi)
    billingSheet.appendRow(rowData);

    // 2. Restaurant Menu Sheet se stock deduct karein
    var menuSheet = ss.getSheetByName("Restaurant Menu") || ss.getSheetByName("Sheet 2") || ss.getSheetByName("Sheet1");
    if (menuSheet && data.items && Array.isArray(data.items)) {
      var menuData = menuSheet.getDataRange().getValues();
      var stockCol = 9; // Column J (Stock)
      var nameCol = 4;  // Column E (English Name)
      var hindiCol = 3; // Column D (Hindi Name)

      data.items.forEach(function(orderedItem) {
        var orderedClean = String(orderedItem.name).toLowerCase().replace(/[^a-z0-9]/g, "");
        var orderedQty = orderedItem.qty || 1;

        for (var i = 1; i < menuData.length; i++) {
          var engName = String(menuData[i][nameCol] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          var hinName = String(menuData[i][hindiCol] || "").toLowerCase().replace(/[^a-z0-9]/g, "");

          if ((engName && engName === orderedClean) || (hinName && hinName === orderedClean)) {
            var currentStock = Number(menuData[i][stockCol]) || 0;
            var newStock = Math.max(0, currentStock - orderedQty);
            menuSheet.getRange(i + 1, stockCol + 1).setValue(newStock);
            break;
          }
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", grandTotal: grandTotal }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "online", time: new Date() }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

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

  // Aggregate quantities by clean base item name and calculate totals
  const qtyMap: Record<string, number> = {};
  const itemDetailsMap: Record<string, { unitPrice: number; itemTotal: number }> = {};

  for (const item of items) {
    const cleanName = getCleanItemName(item.name || (item as any).title || (item as any).itemName || 'Item');
    const qty = Number(item.quantity || (item as any).qty || 1);
    const unitPrice = getItemUnitPrice(item, item.selectedPortion);
    qtyMap[cleanName] = (qtyMap[cleanName] || 0) + qty;
    if (!itemDetailsMap[cleanName]) {
      itemDetailsMap[cleanName] = { unitPrice, itemTotal: unitPrice * qty };
    } else {
      itemDetailsMap[cleanName].itemTotal += unitPrice * qty;
    }
  }

  const calculatedTotal = Math.round(
    typeof providedTotal === 'number' && providedTotal > 0
      ? providedTotal
      : items.reduce((sum, item) => sum + getItemUnitPrice(item, item.selectedPortion) * item.quantity, 0)
  );

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSummary = Object.entries(qtyMap)
    .map(([name, qty]) => `${name} (${qty}x)`)
    .join(', ');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const orderDate = `${day}/${month}/${now.getFullYear()}`;

  const payload: OrderSubmissionPayload = {
    customerName: customerName || 'Customer',
    phone: phone || '',
    items: Object.entries(qtyMap).map(([name, qty]) => ({
      name,
      qty,
      unitPrice: itemDetailsMap[name]?.unitPrice || 0,
      itemTotal: itemDetailsMap[name]?.itemTotal || 0,
    })),
    totalAmount: calculatedTotal,
    itemsTotal: calculatedTotal,
    coustomtotal: calculatedTotal,
    customtotal: calculatedTotal,
    coustomTotal: calculatedTotal,
    customTotal: calculatedTotal,
    totalUnits,
    unit: `${totalUnits} Pcs`,
    itemsSummary,
    orderDate,
  };

  console.log('Sending single-row payload to sheet:', payload);

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

