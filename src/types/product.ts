export type ShopType = 'Mall' | 'Star+' | 'Star' | 'Official';

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  soldCount?: number;
  stock?: number;
  location?: string;
  shopName?: string;
  shopType?: ShopType;
  image: string;
  isFlashSale?: boolean;
  flashSaleSold?: number;
  description?: string;
  specs?: string[];
}

export type FeedTab = 'rekomendasi' | 'terlaris' | 'diskon' | 'flash_sale';

export type SortOption = 'default' | 'latest' | 'sold_desc' | 'price_asc' | 'price_desc';

export interface FeedProps {
  initialProducts?: Product[];
  apiEndpoint?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  title?: string;
}

