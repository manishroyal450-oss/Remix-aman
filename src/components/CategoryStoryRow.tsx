import React from 'react';
import { MenuItem } from '../data';
import { ItemImage } from './ItemImage';
import { Utensils, Play } from 'lucide-react';

interface CategoryStoryRowProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  menuData: MenuItem[];
}

export const CategoryStoryRow: React.FC<CategoryStoryRowProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  menuData,
}) => {
  // Find a representative item for each category to display its photo
  const getCategoryImageItem = (cat: string): MenuItem | undefined => {
    if (cat === 'All') {
      // Find Gulab Jamun or Kheer or first item with valid image
      return menuData.find(i => i.image_url || i.imageName);
    }
    if (cat === 'YouTube Video') {
      return menuData.find(i => Boolean(i.youtubeVideo && i.youtubeVideo.trim() !== '' && i.youtubeVideo.trim() !== '-'));
    }
    return menuData.find(i => i.category.toLowerCase() === cat.toLowerCase() && (i.image_url || i.imageName));
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
          Eat what makes you happy
        </h2>
        <span className="text-[11px] font-semibold text-red-600 cursor-pointer hover:underline" onClick={() => onSelectCategory('All')}>
          See all
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none px-1 snap-x">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const isVideoCat = cat === 'YouTube Video';
          const repItem = getCategoryImageItem(cat);

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group snap-start transition-transform active:scale-95"
              title={`View ${cat}`}
            >
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden p-0.5 transition-all ${
                  isSelected
                    ? 'ring-3 ring-red-600 ring-offset-2 shadow-md'
                    : isVideoCat
                    ? 'border-2 border-red-400 group-hover:border-red-600 shadow-xs'
                    : 'border border-gray-200 group-hover:border-red-300 shadow-xs'
                } bg-white flex items-center justify-center relative`}
              >
                {repItem ? (
                  <ItemImage
                    item={repItem}
                    alt={cat}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition duration-300"
                  />
                ) : isVideoCat ? (
                  <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center text-white">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <Utensils size={22} />
                  </div>
                )}
                {isVideoCat && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xs border border-white">
                    <Play size={9} className="fill-current ml-0.5" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-red-600/10 rounded-full" />
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-semibold text-center whitespace-nowrap px-1 max-w-[76px] truncate transition-colors ${
                  isSelected ? 'text-red-700 font-bold' : isVideoCat ? 'text-red-600 font-bold' : 'text-gray-700 group-hover:text-gray-900'
                }`}
              >
                {cat}
              </span>
              {isSelected && (
                <div className="w-4 h-0.5 bg-red-600 rounded-full -mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
