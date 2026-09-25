import { useRef, RefObject } from 'react';
import { CartItem, UserProfile, formatPieceUnit, getItemUnitPrice } from '../data';
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, Paperclip, User, ArrowRight } from 'lucide-react';

interface CartSectionProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  decreaseQuantity: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalCartPrice: number;
  totalCartCount: number;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onShareWhatsApp: () => void;
  onGoToHome: () => void;
  userProfile: UserProfile | null;
  onGoToProfile: () => void;
  isSubmitting?: boolean;
  onSubmitDirectOrder?: () => void;
}

export default function CartSection({
  cart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  totalCartPrice,
  totalCartCount,
  selectedFile,
  setSelectedFile,
  onShareWhatsApp,
  onGoToHome,
  userProfile,
  onGoToProfile,
  isSubmitting = false,
  onSubmitDirectOrder,
}: CartSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
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
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm transition"
          >
            <span>Explore Menu</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Customer Profile Banner if exists */}
          {userProfile ? (
            <div className="bg-white rounded-xl p-3.5 border border-teal-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-gray-700">
                <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  {userProfile.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userProfile.fullName} {userProfile.lastName}</p>
                  <p className="text-gray-500 text-[11px] truncate max-w-[200px]">{userProfile.address}</p>
                </div>
              </div>
              <button 
                onClick={onGoToProfile}
                className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
              >
                Change
              </button>
            </div>
          ) : (
            <div 
              onClick={onGoToProfile}
              className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
            >
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <User size={16} className="text-amber-600" />
                <span>Add delivery address in <strong>Profile</strong> for faster checkout</span>
              </div>
              <ArrowRight size={14} className="text-amber-700" />
            </div>
          )}

          {/* Cart items list */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 divide-y divide-gray-100">
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
                    {typeof item.stock === 'number' && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Stock: {item.stock} | Rem: <span className={item.stock - item.quantity < 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-medium'}>{item.stock - item.quantity}</span>
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="p-1.5 text-gray-600 hover:text-teal-700 transition"
                        title="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1.5 text-gray-600 hover:text-teal-700 transition"
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
                      className="p-1.5 text-gray-400 hover:text-red-500 transition"
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
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 text-xs">
              <span>Items Total</span>
              <span>₹{totalCartPrice}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span>Estimated Delivery</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-800">Total Amount</span>
              <span className="font-bold text-lg text-teal-700">₹{totalCartPrice}</span>
            </div>
          </div>

          {/* Attachment Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-teal-500 bg-white transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*"
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
              <Paperclip size={15} className="text-gray-400" />
              <span>{selectedFile ? `Attached: ${selectedFile.name}` : 'Attach Payment Screenshot / Photo (Optional)'}</span>
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
              <span>{isSubmitting ? 'Submitting & Deducting Stock...' : 'Submit Order & Share on WhatsApp'}</span>
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
