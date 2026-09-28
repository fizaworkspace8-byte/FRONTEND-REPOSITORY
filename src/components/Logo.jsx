export default function Logo({ className = 'h-9 w-9' }) {
  return (
    <img
      src="/logo.svg"
      alt="CircuitStock logo"
      className={className}
      draggable="false"
    />
  );
}