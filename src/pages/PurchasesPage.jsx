import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Plus,
  ShoppingBasket,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

function Modal({ open, onClose, children, maxWidth = 'max-w-2xl' }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={`card relative w-full ${maxWidth} max-h-[calc(100vh-4rem)] overflow-y-auto p-6`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function CreatePoModal({ open, onClose, onCreated, suppliers, products }) {
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSupplierId('');
      setExpectedDate('');
      setNotes('');
      setItems([]);
      setSelectedProduct('');
      setSelectedVariant('');
      setQuantity('');
      setUnitCost('');
      setError('');
    }
  }, [open]);

  const productVariants = useMemo(() => {
    const product = products.find((p) => p.id === selectedProduct);
    return product?.variants || [];
  }, [products, selectedProduct]);

  const addItem = () => {
    if (!selectedVariant || !quantity || !unitCost) return;
    const variant = productVariants.find((v) => v.id === selectedVariant);
    if (!variant) return;
    const product = products.find((p) => p.id === selectedProduct);
    setItems((prev) => [
      ...prev,
      {
        variantId: selectedVariant,
        sku: variant.sku,
        productName: product.name,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
      },
    ]);
    setSelectedVariant('');
    setQuantity('');
    setUnitCost('');
    setSelectedProduct('');
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      setError('Add at least one item.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/purchases/orders', {
        supplierId,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          taxRate: 0,
        })),
        expectedDate: expectedDate || null,
        notes: notes || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create purchase order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New purchase order</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a draft PO for supplier.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expected date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Item addition */}
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Add items</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Variant</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                disabled={!selectedProduct}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select variant…</option>
                {productVariants.map((v) => (
                  <option key={v.id} value={v.id}>{v.sku} - {v.name || 'default'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Unit cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedVariant || !quantity || !unitCost}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add to PO
          </button>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Items in PO</h3>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-medium">{item.sku}</p>
                    <p className="text-xs text-slate-500">{item.productName} - {item.quantity} @ ${item.unitCost.toFixed(2)}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Save PO
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReceiveGoodsModal({ open, onClose, onReceived, purchaseOrder, items, locations }) {
  const [receiptItems, setReceiptItems] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && items.length) {
      setReceiptItems(
        items.map((item) => ({
          poItemId: item.id,
          sku: item.sku,
          productName: item.product_name,
          remaining: Number(item.quantity_ordered) - Number(item.quantity_received),
          quantityReceived: '',
        }))
      );
      setLocationId(locations[0]?.id || '');
      setNotes('');
      setError('');
    }
  }, [open, items, locations]);

  const updateQuantity = (idx, value) => {
    setReceiptItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantityReceived: value } : item))
    );
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payloadItems = receiptItems
        .filter((item) => Number(item.quantityReceived) > 0)
        .map((item) => ({
          poItemId: item.poItemId,
          quantityReceived: Number(item.quantityReceived),
          locationId,
        }));
      if (payloadItems.length === 0) throw new Error('Enter at least one received quantity.');
      await api.post(`/purchases/orders/${purchaseOrder.id}/receive`, {
        items: payloadItems,
        notes,
      });
      onReceived();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to receive goods.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Receive goods</h2>
          <p className="mt-1 text-sm text-slate-500">Receive items from PO #{purchaseOrder?.po_number}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Stock location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {receiptItems.map((item, idx) => (
            <div key={item.poItemId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium">{item.sku}</p>
                <p className="text-xs text-slate-500">Remaining: {item.remaining}</p>
              </div>
              <input
                type="number"
                min="0"
                max={item.remaining}
                value={item.quantityReceived}
                onChange={(e) => updateQuantity(idx, e.target.value)}
                placeholder="Qty"
                className="h-9 w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          ))}
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Receive stock
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GenerateResultModal({ result, onClose }) {
  if (!result) return null;
  return (
    <Modal open onClose={onClose} maxWidth="max-w-xl">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reorder drafts generated</h2>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {(result.purchaseOrders || []).length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No draft orders were needed — nothing below its reorder level that isn't already on order.
        </p>
      ) : (
        <ul className="space-y-2">
          {(result.purchaseOrders || []).map((po) => (
            <li key={po.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  PO-{po.poNumber} — {po.supplierName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {po.itemCount} item{po.itemCount === 1 ? '' : 's'} · draft — review and approve on the Purchases page
                </p>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">
                ${Number(po.total).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {(result.skipped || []).length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Skipped</p>
          <ul className="space-y-1.5">
            {(result.skipped || []).map((s, i) => (
              <li key={i} className="flex justify-between gap-4 text-xs">
                <span className="font-mono text-slate-600 dark:text-slate-300">{s.sku}</span>
                <span className="text-right text-slate-500 dark:text-slate-400">{s.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

const STATUS_BADGES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pending: 'bg-blue-100 text-blue-900 dark:bg-blue-400/10 dark:text-blue-300',
  partially_received: 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300',
  received: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-300',
};

export default function PurchasesPage() {
  const { user } = useAuth();
  const canApprove = Boolean(user?.permissions?.includes('purchases.approve'));
  const canCreatePo = Boolean(user?.permissions?.includes('purchases.create'));

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [poItems, setPoItems] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, suppliersRes, productsRes, locationsRes] = await Promise.all([
        api.get('/purchases/orders'),
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/inventory/locations'),
      ]);
      setPurchaseOrders(ordersRes.purchaseOrders);
      setSuppliers(suppliersRes.suppliers);
      setProducts(productsRes.products);
      setLocations(locationsRes.locations);
    } catch (err) {
      setError(err.message || 'Failed to load purchasing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReceiveModal = async (po) => {
    try {
      const detail = await api.get(`/purchases/orders/${po.id}`);
      setSelectedPO(detail.purchaseOrder);
      setPoItems(detail.items);
      setShowReceive(true);
    } catch (err) {
      setError(err.message || 'Failed to load PO details.');
    }
  };

  async function handleApprove(po) {
    setBusyId(po.id);
    setError('');
    try {
      await api.post(`/purchases/orders/${po.id}/approve`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve purchase order.');
    } finally {
      setBusyId('');
    }
  }

  async function handleCancel(po) {
    if (!window.confirm(`Cancel PO-${po.po_number}? This cannot be undone.`)) return;
    setBusyId(po.id);
    setError('');
    try {
      await api.post(`/purchases/orders/${po.id}/cancel`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel purchase order.');
    } finally {
      setBusyId('');
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/alerts/reorder/generate');
      setGenerateResult(res.result);
    } catch (err) {
      setError(err.message || 'Reorder generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Purchases"
        description="Purchase orders, goods receipts, supplier bills and returns."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreatePo ? (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate reorder
              </button>
            ) : null}
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
            >
              <ShoppingBasket className="h-4 w-4" />
              New PO
            </button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 dark:text-rose-300">{error}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">PO #</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Supplier</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Ordered</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Received</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Total</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></td></tr>
              ) : purchaseOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No purchase orders yet.</td></tr>
              ) : purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">PO-{po.po_number}</span>
                      {po.source === 'auto_reorder' ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800 dark:bg-brand-400/10 dark:text-brand-300"
                          title="Auto-generated by the low-stock reorder job"
                        >
                          <Sparkles className="h-3 w-3" /> Auto
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{po.supplier_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGES[po.status] || STATUS_BADGES.draft}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{po.total_ordered}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{po.total_received}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">${Number(po.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {po.status === 'draft' && canApprove ? (
                        <button
                          onClick={() => handleApprove(po)}
                          disabled={busyId === po.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          title="Approve this draft PO"
                        >
                          {busyId === po.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <BadgeCheck className="h-3 w-3" />}
                          Approve
                        </button>
                      ) : null}
                      {['draft', 'pending'].includes(po.status) && canApprove ? (
                        <button
                          onClick={() => handleCancel(po)}
                          disabled={busyId === po.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-400/10"
                          title="Cancel this PO (only if nothing received)"
                        >
                          <Ban className="h-3 w-3" />
                          Cancel
                        </button>
                      ) : null}
                      {po.status !== 'received' && po.status !== 'cancelled' ? (
                        <button
                          onClick={() => openReceiveModal(po)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                        >
                          <Truck className="h-3 w-3" /> Receive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePoModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadData}
        suppliers={suppliers}
        products={products}
      />
      <ReceiveGoodsModal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        onReceived={loadData}
        purchaseOrder={selectedPO}
        items={poItems}
        locations={locations}
      />
      <GenerateResultModal
        result={generateResult}
        onClose={() => setGenerateResult(null)}
      />
    </div>
  );
}