interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`touch-none relative inline-flex items-center rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-[var(--lavender)]' : 'bg-[var(--border)]'
      }`}
      style={{ width: 38, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
    >
      <span
        className={`inline-block rounded-full bg-white transition-transform duration-200 shadow-sm ${
          checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
        }`}
        style={{ width: 16, height: 16 }}
      />
    </button>
  );
}
