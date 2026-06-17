import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/budget", label: "Budget Plan" },
  { to: "/income", label: "Income" },
  { to: "/expenses", label: "Expenses" },
  { to: "/recurring", label: "Recurring" },
  { to: "/savings", label: "Savings Goals" },
  { to: "/categories", label: "Categories" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-6">
        <h1 className="text-lg font-bold tracking-tight">Budget App</h1>
        <p className="mt-1 text-xs text-muted">Personal finance tracker</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface-elevated hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
