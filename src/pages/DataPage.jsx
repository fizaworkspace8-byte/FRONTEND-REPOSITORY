import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { downloadFile } from '../lib/documents';
import { useAuth } from '../auth/AuthContext';

const TEMPLATE_CSV = [
  'sku,product_name,product_group,category,brand,barcode,color,model,connector_type,compatibility,warranty_months,purchase_cost,sale_price,tax_rate,reorder_level,reorder_quantity,opening_qty,opening_unit_cost,opening_location,preferred_supplier',
  'EXAMPLE-SKU,Example Product,,Cables,ExampleBrand,,Black,MODEL-1,USB-C,Example devices,12,2.50,5.99,0,10,20,5,2.50,Main Warehouse,',
  '',
].join('\n');

const COLUMN_DOCS = [
  ['sku', 'required', 'Unique stock-keeping unit, max 120 chars. Must not already exist.'],
  ['product_name', 'required', 'Product display name, max 255 chars.'],
  ['product_group', 'optional', 'Rows sharing the same group become variants of ONE product.'],
  ['category', 'optional', 'Category name — created automatically if missing.'],
  ['brand', 'optional', 'Brand name — created automatically if missing.'],
  ['barcode', 'optional', 'Primary barcode, unique across your catalog.'],
  ['color / model', 'optional', 'Variant attributes.'],
  ['connector_type / compatibility', 'optional', 'Electronic-accessory attributes.'],
  ['warranty_months', 'optional', 'Whole number 0–240.'],
  ['purchase_cost', 'optional', 'Default cost from supplier, ≥ 0.'],
  ['sale_price', 'required', 'Selling price, ≥ 0.'],
  ['tax_rate', 'optional', 'Percent 0–100.'],
  ['reorder_level / reorder_quantity', 'optional', 'Low-stock alert threshold and suggested reorder qty.'],
  ['opening_qty', 'optional', 'Opening stock quantity, ≥ 0.'],
  ['opening_unit_cost', 'optional', 'Cost per unit for opening stock (falls back to purchase_cost).'],
  ['opening_location', 'optional', 'Location name or code. Defaults to your first location.'],
  ['preferred_supplier', 'optional', 'Supplier NAME — must already exist (create it on the Suppliers page first).'],
];

