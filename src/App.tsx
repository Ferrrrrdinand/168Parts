import React from 'react';
import { Feed } from './components/Feed';
import { Product } from './types/product';

export const App: React.FC = () => {
  const handleProductClick = (product: Product) => {
    console.log('Produk diklik:', product);
    alert(`Buka detail produk: ${product.name}`);
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    console.log(`Menambahkan ke keranjang: ${product.name} (Qty: ${quantity})`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Mini Header Demo */}
      <header
        style={{
          background: '#1d3f0d',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#ffffff',
              color: '#1d3f0d',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            P
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800 }}>Pasarin Feed</span>
        </div>
        <span style={{ fontSize: '13px', opacity: 0.9 }}>
          React + TypeScript Feed Demo
        </span>
      </header>

      {/* Main Product Feed Component */}
      <main style={{ padding: '20px 0' }}>
        <Feed
          title="Rekomendasi Produk Pilihan"
          apiEndpoint="http://localhost:3000/api/products"
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
        />
      </main>
    </div>
  );
};

export default App;

