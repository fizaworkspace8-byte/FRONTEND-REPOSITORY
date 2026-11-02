function ColorSwatch({ color, hex, size = 'md', className }) {
  if (!color) return null;

  const SIZE_MAP = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const hasHex = hex && hex.trim() !== '';
  const veryLight =
    hasHex &&
    (function () {
      const h = hex.replace('#', '');
      if (h.length !== 6) return false;
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      // Perceived luminance > ~80% counts as very light
      return (r * 0.299 + g * 0.587 + b * 0.114) > 220;
    })();

  if (!hasHex) {
    return (
      <span
        className={`rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20 shadow-sm ${SIZE_MAP[size] || SIZE_MAP.md} bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[10px] ${className || ''}`}
        title={color}
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={`rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20 shadow-sm ${SIZE_MAP[size] || SIZE_MAP.md} ${className || ''}`}
      style={{ backgroundColor: hex }}
      title={color}
    />
  );
}

export { ColorSwatch };
export default ColorSwatch;
