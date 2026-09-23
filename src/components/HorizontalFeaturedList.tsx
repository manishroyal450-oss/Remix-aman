import React from 'react';
import { MenuItem, CartItem, formatPieceUnit } from '../data';
import { ItemImage } from './ItemImage';
import { Plus, Minus, Star, Play, Sparkles } from 'lucide-react';

interface HorizontalFeaturedListProps {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, portion?: 'Half' | 'Full') => void;
  onUpdateQuantity?: (item: CartItem, delta: number) => void;
  onAddToOwnerPrivacy?: (item: MenuItem) => void;
  isInOwnerPrivacy?: (item: MenuItem) => boolean;
}

export const HorizontalFeaturedList: React.FC<HorizontalFeaturedListProps> = ({
  title,
  subtitle,
  items,
  cart,
  addToCart,
  onUpdateQuantity,
}) => {
  if (!items || items.length === 0) return null;

  const getValidYoutubeUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    return null;
  };

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500 fill-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
          {items.length} Specials
        </span>
      </div>

      {/* Horizontal Side-Scrollable Container */}
      <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory">
        {items.map((item) => {
          const pieceUnit = formatPieceUnit(item.piece || item.portion);
          const hasHalf = !!(item.priceHalf && item.priceHalf !== '-');
          const hasFull = !!(item.priceFull && item.priceFull !== '-');
          const defaultPortion: 'Half' | 'Full' | undefined = hasFull ? 'Full' : (hasHalf ? 'Half' : undefined);

          // Check if item is in cart
          const cartItem = cart.find(c => c.id === item.id);
          const inCartCount = cartItem ? cartItem.quantity : 0;

          // Price display
          const displayPrice = hasFull ? item.priceFull : (hasHalf ? item.priceHalf : item.price);
          const videoUrl = getValidYoutubeUrl(item.youtubeVideo);

          return (
            <div
              key={`featured-${item.id}`}
              className="w-[200px] sm:w-[220px] flex-shrink-0 snap-start bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              {/* Image Container with Badges */}
              <div className="relative w-full h-32 sm:h-36 bg-gray-100 overflow-hidden">
                <ItemImage
                  item={item}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Offer Badge Overlay */}
                {item.offer && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md tracking-tight uppercase">
                      {item.offer}
                    </span>
                  </div>
                )}

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                    <Star size={10} className="fill-current text-amber-300" />
                    4.3
                  </span>
                </div>

                {/* Veg Indicator Tag */}
                <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs p-0.5 rounded shadow-xs">
                  <div className="w-3 h-3 border border-emerald-600 flex items-center justify-center rounded-xs">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  </div>
                </div>

                {/* Video Play Button if available */}
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2 right-2 z-10 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors shadow-xs"
                    title="Watch Video"
                  >
                    <Play size={12} className="fill-current ml-0.5" />
                  </a>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                    {item.name}
                  </h3>
                  {item.nativeName && (
                    <p className="text-[11px] font-medium text-gray-400 line-clamp-1">
                      {item.nativeName}
                    </p>
                  )}
                </div>

                {/* Price and Weight row */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-sm font-extrabold text-gray-900">
                      ₹{displayPrice}
                      {pieceUnit && (
                        <span className="text-[11px] font-semibold text-gray-500 ml-0.5">
                          {pieceUnit}
                        </span>
                      )}
                    </div>
                    {item.kgGram && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-1 py-0.5 rounded border border-gray-100 inline-block w-fit mt-0.5">
                        {item.kgGram}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart button */}
                  <div>
                    {inCartCount > 0 && cartItem && onUpdateQuantity ? (
                      <div className="flex items-center bg-red-50 text-red-700 border border-red-200 rounded-lg p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-200 rounded text-xs font-bold transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-red-800">
                          {inCartCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-200 rounded text-xs font-bold transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item, defaultPortion)}
                        className="bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-500 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer uppercase tracking-tight"
                      >
                        + ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
