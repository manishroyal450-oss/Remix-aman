/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useMenuData } from './hooks/useMenuData';
import MenuItemComponent from './components/MenuItem';
import BottomNavBar, { NavTab } from './components/BottomNavBar';
import ProfileSection from './components/ProfileSection';
import CartSection from './components/CartSection';
import { PromoBanner } from './components/PromoBanner';
import { CategoryStoryRow } from './components/CategoryStoryRow';
import { HorizontalFeaturedList } from './components/HorizontalFeaturedList';
import { 
  Search, ShoppingCart, MessageCircle, X, Trash2, Lock, 
  ExternalLink, RefreshCw, ShieldCheck, LogOut, Check, ArrowRight, 
  Paperclip, Plus, Minus, Tag, Send, MapPin, Sparkles, ChevronDown, Percent,
  Play, Video, Download, Smartphone
} from 'lucide-react';
import { 
  MenuItem, CartItem, UserProfile, formatPieceUnit, 
  getItemUnitPrice, hasBothPortions, getCleanItemName, parsePriceNumber,
  openWhatsAppChat
} from './data';
import { submitOrderAndDeductStock, getScriptUrl, setScriptUrl } from './services/orderService';
import headerBgImage from './assets/images/header_3d_sweets_bg_1786805389446.jpg';
import 'swiper/element/bundle';

