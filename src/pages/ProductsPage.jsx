import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { downloadFile } from '../lib/documents';

/* ------------------------------------------------------------------ */
/* Reusable portal modal                                               */
/* ------------------------------------------------------------------ */
function Modal({ open, onClose, children, maxWidth = 'max-w-4xl' }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        className={`card relative w-full ${maxWidth} max-h-[calc(100vh-4rem)] overflow-y-auto p-6`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/* Empty product form                                                  */
/* ------------------------------------------------------------------ */
const emptyProduct = {
  name: '',
  description: '',
  productType: 'simple',
  categoryId: '',
  brandId: '',
  isSerialTracked: false,
  variants: [
    {
      sku: '',
      barcode: '',
      name: '',
      color: '',
      model: '',
      connectorType: '',
      compatibility: '',
      warrantyMonths: '',
      purchaseCost: '',
      salePrice: '',
      reorderLevel: '',
      reorderQuantity: '',
      preferredSupplierId: '',
      extraAttributes: {},
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Product creation modal                                              */
/* ------------------------------------------------------------------ */
function ProductModal({ open, onClose, onCreated, categories, brands, suppliers }) {
  const [form, setForm] = useState(emptyProduct);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(emptyProduct);
      setError('');
    }
  }, [open]);

  const updateProduct = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...emptyProduct.variants[0] }],
    }));
  };

  const removeVariant = (index) => {
    if (form.variants.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
        variants: form.variants.map((v) => ({
          ...v,
          barcode: v.barcode || null,
          name: v.name || null,
          color: v.color || null,
          model: v.model || null,
          connectorType: v.connectorType || null,
          compatibility: v.compatibility || null,
          preferredSupplierId: v.preferredSupplierId || null,
          warrantyMonths: Number(v.warrantyMonths || 0),
          purchaseCost: Number(v.purchaseCost || 0),
          salePrice: Number(v.salePrice || 0),
          reorderLevel: Number(v.reorderLevel || 0),
          reorderQuantity: Number(v.reorderQuantity || 0),
        })),
      };
      await api.post('/products', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            New product
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create a product with at least one variant.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Product name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateProduct('name', e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="USB-C Fast Charger"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateProduct('categoryId', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Brand
            </label>
            <select
              value={form.brandId}
              onChange={(e) => updateProduct('brandId', e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="serial-tracked"
              type="checkbox"
              checked={form.isSerialTracked}
              onChange={(e) => updateProduct('isSerialTracked', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
            />
            <label htmlFor="serial-tracked" className="text-sm text-slate-700 dark:text-slate-300">
              Serial-number tracking
            </label>
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Variants</h3>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <Plus className="h-4 w-4" /> Add variant
            </button>
          </div>

          {form.variants.map((variant, index) => (
            <div key={index} className="mb-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variant {index + 1}
                </span>
                {form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">SKU *</label>
                  <input
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Barcode</label>
                  <input
                    value={variant.barcode || ''}
                    onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Variant name</label>
                  <input
                    value={variant.name || ''}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Color</label>
                  <input
                    value={variant.color || ''}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Model</label>
                  <input
                    value={variant.model || ''}
                    onChange={(e) => updateVariant(index, 'model', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Connector</label>
                  <input
                    value={variant.connectorType || ''}
                    onChange={(e) => updateVariant(index, 'connectorType', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Compatibility</label>
                  <textarea
                    value={variant.compatibility || ''}
                    onChange={(e) => updateVariant(index, 'compatibility', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-4 lg:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Warranty (months)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={variant.warrantyMonths}
                      onChange={(e) => updateVariant(index, 'warrantyMonths', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Purchase cost</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={variant.purchaseCost}
                      onChange={(e) => updateVariant(index, 'purchaseCost', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Sale price</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={variant.salePrice}
                      onChange={(e) => updateVariant(index, 'salePrice', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Reorder level</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={variant.reorderLevel}
                      onChange={(e) => updateVariant(index, 'reorderLevel', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Reorder qty</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={variant.reorderQuantity}
                      onChange={(e) => updateVariant(index, 'reorderQuantity', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Preferred supplier</label>
                  <select
                    value={variant.preferredSupplierId || ''}
                    onChange={(e) => updateVariant(index, 'preferredSupplierId', e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Save product
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Stock adjustment modal                                              */
/* ------------------------------------------------------------------ */
function AdjustStockModal({ open, onClose, onAdjusted, products, locations }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [movementType, setMovementType] = useState('adjustment');
  const [quantityChange, setQuantityChange] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedProductId('');
      setSelectedVariantId('');
      setLocationId(locations[0]?.id || '');
      setMovementType('adjustment');
      setQuantityChange('');
      setUnitCost('');
      setNotes('');
      setError('');
    }
  }, [open, locations]);

  const productVariants = useMemo(() => {
    const product = products.find((p) => p.id === selectedProductId);
    return product?.variants || [];
  }, [products, selectedProductId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const qty = Number(quantityChange);
      if (Number.isNaN(qty) || qty === 0) throw new Error('Quantity must be a non-zero number.');
      const payload = {
        variantId: selectedVariantId,
        locationId,
        movementType,
        quantityChange: qty,
        notes: notes || undefined,
        unitCost:
          movementType === 'opening' || movementType === 'receipt'
            ? Number(unitCost || 0)
            : undefined,
      };
      await api.post('/inventory/adjust', payload);
      onAdjusted();
      onClose();
    } catch (err) {
      setError(err.message || 'Adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Adjust stock</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Controlled movement through the ledger.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Product</label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedVariantId('');
            }}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Variant/SKU</label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            required
            disabled={!selectedProductId}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Select variant…</option>
            {productVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.sku} - {v.name || 'default'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Movement type</label>
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="adjustment">Adjustment</option>
            <option value="opening">Opening stock</option>
            <option value="damage">Damage</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity change</label>
            <input
              type="text"
              inputMode="decimal"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-400">Positive = increase, negative = decrease</p>
          </div>
          {(movementType === 'opening') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Unit cost</label>
              <input
                type="text"
                inputMode="decimal"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
            Record movement
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Main Products page                                                  */
/* ------------------------------------------------------------------ */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadFile('/exports/products', 'products-catalog.csv');
    } catch (err) {
      setError(err.message || 'Failed to export products.');
    } finally {
      setExporting(false);
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes, brandsRes, suppliersRes, locationsRes] =
        await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/brands'),
          api.get('/suppliers'),
          api.get('/inventory/locations'),
        ]);

      setProducts(productsRes.products);
      setCategories(categoriesRes.categories);
      setBrands(brandsRes.brands);
      setSuppliers(suppliersRes.suppliers);
      setLocations(locationsRes.locations);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const lowStockCount = products.reduce(
    (acc, p) =>
      acc +
      p.variants.filter((v) => v.quantity_on_hand <= v.reorder_level).length,
    0
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Products"
        description="Catalog, variants, stock levels, and controlled stock adjustments."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              )}
              Export CSV
            </button>
            <button
              onClick={() => setShowAdjust(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust stock
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
            >
              <PackagePlus className="h-4 w-4" />
              New product
            </button>
          </div>
        }
      />

      <div className="card mb-4 p-4 hover-accent-blue">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode…"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white/90 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Product</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Variants</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Total stock</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalQty = product.variants.reduce(
                    (sum, v) => sum + Number(v.quantity_on_hand || 0),
                    0
                  );
                  const isExpanded = expandedProductId === product.id;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.brand_name || 'No brand'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {product.category_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {product.variants.length}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {totalQty}
                      </td>
                      <td className="px-4 py-3">
                        {product.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-900 dark:bg-slate-400/10 dark:text-slate-300">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                          aria-label="Toggle variants"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {expandedProductId && (
        <div className="card mt-4 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Variants</h3>
          {(() => {
            const product = products.find((p) => p.id === expandedProductId);
            if (!product) return null;
            return (
              <div className="space-y-2">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white">{v.sku}</span>
                      <span className="ml-2 text-sm text-slate-500">{v.name || 'Default'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Qty: {v.quantity_on_hand}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Avg cost: {v.average_cost}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Sale: {v.sale_price}
                      </span>
                      {v.quantity_on_hand <= v.reorder_level &&
                        Number(v.quantity_on_hand) > 0 && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {lowStockCount > 0 && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          {lowStockCount} variant(s) are at or below reorder level.
        </p>
      )}

      <ProductModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadData}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
      />
      <AdjustStockModal
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        onAdjusted={loadData}
        products={products}
        locations={locations}
      />
    </div>
  );
}