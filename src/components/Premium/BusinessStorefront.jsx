import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function BusinessStorefront({ userId }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([
    { id: '1', name: 'Digital Art Pack', price: 19.99, image: '🎨', description: '50+ premium illustrations' },
    { id: '2', name: 'Consultation', price: 49.99, image: '💼', description: '1-hour expert session' }
  ]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const isOwner = user?.uid === userId;

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
    setShowCart(true);
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🏪</span>
          Storefront
        </h4>
        <button 
          onClick={() => setShowCart(!showCart)}
          className="relative p-2 rounded-full hover:bg-white/10"
        >
          🛒
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-xs flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Cart ({cart.length})</h5>
          <div className="space-y-2">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-violet-400">${item.price}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 bg-violet-600 rounded-lg text-sm hover:bg-violet-500">
            Checkout ${cart.reduce((a, b) => a + b.price, 0).toFixed(2)}
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {products.map(product => (
          <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <span className="text-3xl">{product.image}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-gray-500">{product.description}</p>
              <p className="text-sm text-violet-400 font-bold mt-1">${product.price}</p>
            </div>
            <button
              onClick={() => addToCart(product)}
              className="px-3 py-2 bg-violet-600 rounded-lg text-sm hover:bg-violet-500"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {isOwner && (
        <button className="w-full mt-3 py-2 border border-dashed border-gray-600 rounded-lg text-sm text-gray-500 hover:text-white hover:border-gray-400">
          + Add Product
        </button>
      )}
    </div>
  );
}
