import React, { useState, useEffect } from 'react';
import { MenuItem } from '../data';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80';

interface ItemImageProps {
  item: MenuItem;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const ItemImage: React.FC<ItemImageProps> = ({ item, className = '', style, alt }) => {
  const cleanImageUrl =
    item.image_url && item.image_url.trim() !== '-' && item.image_url.trim() !== ''
      ? item.image_url.trim()
      : null;

  const cleanImageName =
    item.imageName && item.imageName.trim() !== '-' && item.imageName.trim() !== '' && item.imageName.trim() !== '0'
      ? item.imageName.trim()
      : null;

  const githubUrl = cleanImageName
    ? `https://raw.githubusercontent.com/royalmanish431-ux/amansweet/main/${cleanImageName}`
    : null;

  const initialSrc = cleanImageUrl || githubUrl || FALLBACK_IMAGE;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);

  useEffect(() => {
    setCurrentSrc(cleanImageUrl || githubUrl || FALLBACK_IMAGE);
  }, [cleanImageUrl, githubUrl]);

  const handleError = () => {
    if (cleanImageUrl && currentSrc === cleanImageUrl && githubUrl) {
      setCurrentSrc(githubUrl);
    } else if (currentSrc !== FALLBACK_IMAGE) {
      setCurrentSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt || item.name || 'Menu Item'}
      className={className}
      style={style}
      loading="lazy"
      onError={handleError}
    />
  );
};
