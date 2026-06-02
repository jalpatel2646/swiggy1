import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import EmptyState from '../components/EmptyState';
import { TableRowSkeleton } from '../components/Skeleton';
import shippingService from '../services/shippingService';
import { 
  Truck, 
  PackageCheck,
  PackageOpen,
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ShieldAlert,
  Edit,
  MapPin
} from 'lucide-react';

const Shipping = () => {
  useDocumentTitle('Shipping & Logistics');
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isUserAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'delivered'
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateStatusForm, setUpdateStatusForm] = useState({
    status: '',
    location: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchShipments = async () => {
    if (!isUserAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      let response;
      if (activeTab === 'pending') {
        response = await shippingService.getPendingShipments(params);
      } else {
        response = await shippingService.getDeliveredShipments(params);
      }
      
      const data = response.data || response;
      setShipments(data.results || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setError('Failed to retrieve shipping records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setPage(1);
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateStatusForm({
      status: order.status || '',
      location: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      await shippingService.updateStatus(selectedOrder._id, updateStatusForm);
      toast.success('Shipment status updated successfully.');
      closeUpdateModal();
      fetchShipments(); // Refresh list
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Delivered</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Pending</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Processing</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">Shipped</span>;
      case 'out_for_delivery':
        return <span className="px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">Out for Delivery</span>;
      case 'returned':
      case 'exception':
        return <span className="px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            The Shipping Dashboard is restricted to fulfillment staff and administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange shadow-inner">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Shipping Logs & Dispatch</h2>
            <p className="text-xs text-slate-400 font-medium">Manage pending fulfillments and track active courier states</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 glass-card rounded-2xl p-1.5 border border-slate-800 w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => handleTabChange('pending')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <PackageOpen className="h-4 w-4" />
          Active / Pending
        </button>
        <button
          onClick={() => handleTabChange('delivered')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'delivered'
              ? 'bg-emerald-950/40 text-emerald-400 shadow-sm border border-emerald-500/30'
              : 'text-slate-500 hover:text-emerald-400/70 hover:bg-emerald-950/20'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          Delivered
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Recipient</th>
                <th className="px-6 py-4 font-bold">Carrier</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                </>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState title={`No ${activeTab} shipments found`} message={`There are currently no records in the ${activeTab} fulfillment queue.`} />
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {shipment._id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{shipment.shippingAddress?.fullName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {shipment.shippingAddress?.city}, {shipment.shippingAddress?.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {shipment.shippingInfo?.carrier ? (
                        <div className="font-semibold text-amazon-yellow bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block">
                          {shipment.shippingInfo.carrier}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(shipment.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {activeTab === 'pending' && (
                          <button 
                            onClick={() => openUpdateModal(shipment)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amazon-orange text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                            title="Update Status"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/shipping/tracking/${shipment._id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                          title="View Tracking"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controller */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-bold text-slate-300">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-bold text-slate-300 px-2">{page}</div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeUpdateModal}></div>
          <div className="glass-effect relative w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit className="h-5 w-5 text-amazon-orange" />
                Update Shipment
              </h3>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  New Status
                </label>
                <select 
                  required
                  value={updateStatusForm.status}
                  onChange={(e) => setUpdateStatusForm({...updateStatusForm, status: e.target.value})}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 appearance-none"
                >
                  <option value="" disabled>Select Status...</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="exception">Exception / Delay</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Location (Optional)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Sort Facility, Chicago IL"
                  value={updateStatusForm.location}
                  onChange={(e) => setUpdateStatusForm({...updateStatusForm, location: e.target.value})}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 placeholder-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Event Description (Optional)
                </label>
                <textarea 
                  placeholder="e.g. Package scanned at origin facility."
                  value={updateStatusForm.description}
                  onChange={(e) => setUpdateStatusForm({...updateStatusForm, description: e.target.value})}
                  rows="3"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 placeholder-slate-600 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !updateStatusForm.status}
                  className="px-5 py-2.5 rounded-xl bg-amazon-orange hover:bg-amber-500 text-slate-950 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Commit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipping;
