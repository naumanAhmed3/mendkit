'use client';

import { useMemo, useState } from 'react';
import type { ElementAttrs, TargetKey } from '@/lib/mutation';

// ─────────────────────────────────────────────────────────────
// The mock "Team Access Console" — a deliberately ordinary SaaS admin
// screen. Its element ids / test-ids come from `attrs` (mutated per
// ?v=N); class names stay put so it always looks the same.
// ─────────────────────────────────────────────────────────────

type Attrs = Record<TargetKey, ElementAttrs>;

const MEMBERS = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', status: 'Active' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'Admin', status: 'Active' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Engineer', status: 'Active' },
  { name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Engineer', status: 'Active' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'Engineer', status: 'Active' },
  { name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Engineer', status: 'Invited' },
  { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Engineer', status: 'Active' },
  { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Designer', status: 'Active' },
  { name: 'Donald Knuth', email: 'donald@example.com', role: 'Designer', status: 'Suspended' },
  { name: 'Hedy Lamarr', email: 'hedy@example.com', role: 'Viewer', status: 'Active' },
  { name: 'Tim Berners-Lee', email: 'tim@example.com', role: 'Viewer', status: 'Invited' },
  { name: 'Radia Perlman', email: 'radia@example.com', role: 'Viewer', status: 'Active' },
];

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Invited: 'bg-amber-100 text-amber-700',
  Suspended: 'bg-rose-100 text-rose-700',
};

export function Console({ attrs, version }: { attrs: Attrs; version: number }) {
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEMBERS;
    return MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [query]);

  const tid = (a: ElementAttrs) => a.testId ?? undefined;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1b1f24]">
      <div className="max-w-4xl mx-auto px-7 py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              id={attrs.heading.id}
              data-testid={tid(attrs.heading)}
              className="text-xl font-semibold tracking-tight"
            >
              Team Access Console
            </h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              Manage who can access your workspace ·{' '}
              <span
                id={attrs.count.id}
                data-testid={tid(attrs.count)}
                className="font-medium text-[#374151]"
              >
                {MEMBERS.length} members
              </span>
            </p>
          </div>
          <a
            id={attrs.settings.id}
            data-testid={tid(attrs.settings)}
            href="#settings"
            className="text-[13px] text-[#4b5563] hover:text-[#111827] underline-offset-2 hover:underline"
          >
            Settings
          </a>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <input
            id={attrs.search.id}
            data-testid={tid(attrs.search)}
            type="search"
            aria-label="Search members"
            placeholder="Search members"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-[#d8dbe0] bg-white px-3 text-[13px] outline-none focus:border-[#f97316]"
          />
          <button
            id={attrs.invite.id}
            data-testid={tid(attrs.invite)}
            onClick={() => {
              setPanelOpen(true);
              setToast(null);
            }}
            className="h-9 px-3.5 rounded-lg bg-[#ea580c] text-white text-[13px] font-medium hover:bg-[#c2410c]"
          >
            Invite member
          </button>
          <button
            id={attrs.exportBtn.id}
            data-testid={tid(attrs.exportBtn)}
            onClick={() => setToast(`Exported ${MEMBERS.length} members to CSV`)}
            className="h-9 px-3.5 rounded-lg border border-[#d8dbe0] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#f0f1f3]"
          >
            Export CSV
          </button>
        </div>

        {toast && (
          <div className="mt-3 rounded-lg bg-[#1b1f24] text-white text-[12.5px] px-3.5 py-2">
            {toast}
          </div>
        )}

        {/* Invite panel */}
        {panelOpen && (
          <div className="mt-4 rounded-xl border border-[#d8dbe0] bg-white p-5 shadow-sm">
            <h2
              id={attrs.inviteHeading.id}
              data-testid={tid(attrs.inviteHeading)}
              className="text-[15px] font-semibold"
            >
              Invite a teammate
            </h2>
            <p className="mt-1 text-[12.5px] text-[#6b7280]">
              They will receive an email invitation to join the workspace.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex-1">
                <span className="sr-only">Email address</span>
                <input
                  id={attrs.inviteEmail.id}
                  data-testid={tid(attrs.inviteEmail)}
                  type="email"
                  name="email"
                  aria-label="Email address"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#d8dbe0] px-3 text-[13px] outline-none focus:border-[#f97316]"
                />
              </label>
              <button
                id={attrs.inviteSend.id}
                data-testid={tid(attrs.inviteSend)}
                onClick={() => {
                  setToast(
                    `Invitation sent to ${email.trim() || 'the address'}`,
                  );
                  setPanelOpen(false);
                  setEmail('');
                }}
                className="h-9 px-3.5 rounded-lg bg-[#ea580c] text-white text-[13px] font-medium hover:bg-[#c2410c]"
              >
                Send invite
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="h-9 px-3 rounded-lg text-[13px] text-[#6b7280] hover:text-[#111827]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Members table */}
        <div className="mt-5 rounded-xl border border-[#d8dbe0] bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#8a909a] bg-[#fafbfc]">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.email} className="border-t border-[#eef0f2]">
                  <td className="px-4 py-2.5 font-medium text-[#1b1f24]">
                    {m.name}
                  </td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{m.email}</td>
                  <td className="px-4 py-2.5 text-[#374151]">{m.role}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[m.status]}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#9ca3af]">
                    No members match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] font-mono text-[#9ca3af]">
          target markup version: v{version}
          {version === 0
            ? ' (pristine)'
            : ' — element ids & test-ids mutated'}
        </p>
      </div>
    </div>
  );
}
