import React, { useEffect, useMemo, useState } from 'react';
import { onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Modal } from '../ui/Modal';
import { usersColRef, userDocRef } from '../../auth/firestorePaths';
import type { UserProfile, UserApprovalStatus } from '../../auth/types';
import { USER_ROLES, type UserRole } from '../../auth/roles';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

function normalizeEmail(s: string) {
  return (s || '').toLowerCase().trim();
}

export function UserManagementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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
    <Modal open={open} onClose={onClose} title="จัดการ User / User Management" size="lg">
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-[240px]">
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
                        src={u.photoURL || 'https://ui-avatars.com/api/?background=2563eb&color=fff&name=' + encodeURIComponent(u.email)}
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
                    <select
                      multiple
                      className="min-w-[220px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={u.roles ?? []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map((o) => o.value) as UserRole[];
                        setRoles(u.uid, selected).catch(() => {});
                      }}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">เลือกได้มากกว่า 1 Role (กด Ctrl/Shift)</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => setStatus(u.uid, 'approved').catch(() => {})}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setStatus(u.uid, 'rejected').catch(() => {})}
                      >
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

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

