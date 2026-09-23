import React, { useState, useEffect } from 'react';
import { ShoppingCart, Lock, Check } from 'lucide-react';
import { MenuItem, formatPieceUnit } from '../data';

interface Props {
  item: MenuItem;
  addToCart: (item: MenuItem, portion?: 'Half' | 'Full') => void;
  onAddToOwnerPrivacy?: (item: MenuItem) => void;
  isInOwnerPrivacy?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80';

const MenuItemComponent: React.FC<Props> = ({ 
  item, 
  addToCart, 
  onAddToOwnerPrivacy,
  isInOwnerPrivacy = false 
}) => {
  const hasHalf = Boolean(
    item.priceHalf &&
    item.priceHalf.trim() !== '' &&
    item.priceHalf.trim() !== '-' &&
    !isNaN(parseFloat(item.priceHalf.replace(/[^\d.]/g, '')))
  );

  const hasFull = Boolean(
    item.priceFull &&
    item.priceFull.trim() !== '' &&
    item.priceFull.trim() !== '-' &&
    !isNaN(parseFloat(item.priceFull.replace(/[^\d.]/g, '')))
  );

  const [selectedPortion, setSelectedPortion] = useState<'Half' | 'Full'>(() => {
    if (hasHalf && hasFull) return 'Half';
    if (hasFull) return 'Full';
    return 'Half';
  });

  useEffect(() => {
    if (hasHalf && hasFull) {
      setSelectedPortion('Half');
    } else if (hasFull) {
      setSelectedPortion('Full');
    } else if (hasHalf) {
      setSelectedPortion('Half');
    }
  }, [item.id, hasHalf, hasFull]);

  const pieceUnit = formatPieceUnit(item.piece || item.portion);

  // 1. Column L (image_url) from Google Sheet (e.g., https://i.ibb.co/...)
  const cleanImageUrl =
    item.image_url && item.image_url.trim() !== '-' && item.image_url.trim() !== ''
      ? item.image_url.trim()
      : null;

  // 2. Existing GitHub/assets image path for legacy items (rows 1 to 68)
  const cleanImageName =
    item.imageName && item.imageName.trim() !== '-' && item.imageName.trim() !== ''
      ? item.imageName.trim()
      : null;
  const githubUrl = cleanImageName
    ? `https://raw.githubusercontent.com/royalmanish431-ux/amansweet/main/${cleanImageName}`
    : null;

  // Priority: 1. image_url -> 2. GitHub image path -> 3. Fallback placeholder
  const initialImageSrc = cleanImageUrl || githubUrl || FALLBACK_IMAGE;
  const [currentImgSrc, setCurrentImgSrc] = useState<string>(initialImageSrc);

  useEffect(() => {
    setCurrentImgSrc(cleanImageUrl || githubUrl || FALLBACK_IMAGE);
  }, [cleanImageUrl, githubUrl]);

  const handleImageError = () => {
    // If priority 1 (image_url) failed and githubUrl is available, try githubUrl
    if (cleanImageUrl && currentImgSrc === cleanImageUrl && githubUrl) {
      setCurrentImgSrc(githubUrl);
    } else if (currentImgSrc !== FALLBACK_IMAGE) {
      // If both fail or only one was present and failed, fall back to placeholder
      setCurrentImgSrc(FALLBACK_IMAGE);
    }
  };
  
  const getValidYoutubeUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    return null;
  };

  const handleOpenVideo = (e: React.MouseEvent, url: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    const validUrl = getValidYoutubeUrl(url);
    if (!validUrl) return;
    
    window.open(validUrl, '_blank', 'noopener,noreferrer');
  };

  const videoUrl = getValidYoutubeUrl(item.youtubeVideo);

