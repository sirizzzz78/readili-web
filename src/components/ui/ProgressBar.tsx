interface ProgressBarProps {
  progress: number; // 0-1
  complete?: boolean;
}

export function ProgressBar({ progress, complete }: ProgressBarProps) {
  const fill = complete ? 'var(--salmon)' : 'var(--lavender)';
  return (
    <div className="h-[5px] w-full rounded-full bg-[var(--border)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: fill }}
      />
    </div>
  );
}