export default function App() {
  const { data: menuData, loading, error, refresh, deductStockLocally } = useMenuData();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [customScriptUrl, setCustomScriptUrl] = useState(() => getScriptUrl());
  const [ownerOrderWhatsApp, setOwnerOrderWhatsApp] = useState(() => {
    try {
      return localStorage.getItem('aman_owner_whatsapp') || '917017373371';
    } catch {
      return '917017373371';
    }
  });
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner Privacy state
  const [ownerPrivacyItems, setOwnerPrivacyItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('aman_owner_privacy_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [ownerAttachedFile, setOwnerAttachedFile] = useState<File | null>(null);
  const [ownerTargetPhone, setOwnerTargetPhone] = useState('');
  const [ownerOfferNote, setOwnerOfferNote] = useState('');
  const ownerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aman_sweet_profile');
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load user profile in App', e);
    }
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const baseCategories = Array.from(new Set(menuData.map(item => item.category)));
  const hasAnyVideo = menuData.some(item => Boolean(item.youtubeVideo && item.youtubeVideo.trim() !== '' && item.youtubeVideo.trim() !== '-'));
  const categories = hasAnyVideo ? ['All', 'YouTube Video', ...baseCategories] : ['All', ...baseCategories];
  const [quickFilter, setQuickFilter] = useState<'all' | 'offers' | 'under100' | 'video'>('all');

  const filteredData = menuData.filter(item => {
    const isItemVideo = Boolean(item.youtubeVideo && item.youtubeVideo.trim() !== '' && item.youtubeVideo.trim() !== '-');

    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'YouTube Video') {
      matchesCategory = isItemVideo;
    } else {
      matchesCategory = item.category.toLowerCase() === selectedCategory.toLowerCase();
    }

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.nativeName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesQuick = true;
    if (quickFilter === 'offers') {
      matchesQuick = Boolean(item.offer && item.offer.trim() !== '-' && item.offer.trim() !== '');
    } else if (quickFilter === 'under100') {
      const price = parseFloat(item.priceFull || item.priceHalf || String(item.price) || '0');
      matchesQuick = price > 0 && price <= 100;
    } else if (quickFilter === 'video') {
      matchesQuick = isItemVideo;
    }

    return matchesCategory && matchesSearch && matchesQuick;
  });

  // Featured items for horizontal side-scrolling list
  const featuredOfferItems = menuData.filter(item => 
    item.offer && item.offer.trim() !== '-' && item.offer.trim() !== ''
  );
  const featuredItems = featuredOfferItems.length >= 4
    ? featuredOfferItems
    : [...featuredOfferItems, ...menuData.filter(i => !featuredOfferItems.includes(i))].slice(0, 10);

  const handleUpdateHorizontalQuantity = (item: CartItem, delta: number) => {
    if (delta > 0) {
      addToCart(item, item.selectedPortion as any);
    } else {
      decreaseQuantity(item.id);
    }
  };

  const addToCart = (item: MenuItem | CartItem, portion?: 'Half' | 'Full') => {
    const bothPortions = hasBothPortions(item);
    // Only items with BOTH Half and Full prices have portion variations
    const chosenPortion: 'Half' | 'Full' | undefined = bothPortions
      ? (portion || ('selectedPortion' in item && (item.selectedPortion === 'Half' || item.selectedPortion === 'Full') ? (item.selectedPortion as 'Half' | 'Full') : 'Half'))
      : undefined;

    const baseId = item.id.split('-')[0];
    const cartItemId = chosenPortion ? `${baseId}-${chosenPortion}` : baseId;
    const unitPrice = getItemUnitPrice(item, chosenPortion);

    setCart(prev => {
      const existing = prev.find(i => i.id === cartItemId);
      if (existing) {
        showNotification(`${item.name}${chosenPortion ? ` (${chosenPortion})` : ''} quantity updated in cart`);
        return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + 1, unitPrice, price: unitPrice } : i);
      }
      showNotification(`${item.name}${chosenPortion ? ` (${chosenPortion})` : ''} added to cart`);
      return [
        ...prev,
        {
          ...item,
          id: cartItemId,
          quantity: 1,
          selectedPortion: chosenPortion,
          unitPrice: unitPrice,
          price: unitPrice
        }
      ];
    });
  };

  const decreaseQuantity = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleAddToOwnerPrivacy = (item: MenuItem) => {
    setOwnerPrivacyItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      let updated: CartItem[];
      if (exists) {
        updated = prev.filter(i => i.id !== item.id);
        showNotification(`Removed "${item.name}" from Owner Privacy`);
      } else {
        updated = [...prev, { ...item, quantity: 1 }];
        showNotification(`Added "${item.name}" to Owner Privacy!`);
      }
      try {
        localStorage.setItem('aman_owner_privacy_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleUpdateOwnerItemQty = (itemId: string, delta: number) => {
    setOwnerPrivacyItems(prev => {
      const updated = prev.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      });
      try {
        localStorage.setItem('aman_owner_privacy_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleRemoveFromOwnerPrivacy = (itemId: string) => {
    setOwnerPrivacyItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      try {
        localStorage.setItem('aman_owner_privacy_items', JSON.stringify(updated));
      } catch (e) {}
      showNotification('Removed item from Owner Privacy');
      return updated;
    });
  };

  const handleClearOwnerPrivacy = () => {
    setOwnerPrivacyItems([]);
    try {
      localStorage.removeItem('aman_owner_privacy_items');
    } catch (e) {}
    showNotification('Cleared all items in Owner Privacy');
  };

  const handleShareOwnerOffer = async () => {
    if (ownerPrivacyItems.length === 0) {
      showNotification('Please add items to Owner Privacy first (click "By owner" in catalogue)');
      return;
    }

    const itemsText = ownerPrivacyItems.map(item => {
      const unit = getItemUnitPrice(item);
      const itemTot = unit * item.quantity;
      return `• ${item.name} (${item.quantity}x) - ₹${itemTot}${item.offer ? ` [Offer: ${item.offer}]` : ''}`;
    }).join('\n');

    const total = ownerPrivacyItems.reduce((sum, item) => {
      return sum + (getItemUnitPrice(item) * item.quantity);
    }, 0);

    let text = `🌟 *AMAN SWEET - EXCLUSIVE OWNER OFFER* 🌟\n\n${itemsText}\n\n*Total Offer Amount: ₹${total}*`;
    if (ownerOfferNote.trim()) {
      text += `\n\n*Special Offer Details:* ${ownerOfferNote.trim()}`;
    }
    text += `\n\n📍 *Aman Sweet* - Live Digital Menu & Sweets\n_Sent directly by Store Owner_`;

    const cleanPhone = ownerTargetPhone.replace(/\D/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';

    try {
      if (ownerAttachedFile && navigator.canShare && navigator.canShare({ files: [ownerAttachedFile] })) {
        try {
          await navigator.share({
            files: [ownerAttachedFile],
            text: text,
            title: 'Aman Sweet - Exclusive Offer'
          });
          showNotification('Offer shared successfully on WhatsApp!');
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }

      openWhatsAppChat(phoneParam, text);
      showNotification('Opening WhatsApp to send offer...');
    } catch (err) {
      console.error('Failed to share owner offer:', err);
      openWhatsAppChat(phoneParam, text);
    }
  };

  const handleOpenOwner = () => {
    setIsOwnerModalOpen(true);
    setPasswordError(false);
  };

  const handleOwnerLogin = (e: FormEvent) => {
    e.preventDefault();
    if (ownerPasswordInput.trim() === 'Aman') {
      setIsOwnerLoggedIn(true);
      setPasswordError(false);
      setOwnerPasswordInput('');
      showNotification('Owner access granted!');
    } else {
      setPasswordError(true);
    }
  };

  const handleSyncMenu = async () => {
    setIsSyncing(true);
    try {
      await refresh();
      showNotification('Menu synchronized with Google Sheets!');
    } catch {
      showNotification('Failed to sync menu');
    } finally {
      setIsSyncing(false);
    }
  };

  const submitOrderToBackend = async () => {
    if (cart.length === 0) return null;
    setIsSubmittingOrder(true);
    showNotification('Submitting order to Google Apps Script...');

    // Group quantities by base item clean name so that Apps Script finds the exact menu item in Google Sheet
    const qtyMap: Record<string, number> = {};
    cart.forEach(item => {
      const cleanName = getCleanItemName(item.name);
      qtyMap[cleanName] = (qtyMap[cleanName] || 0) + (item.quantity || 1);
    });

    const customerName = userProfile?.fullName
      ? `${userProfile.fullName} ${userProfile.lastName || ''}`.trim()
      : 'Customer';
    const customerPhone = userProfile?.contactNumber || '';

    const payload = {
      customerName: customerName,
      phone: customerPhone,
      items: Object.entries(qtyMap).map(([name, qty]) => ({
        name: name,
        qty: qty
      })),
      totalAmount: Math.round(Number(totalCartPrice || 0))
    };

    console.log('Sending payload to sheet:', payload);

    try {
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwuCsQgq4B08VrJVO1xw3PkjjNYSJYwNZqYybUAPutgRdlRcwnRo4sau3w2axopNkr0ZQ/exec';
      const targetUrl = customScriptUrl && customScriptUrl.trim() ? customScriptUrl.trim() : SCRIPT_URL;

      // In browsers, Google Apps Script Web Apps return a 302 redirect to script.googleusercontent.com
      // which does not send CORS headers. Using mode: 'no-cors' with 'text/plain;charset=utf-8' allows
      // the browser to send the full POST body without failing on the cross-origin redirect ("Failed to fetch").
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      // Deduct stock locally for immediate visual update
      const stockMap: Record<string, number> = {};
      menuData.forEach(menuItem => {
        const cleanName = getCleanItemName(menuItem.name);
        const orderedQty = qtyMap[cleanName] || qtyMap[menuItem.name.trim()] || 0;
        if (orderedQty > 0) {
          const currentStock = typeof menuItem.stock === 'number' ? menuItem.stock : 100;
          const remaining = Math.max(0, currentStock - orderedQty);
          stockMap[menuItem.id] = remaining;
          stockMap[menuItem.name] = remaining;
          stockMap[cleanName] = remaining;
        }
      });
      deductStockLocally(stockMap);

      // Trigger background sync to confirm with Google Sheets
      setTimeout(() => {
        refresh();
      }, 2000);

      return { success: true, payload };
    } catch (err) {
      console.warn('Communication notice with Google Apps Script:', err);
      // Still update local stock so user order is never blocked
      const stockMap: Record<string, number> = {};
      menuData.forEach(menuItem => {
        const cleanName = getCleanItemName(menuItem.name);
        const orderedQty = qtyMap[cleanName] || qtyMap[menuItem.name.trim()] || 0;
        if (orderedQty > 0) {
          const currentStock = typeof menuItem.stock === 'number' ? menuItem.stock : 100;
          const remaining = Math.max(0, currentStock - orderedQty);
          stockMap[menuItem.id] = remaining;
          stockMap[menuItem.name] = remaining;
          stockMap[cleanName] = remaining;
        }
      });
      deductStockLocally(stockMap);
      return { success: true };
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const performShareOrder = async () => {
    // 1. Calculate remaining stock and submit to Google Apps Script backend
    await submitOrderToBackend();

    const qtyMap: Record<string, number> = {};
    cart.forEach(item => {
      const cleanName = getCleanItemName(item.name);
      qtyMap[cleanName] = (qtyMap[cleanName] || 0) + (item.quantity || 1);
    });

    const message = cart.map(item => {
      const cleanName = getCleanItemName(item.name);
      const orderedQty = qtyMap[cleanName] || item.quantity;
      const currentStock = typeof item.stock === 'number' ? item.stock : 100;
      const remainingStock = Math.max(0, currentStock - orderedQty);
      const unit = getItemUnitPrice(item, item.selectedPortion);
      const portionStr = item.selectedPortion ? ` (${item.selectedPortion})` : '';
      const kgGramStr = item.kgGram ? ` [${item.kgGram}]` : '';
      const pieceStr = formatPieceUnit(item.piece || item.portion);
      return `${item.name}${portionStr}${kgGramStr} (${item.quantity}x @ ₹${unit}${pieceStr})${item.offer ? ` - Offer: ${item.offer}` : ''} = ₹${unit * item.quantity} (Remaining Stock: ${remainingStock})`;
    }).join('\n');
    const total = totalCartPrice;
    
    let text = `*Aman Sweet* - Order Request:\n\n${message}\n\n*Total: ₹${total}*`;
    if (userProfile?.fullName) {
      text += `\n\n*Customer Details:*\nName: ${userProfile.fullName} ${userProfile.lastName || ''}\nContact: ${userProfile.contactNumber}\nAddress: ${userProfile.address}\nPin Code: ${userProfile.pinCode}`;
    }
    text += `\n\n_Thank you for ordering with us!_`;
    
    const cleanOwnerPhone = (ownerOrderWhatsApp || '917017373371').replace(/\D/g, '');
    const phoneParam = cleanOwnerPhone.length === 10 ? `91${cleanOwnerPhone}` : cleanOwnerPhone;

    try {
      if (selectedFile && navigator.canShare && navigator.canShare({ files: [selectedFile] })) {
        try {
          await navigator.share({
            files: [selectedFile],
            text: text,
            title: 'Aman Sweet Order'
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Error sharing:', error);
            openWhatsAppChat(phoneParam, text);
          }
        }
      } else {
        openWhatsAppChat(phoneParam, text);
      }
    } finally {
      setCart([]);
      setSelectedFile(null);
      showNotification('Order placed & sent to Owner (+91 70173 73371)!');
    }
  };

  const handleDirectOrderSubmit = async () => {
    if (cart.length === 0) {
      showNotification('Your cart is empty!');
      return;
    }
    const result = await submitOrderToBackend();
    if (result) {
      showNotification('✓ Order submitted & stock deducted in Google Sheet!');
      setCart([]);
      setSelectedFile(null);
    } else {
      showNotification('Order recorded. (Check backend URL if sync failed)');
    }
  };

  const handleShareOrderClick = () => {
    // Directly submit and share on WhatsApp without requiring any password
    performShareOrder();
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-600">Loading menu...</div>;
  }

  if (error) {
    return <div className="p-12 text-center text-red-600">Error loading menu: {error}</div>;
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (getItemUnitPrice(item, item.selectedPortion) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-teal-700 text-white py-2.5 px-5 rounded-xl shadow-2xl animate-pulse text-sm font-medium">
          {notification}
        </div>
      )}

      {/* Top Banner Header with Zomato Style Navigation */}
      <header className="relative pt-3 pb-5 px-3 sm:px-6 text-white overflow-hidden bg-gradient-to-r from-red-700 via-rose-700 to-red-800 shadow-md">
        <img 
          src={headerBgImage} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" 
        />
        <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Location & Action Bar (Zomato Style) */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-xs">
                <MapPin size={19} className="text-amber-300" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-black tracking-wider text-amber-200 uppercase">
                  <span>Home</span>
                  <ChevronDown size={11} />
                </div>
                <div className="text-sm sm:text-base text-white font-bold tracking-tight truncate leading-tight">
                  Aman Sweet & Restaurant
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Veg Indicator Badge */}
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-400/40 text-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>100% PURE VEG</span>
              </div>

              {/* By owner Button */}
              <button 
                id="owner-button"
                type="button"
                className="flex items-center gap-1.5 bg-white/95 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-white transition"
                onClick={handleOpenOwner}
                title="Owner Privacy and Dashboard"
              >
                <Lock size={12} className="text-red-700" />
                <span>By owner</span>
                {ownerPrivacyItems.length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold leading-none">
                    {ownerPrivacyItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar on Home Tab */}
          {activeTab === 'home' && (
            <div className="mt-2 relative max-w-xl mx-auto">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder='Search "Gulab Jamun", "Kheer", "Momos", "Pizza"...'
                  className="w-full pl-10 pr-10 py-3 rounded-2xl text-gray-900 bg-white shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3.5 text-red-600" size={19} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                    title="Clear Search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2.5 px-1 text-[11px]">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-white/80 font-medium whitespace-nowrap">Popular:</span>
                  {['Gulab Jamun', 'Kheer', 'Chowmein', 'Pizza'].map((dish) => (
                    <button
                      key={dish}
                      onClick={() => setSearchQuery(dish)}
                      className="bg-white/15 hover:bg-white/25 text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer"
                    >
                      {dish}
                    </button>
                  ))}
                </div>

                <a
                  href="https://amansweet.lovable.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 bg-white text-red-700 hover:bg-amber-100 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition whitespace-nowrap"
                >
                  Download App
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area based on activeTab */}
      <main>
        {activeTab === 'home' && (
          <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            {/* 1. Zomato Style Promotional Banner */}
            <PromoBanner />

            {/* Minimized Compact Android APK Download Bar */}
            <a
              id="top-apk-download-card"
              href="https://amansweet.lovable.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 mb-4 flex items-center justify-between gap-2.5 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-200/90 rounded-2xl p-2.5 sm:p-3.5 shadow-xs hover:shadow-sm active:scale-[0.99] transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition">
                  <Download size={18} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                      Download Aman Sweet App
                    </span>
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                      APK
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 truncate font-medium mt-0.5">
                    Phone me APK install karein & fast delivery ka aanand lein
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs shrink-0 group-hover:from-red-700 group-hover:to-rose-700 transition">
                <span>Download</span>
                <ExternalLink size={12} className="opacity-90" />
              </div>
            </a>

            {/* 2. Zomato Circular Dish Category Row */}
            <CategoryStoryRow
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              menuData={menuData}
            />

            {/* 3. Horizontal Side-Scrolling Featured Section ("jo image side scroll hai") */}
            <HorizontalFeaturedList
              title="Recommended For You"
              subtitle="Popular traditional sweets and special chef recipes"
              items={featuredItems}
              cart={cart}
              addToCart={addToCart}
              onUpdateQuantity={handleUpdateHorizontalQuantity}
            />

            {/* 4. Quick Filter Chips Bar */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none px-1">
              <button
                onClick={() => setQuickFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  quickFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                All Dishes
              </button>
              <button
                onClick={() => setQuickFilter('offers')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'offers'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Percent size={12} />
                <span>Special Offers</span>
              </button>
              <button
                onClick={() => setQuickFilter('under100')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  quickFilter === 'under100'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                ₹ Under 100
              </button>
              <button
                id="filter-youtube-videos"
                onClick={() => setQuickFilter(quickFilter === 'video' ? 'all' : 'video')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  quickFilter === 'video'
                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
                title="Show only items with YouTube video links"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  quickFilter === 'video' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}>
                  <Play size={8} className="fill-current ml-0.5" />
                </div>
                <span>YouTube Video</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  quickFilter === 'video' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {menuData.filter(i => Boolean(i.youtubeVideo && i.youtubeVideo.trim() !== '' && i.youtubeVideo.trim() !== '-')).length}
                </span>
              </button>
            </div>

            {/* 5. Vertical Scrolling Menu Section ("or vertically scroll hai") */}
            <section className="mt-2">
              <div className="flex items-center justify-between px-1 mb-3.5">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    {selectedCategory === 'All' 
                      ? (quickFilter === 'video' ? 'Dishes with YouTube Recipe Videos' : 'All Dishes Delivering To You')
                      : `${selectedCategory} Specials`}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {quickFilter === 'video' || selectedCategory === 'YouTube Video'
                      ? `Showing ${filteredData.length} items with video links`
                      : `Showing ${filteredData.length} fresh items from live catalog`}
                  </p>
                </div>
                {(selectedCategory !== 'All' || quickFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setQuickFilter('all');
                    }}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {filteredData.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-xs">
                  <div className="text-3xl mb-2">🍽️</div>
                  <h3 className="text-base font-bold text-gray-800">No items found</h3>
                  <p className="text-xs text-gray-500 mt-1">Try searching for a different dish name or category</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setQuickFilter('all');
                    }}
                    className="mt-4 px-4 py-1.5 bg-red-600 text-white rounded-full text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredData.map(item => (
                    <MenuItemComponent 
                      key={item.id} 
                      item={item} 
                      addToCart={addToCart}
                      onAddToOwnerPrivacy={handleAddToOwnerPrivacy}
                      isInOwnerPrivacy={ownerPrivacyItems.some(p => p.id === item.id)}
                    />
                  ))}
                </div>
              )}

              {/* Bottom APK Download Banner (Circled in Screenshot 2) */}
              <div className="mt-8 mb-4 bg-gradient-to-br from-amber-500/10 via-red-50 to-orange-50 border-2 border-red-200/90 rounded-3xl p-5 sm:p-7 text-center shadow-xs">
                <div className="w-13 h-13 mx-auto bg-gradient-to-tr from-red-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md mb-3">
                  <Download size={26} className="stroke-[2.5]" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Download Aman Sweet App (APK)
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mt-1 mb-3.5 font-medium">
                  Apne phone me Aman Sweet official APK install karein aur superfast food & sweets delivery ka aanand lein.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px] font-semibold text-gray-700 bg-white/80 py-1.5 px-3 rounded-full border border-red-100 w-fit mx-auto shadow-2xs">
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]">1</span>
                    Tap Download
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-amber-700 font-bold">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">2</span>
                    Open Link
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">3</span>
                    Install & Enjoy
                  </span>
                </div>

                <a
                  id="bottom-apk-download-btn"
                  href="https://amansweet.lovable.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-98 cursor-pointer w-full sm:w-auto"
                >
                  <Download size={18} />
                  <span>Download APK Now</span>
                  <ExternalLink size={14} className="opacity-80 ml-0.5" />
                </a>
              </div>
            </section>

            {/* Zomato Style Floating Bottom Cart Bar */}
            {cart.length > 0 && (
              <div className="fixed bottom-20 left-0 right-0 z-30 px-4 max-w-lg mx-auto pointer-events-none">
                <div
                  id="floating-cart-button"
                  onClick={() => setActiveTab('cart')}
                  className="pointer-events-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between transition-transform active:scale-98 cursor-pointer border border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <ShoppingCart size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-bold text-red-100 tracking-wider">
                        {totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
                      </div>
                      <div className="text-base font-black">₹{totalCartPrice}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white text-red-600 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs">
                    <span>View Cart</span>
                    <ArrowRight size={14} className="stroke-[3]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cart' && (
          <CartSection
            cart={cart}
            addToCart={addToCart}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            totalCartPrice={totalCartPrice}
            totalCartCount={totalCartCount}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onShareWhatsApp={handleShareOrderClick}
            onGoToHome={() => setActiveTab('home')}
            userProfile={userProfile}
            onGoToProfile={() => setActiveTab('profile')}
            isSubmitting={isSubmittingOrder}
            onSubmitDirectOrder={handleDirectOrderSubmit}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSection
            onProfileSave={(updated) => setUserProfile(updated)}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        hasProfile={!!userProfile}
      />



      {/* Owner Management Modal */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Owner Portal</h2>
              </div>
              <button 
                onClick={() => setIsOwnerModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {!isOwnerLoggedIn ? (
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <p className="text-xs text-gray-600">
                  Please enter the owner password to access administrative controls and manage menu data.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Owner Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      placeholder="Enter password"
                      value={ownerPasswordInput}
                      onChange={(e) => {
                        setOwnerPasswordInput(e.target.value);
                        setPasswordError(false);
                      }}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium">Incorrect password. Please try again.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOwnerModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock size={14} />
                    <span>Unlock Portal</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-800 text-xs">
                  <Check size={16} className="text-green-600 flex-shrink-0" />
                  <span>Authenticated as <strong>Aman Sweet Owner</strong></span>
                </div>

                {/* Direct Google Sheets Link & Quick Sync */}
                <div className="flex items-center gap-2">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1otN1s4qs_QfF7jfK4uy-uTFOKhflZUXao7vTLrzQBK8/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-between p-3 bg-gray-50 hover:bg-teal-50 hover:border-teal-200 border border-gray-200 rounded-xl transition group"
                  >
                    <div>
                      <p className="font-bold text-xs text-gray-800 group-hover:text-teal-900">Edit Menu in Google Sheets</p>
                      <p className="text-[11px] text-gray-500">Update item prices, offers, and details</p>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-teal-600 transition" />
                  </a>
                  <button
                    type="button"
                    onClick={handleSyncMenu}
                    disabled={isSyncing}
                    title="Sync latest prices from Google Sheet"
                    className="p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 rounded-xl text-gray-500 hover:text-teal-700 transition cursor-pointer"
                  >
                    <RefreshCw size={16} className={`transition ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>

                {/* OWNER PRIVACY SECTION - Replaces Sync button */}
                <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/40 border border-teal-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock size={15} className="text-teal-700" />
                      <h3 className="font-bold text-xs text-teal-950 uppercase tracking-wide">
                        Owner Privacy Items ({ownerPrivacyItems.length})
                      </h3>
                    </div>
                    {ownerPrivacyItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearOwnerPrivacy}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Item List in Owner Privacy */}
                  {ownerPrivacyItems.length === 0 ? (
                    <div className="bg-white/95 border border-dashed border-teal-200 rounded-xl p-4 text-center">
                      <Tag size={20} className="mx-auto text-teal-600 mb-1.5 opacity-80" />
                      <p className="text-xs font-semibold text-gray-800">No items selected yet</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                        In the catalogue, click the <strong>"By owner"</strong> button on the corner of any item to add it here and send custom offers.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {ownerPrivacyItems.map(item => {
                        const unit = getItemUnitPrice(item);
                        return (
                          <div key={item.id} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-teal-700 font-semibold">
                                ₹{unit} each {item.offer ? `• ${item.offer}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOwnerItemQty(item.id, -1)}
                                  className="p-1 text-gray-600 hover:text-teal-700 transition cursor-pointer"
                                  title="Decrease"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOwnerItemQty(item.id, 1)}
                                  className="p-1 text-gray-600 hover:text-teal-700 transition cursor-pointer"
                                  title="Increase"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span className="text-xs font-bold text-gray-900 w-12 text-right">
                                ₹{unit * item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromOwnerPrivacy(item.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center px-1 pt-1 text-xs">
                        <span className="font-semibold text-gray-600">Total Offer Amount:</span>
                        <span className="font-bold text-teal-800 text-sm">
                          ₹{ownerPrivacyItems.reduce((sum, i) => sum + (getItemUnitPrice(i) * i.quantity), 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Attach File Option (like Cart in Image 1) */}
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900 mb-1">
                      Attach Offer File / Photo (Optional)
                    </label>
                    <div
                      onClick={() => ownerFileInputRef.current?.click()}
                      className="p-3 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white rounded-xl text-center cursor-pointer transition flex items-center justify-between"
                    >
                      <input
                        type="file"
                        ref={ownerFileInputRef}
                        onChange={(e) => setOwnerAttachedFile(e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-700 truncate">
                        <Paperclip size={15} className="text-teal-600 flex-shrink-0" />
                        <span className="truncate">
                          {ownerAttachedFile ? `Attached: ${ownerAttachedFile.name}` : 'Click to attach image / offer poster / bill'}
                        </span>
                      </div>
                      {ownerAttachedFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOwnerAttachedFile(null);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 p-1"
                          title="Remove attached file"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Offer Note / Message */}
                  <div>
                    <input
                      type="text"
                      placeholder="Special discount note (e.g. 10% Festive Offer on Bulk Order)"
                      value={ownerOfferNote}
                      onChange={(e) => setOwnerOfferNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Optional Customer Phone */}
                  <div>
                    <input
                      type="tel"
                      placeholder="Customer WhatsApp Number (Optional)"
                      value={ownerTargetPhone}
                      onChange={(e) => setOwnerTargetPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5 px-1">
                      Leave blank to select any customer or group directly in WhatsApp.
                    </p>
                  </div>

                  {/* WhatsApp Share Button */}
                  <button
                    type="button"
                    id="owner-share-whatsapp-btn"
                    onClick={handleShareOwnerOffer}
                    className="w-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm">Share Offer on WhatsApp</span>
                  </button>
                </div>

                {/* Quick Menu Metrics */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                    <div className="text-lg font-bold text-teal-700">{menuData.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium">Total Items</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                    <div className="text-lg font-bold text-teal-700">{categories.length - 1}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium">Categories</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                    <div className="text-lg font-bold text-teal-700">{menuData.filter(i => i.offer).length}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium">Offers</div>
                  </div>
                </div>

                {/* Google Apps Script Backend URL Configuration */}
                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">Google Apps Script Web App URL</span>
                    <span className="text-[10px] text-teal-700 font-semibold bg-white px-2 py-0.5 rounded border border-teal-200">
                      POST /exec
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customScriptUrl}
                      onChange={(e) => setCustomScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScriptUrl(customScriptUrl);
                        showNotification('Google Apps Script URL saved!');
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Checkout / order complete posts <code>&#123; items: [&#123; name, qty &#125;], totalAmount &#125;</code> with header <code>text/plain;charset=utf-8</code> to this Web App.
                  </p>
                </div>

                {/* Owner WhatsApp Order Receiving Number Configuration */}
                <div className="bg-green-50/70 border border-green-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-900">Owner WhatsApp Order Receiving Number</span>
                    <span className="text-[10px] text-green-700 font-semibold bg-white px-2 py-0.5 rounded border border-green-200">
                      +91 70173 73371
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ownerOrderWhatsApp}
                      onChange={(e) => setOwnerOrderWhatsApp(e.target.value)}
                      placeholder="+91 70173 73371"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = ownerOrderWhatsApp.replace(/\D/g, '');
                        const formatted = clean.length === 10 ? `91${clean}` : clean;
                        localStorage.setItem('aman_owner_whatsapp', formatted);
                        setOwnerOrderWhatsApp(formatted);
                        showNotification('Owner WhatsApp number saved!');
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    When customers click &quot;Submit Order &amp; Share on WhatsApp&quot;, orders are routed directly to this number.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOwnerLoggedIn(false);
                      showNotification('Logged out from Owner Portal');
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium py-1 px-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOwnerModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 mt-10 p-6 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} Aman Sweet. All rights reserved.
      </footer>
    </div>
  );
}
