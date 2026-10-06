import { useState } from 'react';
import { CartItem, UserProfile, formatPieceUnit, getItemUnitPrice, DeliveryConfig } from '../data';
import { 
  ShoppingCart, Trash2, Plus, Minus, MessageCircle, User, ArrowRight,
  UtensilsCrossed, ChevronDown, Check
} from 'lucide-react';

export type OrderPreference = 'delivery' | 'dine-in' | 'takeaway';

export const DINE_IN_TABLES = [
  'Table 2',
  'Table 3',
  'Table 4',
  'Table 5',
  'Table 6',
  'Table 7',
  'Table 8',
  'Table 9',
  'Table 10',
];

interface CartSectionProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  decreaseQuantity: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalCartPrice: number;
  totalCartCount: number;
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
  onShareWhatsApp: () => void;
  onGoToHome: () => void;
  userProfile: UserProfile | null;
  onGoToProfile: () => void;
  isSubmitting?: boolean;
  onSubmitDirectOrder?: () => void;
  deliveryConfig?: DeliveryConfig;

  // Order Preference & Customer Information Props
  orderPreference?: OrderPreference;
  onOrderPreferenceChange?: (pref: OrderPreference) => void;
  dineInTable?: string;
  onDineInTableChange?: (table: string) => void;
  pickupNote?: string;
  onPickupNoteChange?: (note: string) => void;
  specialInstructions?: string;
  onSpecialInstructionsChange?: (inst: string) => void;
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  customerPhone?: string;
  onCustomerPhoneChange?: (phone: string) => void;
  deliveryAddress?: string;
  onDeliveryAddressChange?: (addr: string) => void;
}

