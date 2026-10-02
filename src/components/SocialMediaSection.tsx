import React, { useState } from 'react';
import { MenuItem, SocialPlatform } from '../data';
import { ItemImage } from './ItemImage';
import { Youtube, Instagram, Facebook, Play, ExternalLink, Plus, Check, Sparkles } from 'lucide-react';

interface SocialMediaSectionProps {
  menuData: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onFilterPlatformInCatalogue?: (platform: SocialPlatform | null) => void;
  activeCataloguePlatformFilter?: SocialPlatform | null;
}

export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  menuData,
  onAddToCart,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Filter items by social platform
  const instagramItems = menuData.filter((i) => Boolean(i.instagramVideo && i.instagramVideo.trim() !== ''));
  const facebookItems = menuData.filter((i) => Boolean(i.facebookVideo && i.facebookVideo.trim() !== ''));
  const youtubeItems = menuData.filter((i) => Boolean(i.youtubeVideo && i.youtubeVideo.trim() !== ''));

  const totalCount = instagramItems.length + facebookItems.length + youtubeItems.length;

  const currentItems =
    selectedPlatform === 'instagram'
      ? instagramItems
      : selectedPlatform === 'facebook'
      ? facebookItems
      : youtubeItems;

  const handleOpenVideo = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    onAddToCart(item);
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div className="mb-4 bg-gradient-to-r from-gray-950 via-zinc-900 to-gray-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-gray-800 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Compact Single Header Row with Title + Horizontal Platform Pills */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-2 px-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
            <Sparkles size={11} />
          </div>
          <span className="text-xs font-black tracking-tight text-white">Social Videos</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/15 text-gray-300">
            {totalCount}
          </span>
        </div>

        {/* 3 Horizontal Compact Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {/* Instagram */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('instagram')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              selectedPlatform === 'instagram'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-xs scale-102 ring-1 ring-pink-300/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            <Instagram size={11} className={selectedPlatform === 'instagram' ? 'text-white' : 'text-pink-400'} />
            <span>Insta</span>
            <span className="text-[9px] opacity-80">({instagramItems.length})</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('facebook')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              selectedPlatform === 'facebook'
                ? 'bg-[#1877F2] text-white shadow-xs scale-102 ring-1 ring-blue-300/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            <Facebook size={11} className={selectedPlatform === 'facebook' ? 'text-white' : 'text-blue-400'} />
            <span>FB</span>
            <span className="text-[9px] opacity-80">({facebookItems.length})</span>
          </button>

          {/* YouTube */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('youtube')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              selectedPlatform === 'youtube'
                ? 'bg-[#FF0000] text-white shadow-xs scale-102 ring-1 ring-red-300/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            <Youtube size={11} className={selectedPlatform === 'youtube' ? 'text-white' : 'text-red-400'} />
            <span>YouTube</span>
            <span className="text-[9px] opacity-80">({youtubeItems.length})</span>
          </button>
        </div>
      </div>

      {/* Horizontal Video Cards Row */}
      <div className="relative z-10">
        {currentItems.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-gray-700 rounded-xl p-2.5 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <span>No {selectedPlatform} videos in sheet yet (add link in Excel)</span>
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x pt-0.5">
            {currentItems.map((item) => {
              const videoUrl =
                selectedPlatform === 'instagram'
                  ? item.instagramVideo
                  : selectedPlatform === 'facebook'
                  ? item.facebookVideo
                  : item.youtubeVideo;

              const isAdded = Boolean(addedIds[item.id]);

              return (
                <div
                  key={`${selectedPlatform}-${item.id}`}
                  onClick={() => handleOpenVideo(videoUrl)}
                  className="w-64 sm:w-72 shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-2 flex items-center gap-2.5 transition-all group snap-start cursor-pointer shadow-2xs"
                >
                  {/* Left Square Thumbnail with Play Overlay */}
                  <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-black/40">
                    <ItemImage
                      item={item}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Mini Center Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 ${
                          selectedPlatform === 'instagram'
                            ? 'bg-gradient-to-tr from-purple-600 to-pink-600'
                            : selectedPlatform === 'facebook'
                            ? 'bg-[#1877F2]'
                            : 'bg-[#FF0000]'
                        }`}
                      >
                        <Play size={9} className="fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Corner Tag */}
                    <div className="absolute top-1 left-1 bg-black/70 px-1 py-0.2 rounded text-[8px] font-bold text-white flex items-center gap-0.5">
                      {selectedPlatform === 'instagram' ? (
                        <Instagram size={8} className="text-pink-400" />
                      ) : selectedPlatform === 'facebook' ? (
                        <Facebook size={8} className="text-blue-400" />
                      ) : (
                        <Youtube size={8} className="text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Center Dish Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-bold text-xs text-white truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 truncate">
                      {item.nativeName || item.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-black text-amber-300">
                        ₹{item.priceFull || item.priceHalf || item.price}
                      </span>
                      {item.offer && (
                        <span className="text-[9px] bg-green-500/20 text-green-300 font-bold px-1.5 py-0.2 rounded truncate max-w-[80px]">
                          {item.offer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Open Link + Add */}
                  <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer text-white shadow-xs ${
                        selectedPlatform === 'instagram'
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                          : selectedPlatform === 'facebook'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title={`Open ${selectedPlatform} video`}
                    >
                      <ExternalLink size={11} />
                      <span>Open</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, item)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                      title="Add to cart"
                    >
                      {isAdded ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
