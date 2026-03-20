/**
 * Sidebar Navigation — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'Master' },
  { href: '/agents', icon: '🤖', label: 'Agents' },
  { href: '/tickets', icon: '🎫', label: 'Tickets' },
  { href: '/learnings', icon: '📚', label: 'Learnings' },
  { href: '/skills', icon: '🧩', label: 'Skills' },
  { href: '/usage', icon: '📊', label: 'Model Usage' },
  { href: '/fvp', icon: '🔁', label: 'FVP Loop' },
  { href: '/logs', icon: '📋', label: 'Logs' },
  { href: '/training', icon: '⚙️', label: 'Training' },
  { href: '/checkpoints', icon: '🛡️', label: 'Checkpoints' },
  { href: '/vision', icon: '🔒', label: 'Vision Lock' },
  { href: '/lifecycle', icon: '🔄', label: 'Lifecycle' },
  { href: '/memory', icon: '🔐', label: 'Memory' },
  { href: '/cdp', icon: '🤝', label: 'CDP Sessions' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-950 border-r border-gray-800 flex flex-col min-h-screen fixed left-0 top-0 z-10">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-sm font-bold tracking-wider text-cyan-400">ONXZA</h1>
        <p className="text-[10px] text-gray-500 tracking-widest uppercase">Mission Control</p>
      </div>
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-gray-800/60 text-white border-r-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800 text-[10px] text-gray-600">
        DevGru Technology Products
      </div>
    </aside>
  );
}
