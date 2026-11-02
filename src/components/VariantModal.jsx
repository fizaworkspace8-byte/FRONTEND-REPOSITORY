import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { money } from '../lib/format';
import ColorInput from './ColorInput';

function Modal({ open, onClose, children, maxWidth = 'max-w-2xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={`card relative w-full ${maxWidth} max-h-[calc(100vh-4rem)] overflow-y-auto p-6`}>
        {children}
      </div>
    </div>
  );
}

const EMPTY_VARIANT = {
  sku: '',
  name: '',
  barcode: '',
  color: '',
  color_hex: '',
  model: '',
  connector_type: '',
  compatibility: '',
  warranty_months: '',
  purchase_cost: '',
  sale_price: '',
  tax_rate_override: '',
  reorder_level: '',
  reorder_quantity: '',
  preferred_supplier_id: '',
  extra_attributes: {},
  is_active: true,
};

function VariantModal({
  open,
  onClose,
  productId,
  variant = null,
  suppliers = [],
  onSaved,
}) {
  const isEdit = !!variant;
  const [form, setForm] = useState(isEdit ? { ...variant } : { ...EMPTY_VARIANT });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [skuFieldError, setSkuFieldError] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(isEdit ? { ...variant } : { ...EMPTY_VARIANT });
      setError('');
      setSkuFieldError(false);
    }
  }, [open, isEdit, variant]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleColorChange = (val) => {
    setForm((prev) => ({ ...prev, color: val.color, color_hex: val.color_hex }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSkuFieldError(false);

    const payload = {
      sku: form.sku || null,
      name: form.name || null,
      barcode: form.barcode || null,
      color: form.color || null,
      color_hex: form.color_hex || null,
      model: form.model || null,
      connector_type: form.connector_type || null,
      compatibility: form.compatibility || null,
      warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
      purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      tax_rate_override: form.tax_rate_override ? Number(form.tax_rate_override) : null,
      reorder_level: form.reorder_level ? Number(form.reorder_level) : null,
      reorder_quantity: form.reorder_quantity ? Number(form.reorder_quantity) : null,
      preferred_supplier_id: form.preferred_supplier_id || null,
      extra_attributes: form.extra_attributes || {},
      is_active: form.is_active !== undefined ? form.is_active : true,
    };

    try {
      if (isEdit) {
        await api.patch(`/products/${productId}/variants/${variant.id}`, payload);
      } else {
        await api.post(`/products/${productId}/variants`, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSkuFieldError(true);
          setError('A variant with this SKU already exists.');
        } else {
          setError(err.message || 'Failed to save variant.');
        }
      } else {
        setError(err.message || 'Failed to save variant.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isEdit ? 'Edit Variant' : 'Add Variant'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              SKU
            </label>
            <input
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              required
              className={`h-9 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 ${
                skuFieldError ? 'border-rose-500 dark:border-rose-400 ring-1 ring-inset ring-rose-500/30' : ''
              }`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Barcode
            </label>
            <input
              value={form.barcode}
              onChange={(e) => updateField('barcode', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Color
            </label>
            <ColorInput
              value={{
                color: form.color || '',
                color_hex: form.color_hex || '',
              }}
              onChange={handleColorChange}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Model
            </label>
            <input
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Connector type
            </label>
            <input
              value={form.connector_type}
              onChange={(e) => updateField('connector_type', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Compatibility
            </label>
            <input
              value={form.compatibility}
              onChange={(e) => updateField('compatibility', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Warranty (months)
            </label>
            <input
              type="number"
              value={form.warranty_months}
              onChange={(e) => updateField('warranty_months', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Purchase cost
            </label>
            <input
              type="number"
              step="0.01"
              value={form.purchase_cost}
              onChange={(e) => updateField('purchase_cost', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Sale price
            </label>
            <input
              type="number"
              step="0.01"
              value={form.sale_price}
              onChange={(e) => updateField('sale_price', e.target.value)}
              required
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tax rate override
            </label>
            <input
              type="number"
              step="0.01"
              value={form.tax_rate_override}
              onChange={(e) => updateField('tax_rate_override', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Reorder level
            </label>
            <input
              type="number"
              value={form.reorder_level}
              onChange={(e) => updateField('reorder_level', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Reorder quantity
            </label>
            <input
              type="number"
              value={form.reorder_quantity}
              onChange={(e) => updateField('reorder_quantity', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Preferred supplier
            </label>
            <select
              value={form.preferred_supplier_id}
              onChange={(e) => updateField('preferred_supplier_id', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="is-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:ring-offset-slate-800"
              />
              <label htmlFor="is-active" className="text-sm text-slate-700 dark:text-slate-300">
                Active
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isEdit ? 'Save changes' : 'Add variant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default VariantModal;
