import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { 
  ArrowLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Package,
  Loader2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isUserAdmin = user?.role === 'admin';

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      // The backend actually restricts GET /orders/:id to authenticated users, but it only returns THEIR orders unless they are admin.
      // Wait, orderRoutes.js has GET /orders/:id for non-admin too, let's assume backend handles ownership authorization.
      // Actually, looking at orderRoutes.js, GET /orders/:id is validate(getOrder), orderController.getOrder. 
      // It allows any authenticated user to hit it (assuming the service checks ownership or if admin).
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await orderService.getOrderById(id);
        const data = response.data || response;
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Failed to load order details. It may not exist or you do not have permission to view it.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered':
        return <span className="px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">Delivered</span>;
      case 'pending':
        return <span className="px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">Pending</span>;
      case 'processing':
        return <span className="px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">Processing</span>;
      case 'shipped':
        return <span className="px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">Shipped</span>;
      case 'cancelled':
        return <span className="px-3 py-1.5 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-amazon-orange animate-spin" />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider animate-pulse">Decrypting Order File...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
            Record Not Found
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'The requested order ID does not exist or you lack clearance to view it.'}
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header with Breadcrumb Back */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/orders')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            Order <span className="font-mono text-amazon-orange text-xl">#{order._id}</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <Package className="h-4 w-4 text-amazon-orange" />
              Manifest (Line Items)
            </h3>
            
            <div className="space-y-4">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/50">
                  <div className="h-16 w-16 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-80" />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-200">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: <span className="font-mono">{item.product}</span>
                    </p>
                  </div>
                  <div className="text-right sm:ml-4">
                    <p className="text-sm font-black text-slate-200">
                      ${item.price?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right w-24">
                    <p className="text-sm font-black text-amazon-orange">
                      ${(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column: Customer, Shipping, Financials */}
        <div className="space-y-6">
          
          {/* Financial Breakdown */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none"></div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-5 flex items-center gap-2 relative z-10">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              Financial Breakdown
            </h3>
            
            <div className="space-y-3 text-sm relative z-10">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-300">${order.itemsPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span className="font-semibold text-slate-300">${order.shippingPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Tax</span>
                <span className="font-semibold text-slate-300">${order.taxPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold text-slate-200 uppercase tracking-wider">Gross Total</span>
                <span className="text-xl font-black text-emerald-400">
                  ${order.totalPrice?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              Delivery Destination
            </h3>
            
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/50">
              {order.shippingAddress ? (
                <div className="space-y-1 text-sm text-slate-300">
                  <p className="font-bold text-slate-200 mb-2">{order.shippingAddress.fullName || 'Recipient'}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No delivery address provided.</p>
              )}
            </div>
          </div>

          {/* Customer / Audit Info */}
          {isUserAdmin && order.user && (
            <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Customer Identity
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 flex items-center justify-center text-amazon-orange font-bold">
                  {order.user.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{order.user.email}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
