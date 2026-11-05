import React from 'react';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  rankIndex?: number;
  onClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rankIndex,
  onClick,
  onAddToCart,
}) => {
  const formatPrice = (price: number): string => {
    return 'Rp' + Number(price).toLocaleString('id-ID');
  };

  const formatSoldCount = (count?: number): string => {
    if (!count) return '0 Terjual';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.', ',')}rb Terjual`;
    }
    return `${count} Terjual`;
  };

  const getRankLabel = (idx?: number): string | null => {
    if (idx === undefined || idx < 0) return null;
    if (idx === 0) return '👑 TOP 1';
    if (idx === 1) return '🥈 TOP 2';
    if (idx === 2) return '🥉 TOP 3';
    if (idx < 5) return `TOP ${idx + 1}`;
    return null;
  };

  const rankLabel = getRankLabel(rankIndex);
  const discount =
    product.discountPercent ||
    (product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null);

  const getBadgeClass = (type?: string) => {
    if (type === 'Mall') return 'badge-mall';
    if (type === 'Star+') return 'badge-star-plus';
    return 'badge-star';
  };

  return (
    <div
      className="feed-card"
      onClick={() => onClick && onClick(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick && onClick(product);
        }
      }}
    >
      {/* Top Badges Overlay */}
      <div className="feed-card-badges-top">
        {rankLabel ? (
          <span className="badge-top-rank">{rankLabel}</span>
        ) : product.isFlashSale ? (
          <span className="badge-hot">⚡ HOT</span>
        ) : null}

        {discount ? <span className="badge-discount">-{discount}%</span> : null}
      </div>

      {/* Product Image & Quick Add Button */}
      <div className="feed-card-pic">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            // Fallback image jika gagal memuat
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80';
          }}
        />

        <button
          className="btn-quick-cart"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart && onAddToCart(product);
          }}
          title="Tambah ke Keranjang"
          aria-label={`Tambah ${product.name} ke Keranjang`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="feed-card-info">
        <h4 className="feed-card-title" title={product.name}>
          <span className={`shop-badge ${getBadgeClass(product.shopType)}`}>
            {product.shopType || 'Mall'}
          </span>
          {product.name}
        </h4>

        {/* Trust Tags */}
        <div className="trust-tags">
          <span className="trust-tag gratis-ongkir">🚚 Bebas Ongkir</span>
          {product.price < 5000000 && <span className="trust-tag cod">COD</span>}
        </div>

        {/* Price Section */}
        <div className="price-container">
          <div className="price-current">
            <span className="currency">Rp</span>
            {Number(product.price).toLocaleString('id-ID')}
          </div>

          {product.originalPrice && product.originalPrice > product.price ? (
            <div className="price-original-row">
              <span className="original-price">{formatPrice(product.originalPrice)}</span>
              {discount ? <span className="disc-pill">-{discount}%</span> : null}
            </div>
          ) : null}
        </div>

        {/* Footer: Rating, Sold, Location */}
        <div className="feed-card-footer">
          <div className="rating-sold">
            <span className="star-rating">★ {product.rating || 4.9}</span>
            <span className="sold-dot">•</span>
            <span className="sold-count">{formatSoldCount(product.soldCount)}</span>
          </div>

          <div className="location-tag">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="loc-text">{product.location || 'Indonesia'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

