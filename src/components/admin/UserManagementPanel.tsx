import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { usersColRef, userDocRef } from '../../auth/firestorePaths';
import type { UserProfile, UserApprovalStatus } from '../../auth/types';
import { USER_ROLES, type UserRole } from '../../auth/roles';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

function normalizeEmail(s: string) {
  return (s || '').toLowerCase().trim();
}

function RolesDropdown({
  value,
  onChange,
}: {
  value: UserRole[];
  onChange: (next: UserRole[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const rootEl = ref.current;
      const popEl = portalRef.current;
      if (!(e.target instanceof Node)) return;
      const insideRoot = rootEl ? rootEl.contains(e.target) : false;
      const insidePop = popEl ? popEl.contains(e.target) : false;
      if (!insideRoot && !insidePop) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const calc = () => {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 320) });
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc, true);
      window.removeEventListener('resize', calc);
    };
  }, [open]);

  const label = value.length ? value.join(', ') : 'Select roles…';

  const toggle = (r: UserRole) => {
    const set = new Set(value);
    if (set.has(r)) set.delete(r);
    else set.add(r);
    onChange(Array.from(set));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-w-[260px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        <span className={value.length ? 'truncate' : 'text-slate-400'}>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-400 shrink-0">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            className="fixed z-[9999] max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            ref={portalRef}
          >
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</p>
            </div>
            <div className="p-2">
              {USER_ROLES.map((r) => {
                const checked = value.includes(r);
                return (
                  <label
                    key={r}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(r)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{r}</span>
                  </label>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(usersColRef(), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as UserProfile);
        setUsers(list);
        setLoading(false);
      },
      () => {
        setUsers([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const f = normalizeEmail(filter);
    if (!f) return users;
    return users.filter((u) => normalizeEmail(u.email).includes(f));
  }, [users, filter]);

  const setStatus = async (uid: string, status: UserApprovalStatus) => {
    await updateDoc(userDocRef(uid), { status });
  };

  const setRoles = async (uid: string, roles: UserRole[]) => {
    await updateDoc(userDocRef(uid), { roles });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-[260px]">
          <Input
            id="userFilter"
            label="ค้นหาด้วย Email"
            placeholder="user@example.com"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${filtered.length} user(s)`}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.uid} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        u.photoURL ||
                        'https://ui-avatars.com/api/?background=2563eb&color=fff&name=' +
                          encodeURIComponent(u.email)
                      }
                      alt={u.email}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.position || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={u.status}
                    onChange={(e) => setStatus(u.uid, e.target.value as UserApprovalStatus).catch(() => {})}
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <RolesDropdown
                    value={(u.roles ?? []) as UserRole[]}
                    onChange={(selected) => setRoles(u.uid, selected).catch(() => {})}
                  />
                  <div className="text-[10px] text-slate-400 mt-1">เลือกได้มากกว่า 1 Role</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="success" onClick={() => setStatus(u.uid, 'approved').catch(() => {})}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setStatus(u.uid, 'rejected').catch(() => {})}>
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

