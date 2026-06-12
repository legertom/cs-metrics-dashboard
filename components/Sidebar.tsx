'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Agents',    href: '/agents' },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-[#0a1120] border-r border-slate-800 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-800">
        <p className="text-blue-400 font-bold text-xs tracking-widest uppercase">CS Metrics</p>
        <p className="text-slate-500 text-[11px] mt-0.5">Team Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-blue-600/20 text-blue-300 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-700">Powered by Talkdesk</p>
      </div>
    </aside>
  );
}
