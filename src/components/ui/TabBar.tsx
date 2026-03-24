import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, BarChart3 } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Trips', icon: Briefcase },
  { path: '/stats', label: 'Stats', icon: BarChart3 },
] as const;

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="tab-bar"
      role="tablist"
      aria-label="Main navigation"
    >
      {TABS.map(tab => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            role="tab"
            aria-selected={isActive}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 touch-none"
            style={{
              color: isActive ? 'var(--lavender)' : 'var(--blue-faint)',
              minHeight: 0,
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