function downloadTemplate() {
  const blob = new Blob(['\uFEFF' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'circuitstock-import-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ExportButton({ onClick, busy, icon: Icon, label, filename }) {
  return (
    <button
      type="button"
      onClick={() => onClick(filename)}
      disabled={busy}
      className="card card-hover flex w-full items-center gap-3 p-4 text-left disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
      ) : (
        <Icon className="h-5 w-5 shrink-0 text-brand-500" />
      )}
      <span>
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{filename}</span>
      </span>
      <Download className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}

export default function DataPage() {
  const { user } = useAuth();
  const canImport = Boolean(user?.permissions?.includes('products.import'));
  const canExportProducts = Boolean(user?.permissions?.includes('products.export'));
  const canExportContacts = Boolean(user?.permissions?.includes('reports.export'));

  const fileInputRef = useRef(null);

  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [validating, setValidating] = useState(false);
  const [dryResult, setDryResult] = useState(null);
  const [rowErrors, setRowErrors] = useState(null);
  const [rowErrorWarnings, setRowErrorWarnings] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  function resetValidation() {
    setDryResult(null);
    setRowErrors(null);
    setRowErrorWarnings([]);
    setImportDone(null);
    setError('');
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    resetValidation();
    if (file.size > 2 * 1024 * 1024) {
      setError('File is larger than 2 MB. Split it into smaller files.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
      setFileName(file.name);
    };
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsText(file, 'utf-8');
  }

  function handleValidate() {
    if (!csvText) return;
    setValidating(true);
    resetValidation();
    (async () => {
      try {
        const res = await api.post('/imports/products', { csv: csvText, dryRun: true });
        setDryResult(res);
      } catch (err) {
        if (err.status === 422 && err.data && err.data.error && Array.isArray(err.data.error.details)) {
          setRowErrors(err.data.error.details);
          setRowErrorWarnings(err.data.warnings || []);
        } else {
          setError(err.message || 'Validation failed.');
        }
      } finally {
        setValidating(false);
      }
    })();
  }

  function handleImport() {
    if (!dryResult) return;
    setImporting(true);
    setError('');
    (async () => {
      try {
        const res = await api.post('/imports/products', { csv: csvText, dryRun: false });
        setImportDone(res);
        setCsvText('');
        setFileName('');
        setDryResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        if (err.status === 422 && err.data && err.data.error && Array.isArray(err.data.error.details)) {
          setRowErrors(err.data.error.details);
          setRowErrorWarnings(err.data.warnings || []);
        } else {
          setError(err.message || 'Import failed.');
        }
      } finally {
        setImporting(false);
      }
    })();
  }

  async function handleExport(filename) {
    setExporting(filename);
    setError('');
    try {
      const map = {
        'products-export.csv': '/exports/products',
        'customers-export.csv': '/exports/customers',
        'suppliers-export.csv': '/exports/suppliers',
      };
      await downloadFile(map[filename], filename);
    } catch (err) {
      setError(err.message || 'Export failed.');
    } finally {
      setExporting('');
    }
  }

  if (!canImport && !canExportProducts && !canExportContacts) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Data" description="Import and export your data." />
        <div className="card p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your role does not include permission to import or export data.
          </p>
        </div>
      </div>
    );
  }

  const approxRows = csvText ? csvText.trim().split(/\r?\n/).length - 1 : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Data"
        description="Import products from CSV, export your data, and grab a blank import template."
      />

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {canImport ? (
        <div className="card mb-6 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Import products</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Create-only, all-or-nothing: if any row has an error, nothing is imported. Opening
              stock is recorded through the stock ledger and accounting journal automatically.
            </p>
          </div>

          <div className="space-y-5 p-5">
            {/* Step 1: file */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                1 · Choose a CSV file
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-slate-200">
                  <FileUp className="h-4 w-4" />
                  {fileName || 'Choose file…'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download template
                </button>
                {fileName ? (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {fileName} · ~{approxRows} row{approxRows === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Step 2: validate */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                2 · Validate (nothing is saved)
              </p>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!csvText || validating}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Run dry-run check
              </button>

              {/* Dry-run success */}
              {dryResult ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready to import — {dryResult.rowsReceived} row(s) checked, no errors found.
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                    {[
                      ['Products', dryResult.summary.products],
                      ['Variants', dryResult.summary.variants],
                      ['New categories', dryResult.summary.categoriesCreated],
                      ['New brands', dryResult.summary.brandsCreated],
                      ['Opening movements', dryResult.summary.openingMovements],
                      ['Opening stock value', Number(dryResult.summary.openingValue).toFixed(2)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <dt className="text-emerald-800/80 dark:text-emerald-300/80">{label}</dt>
                        <dd className="font-semibold text-emerald-900 dark:text-emerald-200">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {(dryResult.warnings || []).length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      {dryResult.warnings.map((w, i) => (
                        <li key={i}>· {w}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {/* Row errors */}
              {rowErrors ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-400/20 dark:bg-rose-400/10">
                  <p className="flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="h-4 w-4" />
                    {rowErrors.length} row error(s) — nothing was imported. Fix the file and re-validate.
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-rose-800/70 dark:text-rose-300/70">
                          <th className="py-1 pr-4 text-left font-medium">Row</th>
                          <th className="py-1 pr-4 text-left font-medium">SKU</th>
                          <th className="py-1 text-left font-medium">Problem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowErrors.map((e, i) => (
                          <tr key={i} className="border-t border-rose-200/60 dark:border-rose-400/20">
                            <td className="py-1.5 pr-4 font-mono text-rose-900 dark:text-rose-200">{e.row}</td>
                            <td className="py-1.5 pr-4 font-mono text-rose-900 dark:text-rose-200">{e.sku || '—'}</td>
                            <td className="py-1.5 text-rose-900 dark:text-rose-200">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rowErrorWarnings.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-rose-800/70 dark:text-rose-300/70">
                      {rowErrorWarnings.map((w, i) => (
                        <li key={i}>· {w}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Step 3: import */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                3 · Import for real
              </p>
              <button
                type="button"
                onClick={handleImport}
                disabled={!dryResult || importing}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {dryResult ? `${dryResult.rowsReceived} row(s)` : ''}
              </button>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Enabled only after a clean dry run. After importing, check Finance → Overview — the
                inventory integrity check should stay green.
              </p>
            </div>

            {/* Import done */}
            {importDone ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Imported: {importDone.summary.products} product(s), {importDone.summary.variants} variant(s),
                  {' '}{importDone.summary.openingMovements} opening stock movement(s) worth{' '}
                  {Number(importDone.summary.openingValue).toFixed(2)}.
                </p>
                <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  See the new items on the Products page.
                </p>
              </div>
            ) : null}

            {/* Column reference */}
            <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                Column reference
              </summary>
              <ul className="mt-3 space-y-2 text-xs">
                {COLUMN_DOCS.map(([name, req, desc]) => (
                  <li key={name} className="flex flex-wrap items-baseline gap-2">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {name}
                    </code>
                    <span
                      className={
                        req === 'required'
                          ? 'font-semibold text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {req}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{desc}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      ) : null}

      {/* Exports */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exports</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Download your data as CSV — opens directly in Excel.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {canExportProducts ? (
            <ExportButton
              onClick={handleExport}
              busy={exporting === 'products-export.csv'}
              icon={Database}
              label="Products"
              filename="products-export.csv"
            />
          ) : null}
          {canExportContacts ? (
            <ExportButton
              onClick={handleExport}
              busy={exporting === 'customers-export.csv'}
              icon={Database}
              label="Customers"
              filename="customers-export.csv"
            />
          ) : null}
          {canExportContacts ? (
            <ExportButton
              onClick={handleExport}
              busy={exporting === 'suppliers-export.csv'}
              icon={Database}
              label="Suppliers"
              filename="suppliers-export.csv"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}