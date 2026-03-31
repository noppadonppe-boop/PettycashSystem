import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { usersColRef, userDocRef } from '../../auth/firestorePaths';
import type { UserProfile, UserApprovalStatus } from '../../auth/types';
import { USER_ROLES, type UserRole } from '../../auth/roles';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useData } from '../../context/SafeFirebaseContext';

function normalizeEmail(s: string) {
  return (s || '').toLowerCase().trim();
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return createPortal(
    <div
      className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>,
    document.body
  );
}

// ── Roles multi-select dropdown ───────────────────────────────────────────────
function RolesDropdown({ value, onChange }: { value: UserRole[]; onChange: (next: UserRole[]) => void }) {
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
        className="w-full min-w-[220px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        <span className={value.length ? 'truncate' : 'text-slate-400'}>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-400 shrink-0">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && pos &&
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
              {USER_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                  <input type="checkbox" checked={value.includes(r)} onChange={() => toggle(r)} className="accent-blue-600" />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer">
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Projects multi-select dropdown ───────────────────────────────────────────
function ProjectsDropdown({ 
  projects, 
  value, 
  onChange 
}: { 
  projects: { id: string; name: string }[]; 
  value: string[]; 
  onChange: (next: string[]) => void;
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

  const selectedProjects = projects.filter((p) => value.includes(p.id));
  const label = selectedProjects.length ? selectedProjects.map((p) => p.name).join(', ') : 'เลือกโครงการ…';
  
  const toggle = (projectId: string) => {
    const set = new Set(value);
    if (set.has(projectId)) set.delete(projectId);
    else set.add(projectId);
    onChange(Array.from(set));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-w-[220px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        <span className={selectedProjects.length ? 'truncate' : 'text-slate-400'}>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-400 shrink-0">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div
            className="fixed z-[9999] max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            ref={portalRef}
          >
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">โครงการ / Projects</p>
            </div>
            <div className="p-2">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-400 px-2 py-2">ไม่มีโครงการ / No projects</p>
              ) : (
                projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                    <input type="checkbox" checked={value.includes(p.id)} onChange={() => toggle(p.id)} className="accent-blue-600" />
                    <span className="text-sm text-slate-700">{p.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer">
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<UserApprovalStatus, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:  'bg-amber-50  text-amber-700  border-amber-200',
  rejected: 'bg-rose-50   text-rose-700   border-rose-200',
};

// ── Main panel ────────────────────────────────────────────────────────────────
export function UserManagementPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { projects } = useData();

  // Load users — NO orderBy to avoid requiring a Firestore index; sort in JS
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const unsub = onSnapshot(
      usersColRef(),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ ...d.data(), uid: d.id } as UserProfile))
          .sort((a, b) => {
            // Firestore Timestamp comparison; fallback to 0 if missing
            const at = (a.createdAt as any)?.seconds ?? 0;
            const bt = (b.createdAt as any)?.seconds ?? 0;
            return bt - at; // descending
          });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('UserManagementPanel snapshot error:', err);
        setLoadError('ไม่สามารถโหลดข้อมูล User ได้: ' + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const f = normalizeEmail(filter);
    if (!f) return users;
    return users.filter(
      (u) =>
        normalizeEmail(u.email).includes(f) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(f)
    );
  }, [users, filter]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  const setStatus = async (uid: string, status: UserApprovalStatus) => {
    setSaving((s) => ({ ...s, [`${uid}_status`]: true }));
    try {
      await updateDoc(userDocRef(uid), { status });
      showToast(
        status === 'approved' ? 'อนุมัติ User สำเร็จ ✓' : status === 'rejected' ? 'ปฏิเสธ User แล้ว' : 'อัปเดตสถานะแล้ว',
        status === 'approved' ? 'success' : 'error'
      );
    } catch (err: any) {
      console.error('setStatus error:', err);
      showToast('อัปเดตไม่สำเร็จ: ' + (err?.message ?? 'Unknown error'), 'error');
    } finally {
      setSaving((s) => ({ ...s, [`${uid}_status`]: false }));
    }
  };

  const setRoles = async (uid: string, roles: UserRole[]) => {
    setSaving((s) => ({ ...s, [`${uid}_roles`]: true }));
    try {
      await updateDoc(userDocRef(uid), { roles });
      showToast('บันทึก Roles สำเร็จ ✓', 'success');
    } catch (err: any) {
      console.error('setRoles error:', err);
      showToast('บันทึก Roles ไม่สำเร็จ: ' + (err?.message ?? 'Unknown error'), 'error');
    } finally {
      setSaving((s) => ({ ...s, [`${uid}_roles`]: false }));
    }
  };

  const setAssignedProjects = async (uid: string, assignedProjects: string[]) => {
    setSaving((s) => ({ ...s, [`${uid}_projects`]: true }));
    try {
      await updateDoc(userDocRef(uid), { assignedProjects });
      showToast('บันทึกโครงการที่มอบหมายสำเร็จ ✓', 'success');
    } catch (err: any) {
      console.error('setAssignedProjects error:', err);
      showToast('บันทึกโครงการไม่สำเร็จ: ' + (err?.message ?? 'Unknown error'), 'error');
    } finally {
      setSaving((s) => ({ ...s, [`${uid}_projects`]: false }));
    }
  };

  const deleteUser = async (uid: string, email: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบ User "${email}"?\n\nการลบ User นี้จะไม่สามารถเรียกคืนได้`);
    if (!confirmed) return;

    setSaving((s) => ({ ...s, [`${uid}_delete`]: true }));
    try {
      await deleteDoc(userDocRef(uid));
      showToast('ลบ User สำเร็จ ✓', 'success');
    } catch (err: any) {
      console.error('deleteUser error:', err);
      showToast('ลบ User ไม่สำเร็จ: ' + (err?.message ?? 'Unknown error'), 'error');
    } finally {
      setSaving((s) => ({ ...s, [`${uid}_delete`]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Search + count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-[260px]">
          <Input
            id="userFilter"
            label="ค้นหา User (Email / ชื่อ)"
            placeholder="user@example.com หรือ ชื่อ"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          {loading ? (
            <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Loading…</span>
          ) : (
            `${filtered.length} / ${users.length} user(s)`
          )}
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertTriangle size={16} />
          {loadError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">โครงการที่มอบหมาย</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  กำลังโหลด...
                </td>
              </tr>
            )}
            {!loading && filtered.map((u) => {
              const isSavingStatus = saving[`${u.uid}_status`];
              const isSavingRoles  = saving[`${u.uid}_roles`];
              const isSavingProjects = saving[`${u.uid}_projects`];
              return (
                <tr key={u.uid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.photoURL ||
                          'https://ui-avatars.com/api/?background=2563eb&color=fff&name=' +
                            encodeURIComponent(u.email)
                        }
                        alt={u.email}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
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

                  {/* Position */}
                  <td className="px-4 py-3 text-slate-600 text-xs">{u.position || '—'}</td>

                  {/* Status select */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_STYLES[u.status] ?? ''}`}
                        value={u.status}
                        disabled={isSavingStatus}
                        onChange={(e) => setStatus(u.uid, e.target.value as UserApprovalStatus)}
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                      {isSavingStatus && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    </div>
                  </td>

                  {/* Roles dropdown */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RolesDropdown
                        value={(u.roles ?? []) as UserRole[]}
                        onChange={(selected) => setRoles(u.uid, selected)}
                      />
                      {isSavingRoles && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">เลือกได้มากกว่า 1 Role</div>
                  </td>

                  {/* Assigned Projects dropdown */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProjectsDropdown
                        projects={projects}
                        value={(u.assignedProjects ?? [])}
                        onChange={(selected) => setAssignedProjects(u.uid, selected)}
                      />
                      {isSavingProjects && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">1 User สามารถเลือกได้หลายโครงการ</div>
                  </td>

                  {/* Quick action buttons */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {u.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="success"
                          disabled={isSavingStatus}
                          onClick={() => setStatus(u.uid, 'approved')}
                        >
                          {isSavingStatus ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Approve
                        </Button>
                      )}
                      {u.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isSavingStatus}
                          onClick={() => setStatus(u.uid, 'rejected')}
                        >
                          {isSavingStatus ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                          Reject
                        </Button>
                      )}
                      {u.status === 'approved' && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Approved
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deleteUser(u.uid, u.email)}
                        title="ลบ User / Delete User"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && !loadError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  ไม่พบ User
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