  return (
    <div id={`item-${item.id}`} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 flex flex-col gap-3 relative group">
      <div className="relative overflow-hidden rounded-xl bg-gray-100">
        <img 
            src={currentImgSrc} 
            alt={item.name || 'Menu Item'} 
            style={{width:'100%', height:'240px', objectFit:'cover', borderRadius:'12px'}}
            className="group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImageError}
        />
        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-emerald-700/95 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <span>★</span> 4.3
          </span>
        </div>
        {/* Veg Badge on Image */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-xs p-1 rounded shadow-xs">
          <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {item.category}
          </span>
          <h3 className="text-base font-bold text-gray-800 mt-1">{item.name}</h3>
          <p className="text-xs text-gray-500 font-medium">{item.nativeName}</p>
        </div>

        {/* By owner button shifted below image */}
        {onAddToOwnerPrivacy && (
          <button
            type="button"
            id={`by-owner-btn-${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToOwnerPrivacy(item);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 mt-0.5 ${
              isInOwnerPrivacy
                ? 'bg-teal-700 text-white border border-teal-600 ring-2 ring-teal-400/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
            title={isInOwnerPrivacy ? 'In Owner Privacy (Click to toggle)' : 'Add to Owner Privacy Offers'}
          >
            {isInOwnerPrivacy ? (
              <>
                <Check size={12} className="text-teal-200 stroke-[3]" />
                <span>In Owner</span>
              </>
            ) : (
              <>
                <Lock size={12} className="text-amber-700" />
                <span>By owner</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {item.offer && (
          <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded">
            {item.offer}
          </span>
        )}
        {videoUrl && (
          <button
            type="button"
            onClick={(e) => handleOpenVideo(e, videoUrl)}
            style={{
              background: 'none',
              border: 'none',
              color: '#E60000',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ▶ Watch Video
          </button>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2.5">
        {hasHalf && hasFull ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 py-1">
              <label 
                className="flex items-center gap-2 cursor-pointer select-none group/radio"
                onClick={() => setSelectedPortion('Half')}
              >
                <input
                  type="radio"
                  name={`portion-${item.id}`}
                  checked={selectedPortion === 'Half'}
                  onChange={() => setSelectedPortion('Half')}
                  className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
                />
                <span className={`text-xs ${selectedPortion === 'Half' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  Half: <span className="font-bold">₹{item.priceHalf}</span>
                </span>
              </label>

              <label 
                className="flex items-center gap-2 cursor-pointer select-none group/radio"
                onClick={() => setSelectedPortion('Full')}
              >
                <input
                  type="radio"
                  name={`portion-${item.id}`}
                  checked={selectedPortion === 'Full'}
                  onChange={() => setSelectedPortion('Full')}
                  className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
                />
                <span className={`text-xs ${selectedPortion === 'Full' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  Full: <span className="font-bold">₹{item.priceFull}</span>
                </span>
              </label>
            </div>
            {item.kgGram && (
              <div className="text-right px-1">
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 inline-block">
                  {item.kgGram}
                </span>
              </div>
            )}
          </div>
        ) : hasFull ? (
          <div className="flex items-center justify-between px-1 text-xs py-0.5">
            <span className="text-gray-500 font-medium">Price</span>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">
                ₹{item.priceFull}<span className="text-xs font-semibold text-gray-700">{pieceUnit}</span>
              </div>
              {item.kgGram && (
                <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {item.kgGram}
                </div>
              )}
            </div>
          </div>
        ) : hasHalf ? (
          <div className="flex items-center justify-between px-1 text-xs py-0.5">
            <span className="text-gray-500 font-medium">Half</span>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">
                ₹{item.priceHalf}<span className="text-xs font-semibold text-gray-700">{pieceUnit}</span>
              </div>
              {item.kgGram && (
                <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {item.kgGram}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 text-xs py-0.5">
            <span className="text-gray-500 font-medium">Price</span>
            <div className="text-right">
              <div className="text-sm font-bold text-red-600">N/A</div>
              {item.kgGram && (
                <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {item.kgGram}
                </div>
              )}
            </div>
          </div>
        )}

        {typeof item.stock === 'number' && (
          <div className="flex justify-between items-center px-1 text-[11px]">
            <span className={item.stock > 10 ? 'text-emerald-700 font-medium' : item.stock > 0 ? 'text-amber-700 font-medium' : 'text-red-600 font-bold'}>
              {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of stock'}
            </span>
          </div>
        )}

        <button 
          type="button"
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs cursor-pointer ${
            item.stock === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-200'
          }`}
          aria-label={`Add ${item.name} to cart`}
          disabled={item.stock === 0}
          onClick={() => {
            const chosen = hasHalf && hasFull ? selectedPortion : (hasFull ? 'Full' : hasHalf ? 'Half' : undefined);
            addToCart(item, chosen);
          }}
        >
          <ShoppingCart size={16} />
          <span>{item.stock === 0 ? 'Out of stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default MenuItemComponent;
