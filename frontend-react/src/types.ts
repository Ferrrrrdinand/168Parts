export interface ProductVariant {
  name: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  image?: string | null;
  colorCode?: string | null;
  swatchType?: 'dark' | 'white' | 'transparan' | null;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number;
  rating?: number;
  soldCount?: number;
  stock?: number;
  location?: string;
  shopName?: string;
  shopType?: string;
  icon?: string;
  image?: string | null;
  bgPattern?: string;
  isFlashSale?: boolean;
  flashSaleSold?: number;
  flashSaleSoldUnits?: number;
  description?: string;
  specs?: string[];
  variants?: ProductVariant[];
  reviewCount?: number;
  favoriteCount?: number;
}

export interface Promo {
  id?: string;
  code: string;
  title: string;
  description?: string;
  discount_type?: string;
  discountType?: string;
  discount_value?: number;
  discountValue?: number;
  min_spend?: number;
  minSpend?: number;
  max_discount?: number | null;
  maxDiscount?: number | null;
  quota?: number;
  used_count?: number;
  usedCount?: number;
  category?: string;
  icon?: string;
  is_active?: boolean | number;
  isActive?: boolean | number;
}

export interface BannerLeft {
  badge: string;
  title: string;
  subtitle?: string;
  pills: string[];
  modelImage: string;
  bgGradient: string;
  targetUrl?: string;
}

export interface BannerRight {
  title?: string;
  modelImage1: string;
  modelImage2: string;
  pill1Title: string;
  pill1Val: string;
  pill2Title: string;
  pill2Val: string;
  bgGradient: string;
  targetUrl?: string;
}

export interface BannerConfig {
  left: BannerLeft;
  right: BannerRight;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variation?: string;
  price?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  icon?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  userId?: string;
  user_id?: string;
  items: OrderItem[] | string;
  shippingAddress: string;
  shipping_address?: string;
  paymentMethod: string;
  payment_method?: string;
  notes?: string;
  totalAmount: number;
  total_amount?: number;
  status: string;
  createdAt?: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'admin';
  points?: number;
}

