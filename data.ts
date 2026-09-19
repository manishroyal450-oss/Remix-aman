export interface MenuItem {
  id: string;
  category: string;
  name: string; // english
  nativeName: string; // hindi
  priceHalf?: string;
  priceFull?: string;
  portion?: string;
  offer?: string;
  imageName?: string;
  image_url?: string;
  youtubeVideo?: string;
  stock?: number;
  price?: number;
  discount?: number;
  gst?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface UserProfile {
  fullName: string;
  lastName: string;
  address: string;
  pinCode: string;
  contactNumber: string;
  password5Digit?: string;
}

export const menuData: MenuItem[] = [];
