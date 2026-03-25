import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/backtests', label: 'Backtests' },
  { to: '/deployments', label: 'Deployments' },
  { to: '/chat', label: 'Chat' },
]

export default function Layout({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Sidebar */}
      <nav className="w-56 bg-[#1a1b23] border-r border-[#2e303a] flex flex-col">
        <div className="p-4 border-b border-[#2e303a]">
          <h1 className="text-lg font-bold text-white">AlphaScout</h1>
        </div>
        <div className="flex-1 py-2">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-[#2e303a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2e303a]/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-[#2e303a]">
          <p className="text-xs text-gray-500 truncate mb-2">{email}</p>
          <button
            onClick={onSignOut}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
