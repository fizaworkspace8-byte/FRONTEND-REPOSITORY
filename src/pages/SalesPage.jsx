import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Loader2,
  Receipt,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { ColorSwatch } from '../components/ColorSwatch';
import Badge from '../components/Badge';
import { api } from '../lib/api';
import { money, dateTime } from '../lib/format';
import { openPdf } from '../lib/documents';

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

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saleResult, setSaleResult] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [loading, setLoading] = useState(true);

  const [recentSales, setRecentSales] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [docBusy, setDocBusy] = useState('');

  const searchInputRef = useRef(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, locationsRes, customersRes] = await Promise.all([
        api.get('/products?limit=500&active=true&sortBy=name&sortDir=asc'),
        api.get('/inventory/locations'),
        api.get('/customers'),
      ]);
      setProducts(productsRes.products);
      setLocations(locationsRes.locations);
      setSelectedLocationId(locationsRes.locations[0]?.id || '');
      setCustomers(customersRes.customers);
    } catch (err) {
      setError(err.message || 'Failed to load POS data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentSales = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await api.get('/sales?limit=10');
      setRecentSales(res.sales || []);
    } catch {
      setRecentSales([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    loadRecentSales();
    // Focus search input on mount
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [loadInitialData, loadRecentSales]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            (v.barcode || '').toLowerCase().includes(q)
        )
    );
  }, [products, search]);

  const addToCart = (product, variant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          sku: variant.sku,
          productName: product.name,
          variantName: variant.name || 'Default',
          unitPrice: Number(variant.sale_price),
          quantity: 1,
          discountAmount: 0,
          taxRate: 0,
          locationId: selectedLocationId,
        },
      ];
    });
  };

  const updateCartQuantity = (variantId, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.variantId !== variantId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartDiscount = (variantId, discountAmount) => {
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, discountAmount: Number(discountAmount || 0) }
          : item
      )
    );
  };

  const removeFromCart = (variantId) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const cartTax = cart.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity - item.discountAmount) * (item.taxRate / 100),
    0
  );
  const cartTotal = cartSubtotal - cartDiscount + cartTax;
  const amountReceivedNum = Number(amountReceived || 0);
  const balanceDue = cartTotal - amountReceivedNum;

  const handleCreateCustomer = async () => {
    try {
      const res = await api.post('/customers', newCustomer);
      setCustomers((prev) => [...prev, res.customer]);
      setSelectedCustomerId(res.customer.id);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', email: '', phone: '' });
    } catch (err) {
      setError(err.message || 'Failed to create customer.');
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (amountReceivedNum > cartTotal) {
      setError('Amount received cannot exceed total.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        customerId: selectedCustomerId || null,
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          locationId: item.locationId,
        })),
        payments: [
          {
            amount: amountReceivedNum,
            method: paymentMethod,
          },
        ],
        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      };
      const response = await api.post('/sales', payload);
      setSaleResult(response.sale);
      setShowInvoice(true);
      setCart([]);
      setAmountReceived('');
      setSearch('');
      loadRecentSales();
    } catch (err) {
      setError(err.message || 'Sale failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDoc = async (kind, saleId) => {
    setDocBusy(`${kind}-${saleId}`);
    try {
      await openPdf(`/documents/${kind === 'invoice' ? 'sale-invoice' : 'sale-receipt'}/${saleId}`);
    } catch (err) {
      setError(err.message || 'Could not open document.');
    } finally {
      setDocBusy('');
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={ShoppingCart}
        title="Sales / POS"
        description="Fast checkout with product search, cart, and payment recording."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: product search and selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 hover-accent-emerald">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, or barcode…"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
              />
            </div>
          </div>

          <div className="card max-h-[55vh] overflow-y-auto p-4">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No products found.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="rounded-xl border border-slate-200/80 bg-white/60 p-3 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 dark:border-slate-800/80 dark:bg-slate-900/60">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                        <Badge tone="slate">{product.brand_name || 'No brand'}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white/80 p-2 dark:border-slate-800 dark:bg-slate-800/60"
                        >
                          <div>
                            <p className="text-sm font-medium">{variant.sku}</p>
                            <p className="text-xs text-slate-500">
                              <ColorSwatch color={variant.color || ''} hex={variant.color_hex || ''} size="sm" />
                              {variant.color && <span className="ml-1">{variant.color}</span>} | Qty: {variant.quantity_on_hand} | Sale: {money(variant.sale_price || 0)}
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(product, variant)}
                            disabled={Number(variant.quantity_on_hand) <= 0}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: cart and payment */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Current sale</h2>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4" />
                {selectedCustomerId
                  ? customers.find((c) => c.id === selectedCustomerId)?.name || 'Select'
                  : 'Walk-in'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.sku}</p>
                        <p className="text-xs text-slate-500">{item.productName} - {item.variantName}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-slate-400 hover:text-rose-500"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.variantId, Number(e.target.value))}
                        className="h-8 w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-sm text-slate-500">x ${item.unitPrice.toFixed(2)}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Discount"
                        value={item.discountAmount || ''}
                        onChange={(e) => updateCartDiscount(item.variantId, e.target.value)}
                        className="h-8 w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 space-y-1 text-sm dark:border-slate-800">
              <div className="flex justify-between"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-${cartDiscount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${cartTax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Amount received</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-2 text-right text-sm text-slate-500">
              Balance due: <span className="font-semibold text-slate-900 dark:text-white">${Math.max(0, balanceDue).toFixed(2)}</span>
            </div>
            {balanceDue > 0 && amountReceivedNum > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Credit sale: remaining balance will be tracked.</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-60 dark:from-brand-600 dark:to-brand-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Complete sale
          </button>
        </div>
      </div>

      {/* Recent sales with document access */}
      <DataTable
        columns={[
          {
            key: 'sale_number',
            label: 'Sale #',
            sortable: true,
            render: (s) => <span className="font-medium text-slate-900 dark:text-white">#{s.sale_number}</span>,
          },
          {
            key: 'sale_date',
            label: 'Date',
            sortable: true,
            render: (s) => <span className="text-slate-600 dark:text-slate-300">{dateTime(s.sale_date)}</span>,
          },
          {
            key: 'customer',
            label: 'Customer',
            render: (s) => (
              <span className="text-slate-600 dark:text-slate-300">
                {s.customer_name || (s.customer_id ? 'Customer' : 'Walk-in')}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (s) => (
              <Badge
                tone={
                  s.status === 'cancelled' ? 'rose' : s.status === 'pending' ? 'amber' : 'emerald'
                }
              >
                {s.status}
              </Badge>
            ),
          },
          {
            key: 'payment_status',
            label: 'Payment',
            render: (s) => (
              <Badge
                tone={
                  s.payment_status === 'paid'
                    ? 'emerald'
                    : s.payment_status === 'partial'
                    ? 'amber'
                    : 'slate'
                }
              >
                {s.payment_status}
              </Badge>
            ),
          },
          {
            key: 'total',
            label: 'Total',
            align: 'right',
            className: 'tabular-nums',
            sortable: true,
            render: (s) => <span className="font-medium text-slate-900 dark:text-white">{money(s.total)}</span>,
          },
          {
            key: 'actions',
            label: '',
            headerClassName: 'text-right',
            render: (s) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenDoc('invoice', s.id)}
                  disabled={Boolean(docBusy)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Open A4 invoice PDF"
                >
                  {docBusy === `invoice-${s.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDoc('receipt', s.id)}
                  disabled={Boolean(docBusy)}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  title="Open thermal-style receipt PDF"
                >
                  {docBusy === `receipt-${s.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Receipt className="h-3 w-3" />
                  )}
                  Receipt
                </button>
              </div>
            ),
          },
        ]}
        rows={recentLoading ? [] : recentSales}
        loading={recentLoading}
        empty="No sales yet."
        sort={{ key: 'sale_date', dir: 'desc' }}
        onSortChange={(key, dir) => {
          // Client-side sort handled by DataTable; recentSales is already sorted by backend
        }}
      />

      {/* Customer creation modal */}
      <Modal open={showCustomerModal} onClose={() => setShowCustomerModal(false)} maxWidth="max-w-md">
        <h2 className="mb-4 text-lg font-semibold">Add customer</h2>
        <div className="space-y-3">
          <input
            value={newCustomer.name}
            onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Full name"
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <input
            value={newCustomer.email}
            onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            type="email"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <input
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCustomerModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium">Cancel</button>
            <button onClick={handleCreateCustomer} className="rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-ink-950">Save customer</button>
          </div>
        </div>
      </Modal>

      {/* Sale success modal with document buttons */}
      <Modal open={showInvoice} onClose={() => setShowInvoice(false)} maxWidth="max-w-lg">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Sale #{saleResult?.sale_number} completed</h2>
          <button onClick={() => setShowInvoice(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Status:</span> {saleResult?.status}</p>
          <p><span className="font-medium">Total:</span> {money(saleResult?.total)}</p>
          <p><span className="font-medium">Amount paid:</span> {money(saleResult?.amount_paid)}</p>
          <p><span className="font-medium">Balance due:</span> {money(saleResult?.balance_due)}</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenDoc('invoice', saleResult.id)}
            disabled={Boolean(docBusy)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {docBusy === `invoice-${saleResult?.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            View invoice
          </button>
          <button
            type="button"
            onClick={() => handleOpenDoc('receipt', saleResult.id)}
            disabled={Boolean(docBusy)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {docBusy === `receipt-${saleResult?.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="h-4 w-4" />
            )}
            View receipt
          </button>
        </div>
      </Modal>
    </div>
  );
}