export default function CartSection({
  cart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  totalCartPrice,
  totalCartCount,
  onShareWhatsApp,
  onGoToHome,
  userProfile,
  onGoToProfile,
  isSubmitting = false,
  onSubmitDirectOrder,
  deliveryConfig,
  orderPreference = 'delivery',
  onOrderPreferenceChange,
  dineInTable = 'Table 2',
  onDineInTableChange,
  pickupNote = '',
  onPickupNoteChange,
  specialInstructions = '',
  onSpecialInstructionsChange,
  customerName = '',
  onCustomerNameChange,
  customerPhone = '',
  onCustomerPhoneChange,
  deliveryAddress = '',
  onDeliveryAddressChange,
}: CartSectionProps) {
  const isDelivery = orderPreference === 'delivery';
  const isDineIn = orderPreference === 'dine-in';
  const isTakeaway = orderPreference === 'takeaway';

  // Delivery fee applies only when Delivery mode is chosen
  const rawDeliveryFee = isDelivery ? (deliveryConfig?.deliveryFee ?? 0) : 0;
  const freeThreshold = isDelivery ? (deliveryConfig?.freeDeliveryThreshold ?? null) : null;
  const isFreeDelivery = !isDelivery || rawDeliveryFee === 0 || (freeThreshold !== null && totalCartPrice >= freeThreshold);
  const actualDeliveryCharge = isDelivery ? (isFreeDelivery ? 0 : rawDeliveryFee) : 0;
  const finalTotalAmount = totalCartPrice + actualDeliveryCharge;
  
  const rawDesc = deliveryConfig?.deliveryDescription ? deliveryConfig.deliveryDescription.trim() : '';
  const hasValidDescription = isDelivery && Boolean(
    rawDesc && 
    rawDesc !== '0' && 
    rawDesc !== '-' && 
    !/^none$/i.test(rawDesc) && 
    !/^null$/i.test(rawDesc)
  );

  const effectiveCustomerName = customerName || (userProfile?.fullName ? `${userProfile.fullName} ${userProfile.lastName || ''}`.trim() : '');

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} selected
          </p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Your cart is empty</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
            Looks like you haven't added anything to your cart yet. Browse our delicious sweets and snacks!
          </p>
          <button
            onClick={onGoToHome}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm transition cursor-pointer"
          >
            <span>Explore Menu</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. ORDER PREFERENCE CARD (Delivery, Dine-In, Takeaway) */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-3.5">
              Order Preference
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Delivery Button */}
              <button
                type="button"
                onClick={() => onOrderPreferenceChange && onOrderPreferenceChange('delivery')}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                  isDelivery
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-600 ring-offset-1'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl leading-none">🚀</span>
                <span>Delivery</span>
              </button>

              {/* Dine-In Button */}
              <button
                type="button"
                onClick={() => onOrderPreferenceChange && onOrderPreferenceChange('dine-in')}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                  isDineIn
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-600 ring-offset-1'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl leading-none">🍽️</span>
                <span>Dine-In</span>
              </button>

              {/* Takeaway Button */}
              <button
                type="button"
                onClick={() => onOrderPreferenceChange && onOrderPreferenceChange('takeaway')}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                  isTakeaway
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-600 ring-offset-1'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl leading-none">🛍️</span>
                <span>Takeaway</span>
              </button>
            </div>
          </div>

          {/* 2. CUSTOMER INFORMATION CARD */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Customer Information
              </h3>
              {effectiveCustomerName ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Logged in as {effectiveCustomerName.split(' ')[0]}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
                  Customer Details
                </span>
              )}
            </div>

            {/* Name Input */}
            <div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange && onCustomerNameChange(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-3 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            {/* Mobile Number Input */}
            <div>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange && onCustomerPhoneChange(e.target.value)}
                placeholder="Mobile Number"
                className="w-full px-3.5 py-3 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            {/* Dynamic Fields for DINE-IN */}
            {isDineIn && (
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    <UtensilsCrossed size={16} className="text-rose-600" />
                    <span>Select Dine-In Table</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    9 Tables
                  </span>
                </div>

                {/* Dropdown Select Box */}
                <div className="relative">
                  <select
                    value={dineInTable}
                    onChange={(e) => onDineInTableChange && onDineInTableChange(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400/30 cursor-pointer shadow-2xs pr-9"
                  >
                    <option value="Table 1">🪑 Table 1</option>
                    {DINE_IN_TABLES.map((table) => (
                      <option key={table} value={table}>
                        🪑 {table}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                {/* Direct Tap Pills */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-gray-500 font-medium">
                    Or tap your table directly:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DINE_IN_TABLES.map((table) => {
                      const isSelected = dineInTable === table;
                      return (
                        <button
                          key={table}
                          type="button"
                          onClick={() => onDineInTableChange && onDineInTableChange(table)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white font-bold shadow-xs border border-rose-600'
                              : 'bg-white hover:bg-rose-50/50 border border-gray-200 text-gray-700'
                          }`}
                        >
                          <span>🪑</span>
                          <span>{table}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Fields for TAKEAWAY */}
            {isTakeaway && (
              <div>
                <input
                  type="text"
                  value={pickupNote}
                  onChange={(e) => onPickupNoteChange && onPickupNoteChange(e.target.value)}
                  placeholder="Pickup Note / Expected Time"
                  className="w-full px-3.5 py-3 bg-white border border-rose-400 ring-2 ring-rose-100 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            )}

            {/* Dynamic Fields for DELIVERY */}
            {isDelivery && (
              <div>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => onDeliveryAddressChange && onDeliveryAddressChange(e.target.value)}
                  placeholder="Complete Delivery Address (House No, Street, Area)"
                  className="w-full px-3.5 py-3 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>
            )}

            {/* Special instructions (Available for Delivery, Dine-In, Takeaway) */}
            <div>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => onSpecialInstructionsChange && onSpecialInstructionsChange(e.target.value)}
                placeholder="Special instructions (e.g. extra cheese, less spicy)"
                className="w-full px-3.5 py-3 bg-gray-50/70 border border-gray-200/90 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Cart items list */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 divide-y divide-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Items in Cart ({cart.length})
            </h4>
            {cart.map(item => {
              const unitPrice = getItemUnitPrice(item, item.selectedPortion);
              const itemTotal = unitPrice * item.quantity;
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                      {item.selectedPortion && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                          {item.selectedPortion}
                        </span>
                      )}
                      {item.kgGram && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {item.kgGram}
                        </span>
                      )}
                    </div>
                    {item.nativeName && (
                      <p className="text-xs text-gray-400">{item.nativeName}</p>
                    )}
                    <p className="text-xs font-semibold text-teal-700 mt-0.5">
                      ₹{unitPrice}
                      <span className="text-[11px] font-normal text-gray-500">
                        {formatPieceUnit(item.piece || item.portion)}
                      </span>
                    </p>
                    {typeof item.stock === 'number' && item.stock <= 0 && (
                      <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                        Out of stock
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="p-1.5 text-gray-600 hover:text-teal-700 transition cursor-pointer"
                        title="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1.5 text-gray-600 hover:text-teal-700 transition cursor-pointer"
                        title="Increase"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="w-14 text-right font-bold text-sm text-gray-900">
                      ₹{itemTotal}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bill summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600 text-xs">
              <span>Items Total</span>
              <span>₹{totalCartPrice}</span>
            </div>

            <div className="flex justify-between text-gray-600 text-xs items-center">
              <span>
                {isDineIn 
                  ? `Dine-In Service (${dineInTable})` 
                  : isTakeaway 
                    ? 'Self-Pickup' 
                    : 'Estimated Delivery'}
              </span>
              {!isDelivery ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">Free</span>
              ) : isFreeDelivery ? (
                <div className="flex items-center gap-1.5">
                  {rawDeliveryFee > 0 && (
                    <span className="line-through text-gray-400 text-[11px]">₹{rawDeliveryFee}</span>
                  )}
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">Free</span>
                </div>
              ) : (
                <span className="font-bold text-gray-800 text-xs">₹{actualDeliveryCharge}</span>
              )}
            </div>

            {/* Delivery Description paragraph right below Estimated Delivery - ONLY if sheet has description & Delivery mode */}
            {hasValidDescription && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                isFreeDelivery
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200/70 text-amber-900'
              }`}>
                <span className="text-base shrink-0 leading-none">🚚</span>
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">
                    {rawDesc}
                  </p>
                  {!isFreeDelivery && freeThreshold !== null && freeThreshold > totalCartPrice && (
                    <p className="mt-1 font-bold text-[11px] text-teal-800">
                      Add ₹{freeThreshold - totalCartPrice} more to get FREE Delivery!
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-800">Total Amount</span>
              <span className="font-bold text-lg text-teal-700">₹{finalTotalAmount}</span>
            </div>
          </div>

          {/* Order Action Buttons */}
          <div className="space-y-2">
            <button
              id="share-whatsapp-btn-cart-page"
              onClick={onShareWhatsApp}
              disabled={isSubmitting}
              className={`w-full font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] cursor-pointer ${
                isSubmitting
                  ? 'bg-teal-400 text-white cursor-wait'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white'
              }`}
            >
              <MessageCircle size={19} />
              <span>{isSubmitting ? 'Submitting Order...' : 'Submit Order & Share on WhatsApp'}</span>
            </button>
            <p className="text-center text-[11px] text-gray-500 font-medium">
              Order directly to Owner on WhatsApp (+91 70173 73371)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
