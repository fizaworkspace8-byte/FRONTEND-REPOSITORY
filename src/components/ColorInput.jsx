import { useState } from 'react';
import { ColorSwatch } from './ColorSwatch';

const PRESETS = [
  { color: 'Black', hex: '#1A1A1A' },
  { color: 'White', hex: '#FFFFFF' },
  { color: 'Red', hex: '#DC2626' },
  { color: 'Blue', hex: '#2563EB' },
  { color: 'Green', hex: '#16A34A' },
  { color: 'Yellow', hex: '#EAB308' },
  { color: 'Purple', hex: '#7C3AED' },
  { color: 'Pink', hex: '#EC4899' },
  { color: 'Orange', hex: '#EA580C' },
  { color: 'Gray', hex: '#6B7280' },
  { color: 'Silver', hex: '#C0C0C0' },
  { color: 'Gold', hex: '#D4AF37' },
];

function ColorInput({ value, onChange }) {
  const [name, setName] = useState(value.color || '');
  const [hex, setHex] = useState(value.color_hex || '');

  const presets = PRESETS.map((p) => ({
    color: p.color,
    hex: p.hex,
    active: p.hex === hex,
  }));

  function handleNameChange(e) {
    const n = e.target.value;
    setName(n);
    onChange({ color: n || null, color_hex: hex || null });
  }

  function handleHexChange(e) {
    const h = e.target.value;
    setHex(h);
    onChange({ color: name || null, color_hex: h || null });
  }

  function applyPreset(p) {
    setHex(p.hex);
    setName(name || p.color);
    onChange({ color: name || p.color, color_hex: p.hex });
  }

  function clearColor() {
    setName('');
    setHex('');
    onChange({ color: null, color_hex: null });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Color name (e.g. Black)"
          className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
        />
        <button
          type="button"
          onClick={clearColor}
          disabled={!name && !hex}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Presets:</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.color}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-lg p-1.5 transition ring-1 ring-inset ring-transparent ${p.active ? 'ring-brand-500' : ''} ${classNames(p.hex)}`}
              title={`${p.color} ${p.hex}`}
              aria-label={p.color}
            >
              <span
                className={`rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20 shadow-sm h-5 w-5 ${p.hex === '#FFFFFF' || p.hex === '#EC4899' ? 'ring-black/20 dark:ring-white/30' : ''}`}
                style={{ backgroundColor: p.hex }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Hex picker:</label>
        <input
          type="color"
          value={hex || '#000000'}
          onChange={handleHexChange}
          className="h-8 w-8 rounded-lg border-none bg-transparent p-0 cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:h-full [&::-webkit-color-swatch]:w-full [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:shadow-sm"
          aria-label="Color picker"
        />
        {hex ? (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{hex}</span>
        ) : null}
      </div>
    </div>
  );
}

function classNames(hex) {
  if (hex === '#FFFFFF') return 'bg-white';
  return `bg-slate-200`;
}

export default ColorInput;
