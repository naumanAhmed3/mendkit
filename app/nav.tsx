import Link from 'next/link';

export function Logo({ className = 'w-4.5 h-4.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function Nav({ active }: { active?: 'flows' | 'heals' | 'scan' }) {
  const link = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`px-2.5 py-1 rounded-md ${
        active === key
          ? 'text-white bg-surface-2'
          : 'text-neutral-400 hover:text-neutral-200'
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="border-b border-edge-soft sticky top-0 z-30 bg-ink/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 h-15 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand/15 ring-1 ring-brand/30 text-brand">
              <Logo />
            </span>
            <span className="font-semibold tracking-tight">MendKit</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {link('/', 'flows', 'Flows')}
            {link('/heals', 'heals', 'Heal log')}
            {link('/scan', 'scan', 'Locator scan')}
          </nav>
        </div>
        <span className="text-[11px] font-mono text-neutral-600 hidden sm:block">
          self-healing web automation
        </span>
      </div>
    </header>
  );
}
