'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  ShoppingBag,
  ShoppingCart,
  Package,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Check,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Tag,
  AlertTriangle,
  CreditCard,
  QrCode,
  Layers,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'Supplements', label: 'Supplements' },
  { id: 'Gear', label: 'Gear & Belts' },
  { id: 'Apparel', label: 'Apparel' },
  { id: 'Snacks', label: 'Snacks & Bars' },
  { id: 'Beverages', label: 'Drinks & Hydration' },
  { id: 'Other', label: 'Accessories' },
];

const PRESET_IMAGES = [
  {
    name: 'Whey Protein',
    url: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Creatine Monohydrate',
    url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Pre-Workout Rush',
    url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Steel Shaker Bottle',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Lifting Straps / Belt',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Gym Performance Tee',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Protein Energy Bar',
    url: 'https://images.unsplash.com/photo-1622484216833-c7e148e698ee?w=500&auto=format&fit=crop&q=60',
  },
];

export default function GymStorePage() {
  const { user, token } = useAuth();
  const { currentGym, formatCurrency } = useGym();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'staff';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders' | 'inventory'

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pickupNotes, setPickupNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('FrontDesk');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState(null);

  // Product Modal (Add / Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Supplements',
    brand: '',
    price: '',
    memberPrice: '',
    stock: 10,
    imageUrl: '',
    description: '',
    isActive: true,
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Load Cart from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('gym_store_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error loading cart', e);
    }
  }, []);

  // Save Cart to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('gym_store_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }, [cart]);

  // Fetch store data
  const fetchProducts = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/store/products', { headers });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/store/orders', { headers });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchMetrics = async () => {
    if (!isAdmin) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/store/metrics', { headers });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchOrders(), fetchMetrics()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [token, isAdmin]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        (prod.brand && prod.brand.toLowerCase().includes(query)) ||
        (prod.description && prod.description.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock || 99) }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(newQty, item.product.stock || 99) } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart Calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let itemCount = 0;

    cart.forEach((item) => {
      const regPrice = item.product.price || 0;
      const memPrice = item.product.memberPrice || regPrice;
      subtotal += regPrice * item.quantity;
      totalDiscount += (regPrice - memPrice) * item.quantity;
      itemCount += item.quantity;
    });

    const finalAmount = Math.max(0, subtotal - totalDiscount);
    return { subtotal, totalDiscount, finalAmount, itemCount };
  }, [cart]);

  // Handle Order Placement
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        paymentMethod,
        pickupNotes,
      };

      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setPlacedOrderSuccess(data.data);
        clearCart();
        setIsCartOpen(false);
        setPickupNotes('');
        await Promise.all([fetchProducts(), fetchOrders(), fetchMetrics()]);
      } else {
        alert(data.message || 'Failed to place order. Check product stock.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while placing order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Admin: Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/store/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
        fetchMetrics();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating order');
    }
  };

  // Admin: Save / Create Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert('Please provide product name and price');
      return;
    }
    setSavingProduct(true);
    try {
      const url = editingProduct
        ? `/api/store/products/${editingProduct._id}`
        : '/api/store/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(productForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({
          name: '',
          category: 'Supplements',
          brand: '',
          price: '',
          memberPrice: '',
          stock: 10,
          imageUrl: '',
          description: '',
          isActive: true,
        });
        await fetchProducts();
        await fetchMetrics();
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Admin: Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the store?')) return;
    try {
      const res = await fetch(`/api/store/products/${productId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        fetchMetrics();
      } else {
        alert(data.message || 'Could not delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      price: product.price,
      memberPrice: product.memberPrice || product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setShowProductModal(true);
  };

  const formatPrice = (amt) => {
    if (formatCurrency) return formatCurrency(amt);
    return `₹${Number(amt).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShoppingBag size={12} />
              {currentGym?.name || 'GYM'} PRO SHOP & CAFE
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              ⚡ Exclusive Member Pricing
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Gym Pro Store & Nutrition
          </h1>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            Buy authentic whey protein, creatine, lifting gear, apparel, and pre-workout drinks directly
            from your gym. Place an order and collect it instantly at the reception counter!
          </p>
        </div>

        {/* Action Controls & Cart Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  category: 'Supplements',
                  brand: '',
                  price: '',
                  memberPrice: '',
                  stock: 10,
                  imageUrl: '',
                  description: '',
                  isActive: true,
                });
                setShowProductModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Plus size={18} />
              Add Product
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 20px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
            }}
          >
            <ShoppingCart size={19} />
            <span>Cart</span>
            {cartTotals.itemCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  borderRadius: '999px',
                  padding: '2px 7px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                }}
              >
                {cartTotals.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Admin Sales Metrics (Visible only to Admin / Staff) */}
      {isAdmin && metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Store Revenue
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatPrice(metrics.totalRevenue || 0)}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Orders Fulfilled
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.completedOrders || 0} / {metrics.totalOrders || 0}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Pending Pickups
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
                {metrics.pendingOrders || 0}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Low Stock Items
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics.lowStockCount || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            background: activeTab === 'catalog' ? 'var(--bg-card)' : 'transparent',
            border: activeTab === 'catalog' ? '1px solid var(--border-subtle)' : 'none',
            color: activeTab === 'catalog' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <ShoppingBag size={17} />
          <span>Product Catalog</span>
          <span
            style={{
              fontSize: '0.72rem',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? 'var(--bg-card)' : 'transparent',
            border: activeTab === 'orders' ? '1px solid var(--border-subtle)' : 'none',
            color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Package size={17} />
          <span>{isAdmin ? 'All Orders & Pickups' : 'My Orders'}</span>
          {orders.length > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. TAB 1: PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div>
          {/* Search & Category Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 260px',
                maxWidth: '400px',
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search whey, creatine, shaker, tee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '10px 14px 10px 38px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Badges */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                maxWidth: '100%',
              }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      background: isSelected ? 'var(--brand-primary, #10b981)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid transparent' : '1px solid var(--border-subtle)',
                      borderRadius: '999px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading gym catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                No products found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
                {searchQuery
                  ? `No items match "${searchQuery}" in this category.`
                  : 'No items currently in this category.'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowProductModal(true)}
                  style={{
                    background: 'var(--brand-primary, #10b981)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add First Product
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredProducts.map((product) => {
                const regPrice = product.price || 0;
                const memPrice = product.memberPrice || regPrice;
                const hasDiscount = memPrice < regPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((regPrice - memPrice) / regPrice) * 100)
                  : 0;
                const isOutOfStock = (product.stock || 0) <= 0;
                const inCart = cart.find((item) => item.product._id === product._id);

                return (
                  <div
                    key={product._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                      opacity: isOutOfStock ? 0.7 : 1,
                    }}
                  >
                    {/* Image / Header area */}
                    <div
                      style={{
                        height: '190px',
                        background: 'var(--bg-input)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: 'var(--text-muted)',
                            gap: '6px',
                          }}
                        >
                          <ShoppingBag size={42} />
                          <span style={{ fontSize: '0.74rem' }}>{product.category}</span>
                        </div>
                      )}

                      {/* Category Pill */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#ffffff',
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(6px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {product.category}
                      </span>

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                          }}
                        >
                          SAVE {discountPercent}%
                        </span>
                      )}

                      {/* Stock Status Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          background: isOutOfStock
                            ? 'rgba(239, 68, 68, 0.9)'
                            : product.stock < 5
                            ? 'rgba(245, 158, 11, 0.9)'
                            : 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {isOutOfStock
                          ? 'Out of Stock'
                          : product.stock < 5
                          ? `Only ${product.stock} left!`
                          : `In Stock (${product.stock})`}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                      }}
                    >
                      {product.brand && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '4px',
                          }}
                        >
                          {product.brand}
                        </div>
                      )}

                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '0 0 6px 0',
                          lineHeight: '1.35',
                        }}
                      >
                        {product.name}
                      </h3>

                      {product.description && (
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            margin: '0 0 14px 0',
                            lineHeight: '1.45',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1,
                          }}
                        >
                          {product.description}
                        </p>
                      )}

                      {/* Price Section */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                          marginBottom: '16px',
                          marginTop: 'auto',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.35rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {formatPrice(memPrice)}
                        </span>

                        {hasDiscount && (
                          <span
                            style={{
                              fontSize: '0.88rem',
                              color: 'var(--text-muted)',
                              textDecoration: 'line-through',
                            }}
                          >
                            {formatPrice(regPrice)}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#10b981',
                            marginLeft: 'auto',
                          }}
                        >
                          Member Deal
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isOutOfStock ? (
                          <button
                            disabled
                            style={{
                              flex: 1,
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'not-allowed',
                            }}
                          >
                            Out of Stock
                          </button>
                        ) : inCart ? (
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '10px',
                              padding: '4px 8px',
                            }}
                          >
                            <button
                              onClick={() => updateCartQty(product._id, -1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              -
                            </button>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: '#10b981',
                              }}
                            >
                              {inCart.quantity} in Cart
                            </span>
                            <button
                              onClick={() => updateCartQty(product._id, 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <ShoppingCart size={16} />
                            Add to Cart
                          </button>
                        )}

                        {/* Admin Controls */}
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => openEditModal(product)}
                              title="Edit Product"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                padding: '8px',
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              title="Delete Product"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                padding: '8px',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: ORDERS & PICKUPS */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: '⏳ Pending Pickup' },
              { id: 'ready_for_pickup', label: '📦 Ready at Front Desk' },
              { id: 'completed', label: '✅ Completed' },
              { id: 'cancelled', label: '❌ Cancelled' },
            ].map((f) => {
              const active = orderFilterStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setOrderFilterStatus(f.id)}
                  style={{
                    background: active ? 'var(--brand-primary, #6366f1)' : 'var(--bg-card)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                No orders found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {isAdmin
                  ? 'No member has placed a store order yet.'
                  : 'You have not placed any orders yet. Visit the catalog to shop!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders
                .filter((o) => orderFilterStatus === 'all' || o.status === orderFilterStatus)
                .map((order) => {
                  const statusColors = {
                    pending: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b', text: 'Pending Prep' },
                    ready_for_pickup: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', text: 'Ready for Pickup' },
                    completed: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', color: '#10b981', text: 'Collected' },
                    cancelled: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', color: '#ef4444', text: 'Cancelled' },
                  };

                  const cfg = statusColors[order.status] || statusColors.pending;

                  return (
                    <div
                      key={order._id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 900,
                              fontSize: '1rem',
                              color: 'var(--text-primary)',
                              background: 'var(--bg-input)',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {order.orderNumber}
                          </span>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              color: cfg.color,
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              padding: '3px 10px',
                              borderRadius: '999px',
                            }}
                          >
                            {cfg.text}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Member Info (For Admin) */}
                      {isAdmin && order.member && (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-input)',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <strong>Member:</strong> {order.member.fullName || 'Member'}
                          </div>
                          <div>
                            <strong>Phone:</strong> {order.member.phone || 'N/A'}
                          </div>
                          <div>
                            <strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})
                          </div>
                        </div>
                      )}

                      {/* Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.88rem',
                              color: 'var(--text-secondary)',
                              borderBottom: '1px dashed var(--border-subtle)',
                              paddingBottom: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  background: 'var(--bg-input)',
                                  color: 'var(--text-primary)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                }}
                              >
                                {item.quantity}x
                              </span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {item.productName || item.product?.name || 'Product'}
                              </span>
                            </div>

                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pickup Notes */}
                      {order.pickupNotes && (
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                          }}
                        >
                          Note: "{order.pickupNotes}"
                        </div>
                      )}

                      {/* Footer: Total & Admin Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          paddingTop: '8px',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Total: {formatPrice(order.totalAmount)}
                        </div>

                        {/* Admin status switcher */}
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Update Status:
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="ready_for_pickup">Ready for Pickup</option>
                              <option value="completed">Completed / Handed Over</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
                            📍 Show this order number at the reception desk to collect
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 6. SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '100%',
              background: 'var(--bg-main)',
              borderLeft: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.35)',
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            {/* Cart Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} style={{ color: '#10b981' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Gym Pickup Cart
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  {cartTotals.itemCount}
                </span>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Your cart is empty</h4>
                  <p style={{ fontSize: '0.85rem' }}>Add some supplements, snacks, or gym gear to get started.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const regPrice = item.product.price || 0;
                  const memPrice = item.product.memberPrice || regPrice;

                  return (
                    <div
                      key={item.product._id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '10px',
                          background: 'var(--bg-input)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <ShoppingBag size={20} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.product.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatPrice(memPrice)}
                          </span>
                          {memPrice < regPrice && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                textDecoration: 'line-through',
                              }}
                            >
                              {formatPrice(regPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-input)',
                          borderRadius: '8px',
                          padding: '3px 6px',
                        }}
                      >
                        <button
                          onClick={() => updateCartQty(item.product._id, -1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            padding: '2px 6px',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.product._id, 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            padding: '2px 6px',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}

              {/* Order Notes & Preferences */}
              {cart.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                      }}
                    >
                      Pickup Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Will collect post workout at 7:30 PM"
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '9px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                      }}
                    >
                      Payment Preference
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'FrontDesk', label: 'Front Desk' },
                        { id: 'UPI', label: 'Counter UPI' },
                        { id: 'Cash', label: 'Cash' },
                      ].map((m) => {
                        const sel = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            style={{
                              background: sel ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                              border: sel ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                              color: sel ? '#10b981' : 'var(--text-secondary)',
                              borderRadius: '10px',
                              padding: '8px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div
                style={{
                  padding: '20px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    <span>Catalog Total</span>
                    <span>{formatPrice(cartTotals.subtotal)}</span>
                  </div>

                  {cartTotals.totalDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#10b981', fontWeight: 700 }}>
                      <span>Member Discount Savings</span>
                      <span>-{formatPrice(cartTotals.totalDiscount)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '8px',
                      marginTop: '4px',
                    }}
                  >
                    <span>Total Amount</span>
                    <span>{formatPrice(cartTotals.finalAmount)}</span>
                  </div>
                </div>

                <button
                  disabled={submittingOrder}
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '13px 20px',
                    color: '#ffffff',
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    cursor: submittingOrder ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submittingOrder ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Place Gym Pickup Order</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. ORDER SUCCESS MODAL */}
      {placedOrderSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Pickup Order Confirmed!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Your order is queued for preparation. Please collect it from the gym reception counter.
            </p>

            {/* Token Badge */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1.5px dashed var(--border-subtle)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pickup Order Number
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: '#10b981',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                {placedOrderSuccess.orderNumber}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Amount to pay: <strong>{formatPrice(placedOrderSuccess.totalAmount)}</strong> ({placedOrderSuccess.paymentMethod})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setPlacedOrderSuccess(null);
                  setActiveTab('orders');
                }}
                style={{
                  flex: 1,
                  background: 'var(--brand-primary, #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                View My Orders
              </button>
              <button
                onClick={() => setPlacedOrderSuccess(null)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ADMIN ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingProduct ? 'Edit Product' : 'Add New Gym Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimum Nutrition 100% Whey 1kg"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Supplements">Supplements</option>
                    <option value="Gear">Gear & Belts</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Snacks">Snacks & Bars</option>
                    <option value="Beverages">Drinks & Hydration</option>
                    <option value="Other">Accessories</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MuscleBlaze, ON, Nike"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Regular Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="2500"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Member Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2200"
                    value={productForm.memberPrice}
                    onChange={(e) => setProductForm({ ...productForm, memberPrice: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Image URL & Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    marginBottom: '8px',
                  }}
                />

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Or pick a photo preset:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: img.url })}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Key ingredients, benefits, flavor, sizing info..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={savingProduct}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: savingProduct ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
