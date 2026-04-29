import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, CheckCircle, XCircle, DollarSign, FileText,
  AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Lock, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { PCR_STATUS } from '../data/constants.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { formatDate, formatCurrency, isOverdue } from '../lib/utils';
import { cn } from '../lib/utils';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { usersColRef } from '../auth/firestorePaths';

const emptyPcrForm = { projectId: '', amount: '', dueDate: '', reason: '' };

function PcrForm({ initial, projects, onSubmit, onClose, title }) {
  const [form, setForm] = useState(initial || emptyPcrForm);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = 'Project is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Valid amount required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, amount: Number(form.amount), date: new Date().toISOString().slice(0, 10) });
  };

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
      <Select label="Project" id="projectId" required value={form.projectId} onChange={set('projectId')} error={errors.projectId} disabled={!!initial}>
        <option value="">-- Select Project --</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Amount (THB) / จำนวนเงิน (บาท)" id="amount" type="number" required min="1" step="0.01" value={form.amount} onChange={set('amount')} error={errors.amount} placeholder="0.00" />
        <Input label="Due Date / วันครบกำหนด" id="dueDate" type="date" required value={form.dueDate} onChange={set('dueDate')} error={errors.dueDate} />
      </div>
      <Textarea label="Reason / Justification / เหตุผลและความจำเป็น" id="reason" required rows={4} value={form.reason} onChange={set('reason')} error={errors.reason} placeholder="Describe the purpose of this petty cash request... / ระบุวัตถุประสงค์ของการขอเงินสดย่อย" />
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
        <Button type="submit">{title}</Button>
      </div>
    </form>
  );
}

function RejectModal({ open, onClose, onConfirm, title }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6 flex flex-col gap-4">
        <Textarea label="Rejection Reason / เหตุผลการปฏิเสธ" required rows={4} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} placeholder="Provide a clear reason for rejection... / ระบุเหตุผลการปฏิเสธ" error={error} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
          <Button variant="danger" onClick={() => { if (!note.trim()) { setError('Reason is required'); return; } onConfirm(note); setNote(''); }}>
            <XCircle size={15} /> Confirm Reject / ยืนยันการปฏิเสธ
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ClosureModalContent({ onClose, onConfirm, pcr, amountToReturn }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">Closure Summary / สรุปการปิด PCR</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">PCR Amount / จำนวน PCR</span><span className="font-medium">{formatCurrency(pcr?.amount || 0)}</span></div>
          <div className="flex justify-between border-t border-blue-100 pt-1 mt-1"><span className="font-semibold text-blue-800">Amount to Return / ยอดคืนเงิน</span><span className="font-bold text-blue-800">{formatCurrency(amountToReturn)}</span></div>
        </div>
      </div>
      <Textarea label="Closure Note / หมายเหตุการปิด" rows={3} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} placeholder="Notes for closing this PCR... / หมายเหตุสำหรับการปิด PCR" error={error} />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
        <Button variant="warning" onClick={() => { if (!note.trim()) { setError('Note is required'); return; } onConfirm(note); setNote(''); }}>
          <Lock size={15} /> Request Closure / ขอปิด PCR
        </Button>
      </div>
    </div>
  );
}

function ConfirmReceiptModalContent({ onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="p-6 flex flex-col gap-4">
      <Textarea label="Receipt Confirmation Note / หมายเหตุยืนยันการรับเงิน" required rows={3} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} placeholder="e.g., Cash received and counted. / ได้รับเงินสดและนับถูกต้องแล้ว" error={error} />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
        <Button variant="success" onClick={() => { if (!note.trim()) { setError('Note is required'); return; } onConfirm(note); setNote(''); }}>
          <CheckCircle size={15} /> Confirm Receipt / ยืนยันการรับเงิน
        </Button>
      </div>
    </div>
  );
}

function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const q = query(usersColRef(), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => d.data()));
    }, () => setUsers([]));
    return () => unsub();
  }, []);
  return users;
}

function getUserName(users, id) {
  const u = users.find((u) => u.uid === id);
  return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : '-';
}

function PcrRow({ pcr, project, onAction }) {
  const { currentUser, hasRole } = useAuth();
  const { getPcrRemainingBalance, getPcrApprovedSpend } = useData();
  const [expanded, setExpanded] = useState(false);
  const users = useUsers();

  const remaining = getPcrRemainingBalance(pcr.id);
  const approvedSpend = getPcrApprovedSpend(pcr.id);
  const utilizationPct = pcr.amount > 0 ? Math.round((approvedSpend / pcr.amount) * 100) : 0;
  const overdue = isOverdue(pcr.dueDate) && pcr.status === PCR_STATUS.ACKNOWLEDGED;

  return (
    <div className={cn('border rounded-lg overflow-hidden transition-all', overdue ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white')}>
      {/* Row header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
            <span className="text-[13px] font-mono font-semibold text-blue-700">{pcr.id}</span>
            <Badge status={pcr.status} />
            {overdue && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertTriangle size={10} /> OVERDUE
              </span>
            )}
            <p className="text-[11px] text-slate-500 truncate whitespace-nowrap leading-tight min-w-0">
              {project?.name} • Created {formatDate(pcr.date)} • Due {formatDate(pcr.dueDate)}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-right shrink-0">
          <div>
            <p className="text-[10px] text-slate-400">Amount / จำนวน</p>
            <p className="text-[13px] font-semibold text-slate-800">{formatCurrency(pcr.amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Claimed / เบิกจ่าย</p>
            <p className="text-[13px] font-semibold text-slate-800">{formatCurrency(approvedSpend)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Remaining / คงเหลือ</p>
            <p className={cn('text-[13px] font-semibold', remaining < 0 ? 'text-rose-600' : 'text-emerald-600')}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason / เหตุผล</p>
                <p className="text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">{pcr.reason}</p>
              </div>
              {pcr.rejectNote && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-rose-700 mb-0.5">Rejection Note / หมายเหตุการปฏิเสธ:</p>
                  <p className="text-sm text-rose-700">{pcr.rejectNote}</p>
                </div>
              )}
              {pcr.closureNote && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-purple-700 mb-0.5">Closure Note / หมายเหตุการปิด:</p>
                  <p className="text-sm text-purple-700">{pcr.closureNote}</p>
                </div>
              )}
              {pcr.closureConfirmNote && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-indigo-700 mb-0.5">AP Confirmation Note / หมายเหตุยืนยัน AP:</p>
                  <p className="text-sm text-indigo-700">{pcr.closureConfirmNote}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fund Utilization / การใช้งบประมาณ</p>
                <div className="bg-white rounded-lg px-3 py-3 border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Approved Spend / ยอดเบิกจ่ายอนุมัติ</span>
                    <span>{utilizationPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all', utilizationPct >= 90 ? 'bg-rose-500' : utilizationPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-slate-500">PCR: <span className="font-semibold text-slate-700">{formatCurrency(pcr.amount)}</span></span>
                    <span className={cn('font-semibold', remaining < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                      Balance / คงเหลือ: {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                {pcr.approvedBy && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">Approved by / อนุมัติโดย: </span>{getUserName(users, pcr.approvedBy)} ({formatDate(pcr.approvedAt)})</div>}
                {pcr.acknowledgedBy && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">Acknowledged / รับทราบโดย: </span>{getUserName(users, pcr.acknowledgedBy)} ({formatDate(pcr.acknowledgedAt)})</div>}
                {pcr.closureConfirmedBy && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">Closure confirmed / ยืนยันการปิดโดย: </span>{getUserName(users, pcr.closureConfirmedBy)}</div>}
                {pcr.closedBy && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">Closed by / ปิดโดย: </span>{getUserName(users, pcr.closedBy)} ({formatDate(pcr.closedAt)})</div>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
            {onAction(pcr)}
          </div>
        </div>
      )}
    </div>
  );
}

const BROAD_VIEW_ROLES = ['MasterAdmin', 'MD', 'GM', 'AccountPay', 'ppeAdmin', 'ppeManager', 'ppeLeader', 'Requestors', 'Eng', 'SenEng', 'Arch', 'SenArch'];

export function PcrPage() {
  const { currentUser, hasRole, userProfile } = useAuth();
  const {
    projects, pcrs, createPcr, approvePcr, rejectPcr, resubmitPcr,
    acknowledgePcr, requestClosePcr, confirmClosurePcr, officiallyClosePcr,
    getPcrApprovedSpend, deletePcr
  } = useData();
  const [searchParams] = useSearchParams();
  const filterProject = searchParams.get('project');

  const [showCreate, setShowCreate] = useState(false);
  const [editPcr, setEditPcr] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [closureTarget, setClosureTarget] = useState(null);
  const [confirmReceiptTarget, setConfirmReceiptTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [projectFilter, setProjectFilter] = useState(filterProject || '');
  const [statusFilter, setStatusFilter] = useState('');

  const isBroadView = userProfile?.roles?.some((r) => BROAD_VIEW_ROLES.includes(r)) ?? true;

  const canCreate = hasRole('PM') || userProfile?.roles?.includes('MasterAdmin');

  const userProjects = isBroadView
    ? projects
    : (userProfile?.assignedProjects?.length > 0)
    ? projects.filter((p) => userProfile.assignedProjects.includes(p.id))
    : hasRole('CM')
    ? projects.filter((p) => p.cmId === currentUser?.id)
    : hasRole('PM')
    ? projects.filter((p) => p.pmId === currentUser?.id)
    : projects;

  const visiblePcrs = useMemo(() => {
    let list = pcrs;
    if (!isBroadView) {
      const myProjectIds = (userProfile?.assignedProjects?.length > 0)
        ? userProfile.assignedProjects
        : projects.filter((p) => 
            (hasRole('PM') && p.pmId === currentUser?.id) || 
            (hasRole('CM') && p.cmId === currentUser?.id)
          ).map(p => p.id);
          
      if (hasRole('PM') || hasRole('CM') || userProfile?.assignedProjects?.length > 0) {
        list = list.filter((p) => myProjectIds.includes(p.projectId));
      }
    }
    if (projectFilter) list = list.filter((p) => p.projectId === projectFilter);
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [pcrs, currentUser, projects, projectFilter, statusFilter, isBroadView, userProfile, hasRole]);

  const getProject = (id) => projects.find((p) => p.id === id);

  const handleCreate = (form) => {
    createPcr(form, currentUser.id);
    setShowCreate(false);
  };

  const handleResubmit = (form) => {
    resubmitPcr(editPcr.id, { amount: Number(form.amount), dueDate: form.dueDate, reason: form.reason });
    setEditPcr(null);
  };

  const renderActions = (pcr) => {
    const actions = [];
    const approvedSpend = getPcrApprovedSpend(pcr.id);
    const amountToReturn = pcr.amount - approvedSpend;

    if (hasRole('GM', 'MD') && pcr.status === PCR_STATUS.PENDING_GM) {
      actions.push(
        <Button key="approve" variant="success" size="sm" onClick={() => approvePcr(pcr.id, currentUser.id)}>
          <CheckCircle size={14} /> Approve PCR / อนุมัติ PCR
        </Button>,
        <Button key="reject" variant="danger" size="sm" onClick={() => setRejectTarget(pcr)}>
          <XCircle size={14} /> Reject / ปฏิเสธ
        </Button>
      );
    }

    if (hasRole('AccountPay') && pcr.status === PCR_STATUS.APPROVED) {
      actions.push(
        <Button key="ack" variant="primary" size="sm" onClick={() => acknowledgePcr(pcr.id, currentUser.id)}>
          <DollarSign size={14} /> Acknowledge (Fund Transferred) / รับทราบ (โอนเงินแล้ว)
        </Button>
      );
    }

    if (hasRole('PM') && pcr.status === PCR_STATUS.GM_REJECTED) {
      actions.push(
        <Button key="edit" variant="warning" size="sm" onClick={() => setEditPcr(pcr)}>
          <RefreshCw size={14} /> Edit & Resubmit / แก้ไขและส่งใหม่
        </Button>
      );
    }

    if (hasRole('PM') && pcr.status === PCR_STATUS.ACKNOWLEDGED) {
      actions.push(
        <Button key="close" variant="secondary" size="sm" onClick={() => setClosureTarget({ pcr, amountToReturn })}>
          <Lock size={14} /> Request Closure / ขอปิด PCR
        </Button>
      );
    }

    if (hasRole('AccountPay') && pcr.status === PCR_STATUS.CLOSURE_REQUESTED) {
      actions.push(
        <Button key="confirmreceipt" variant="success" size="sm" onClick={() => setConfirmReceiptTarget(pcr)}>
          <CheckCircle size={14} /> Confirm Receipt of Funds / ยืนยันรับเงินคืน
        </Button>
      );
    }

    if (hasRole('GM', 'MD') && pcr.status === PCR_STATUS.CLOSURE_CONFIRMED) {
      actions.push(
        <Button key="officialclose" variant="primary" size="sm" onClick={() => officiallyClosePcr(pcr.id, currentUser.id)}>
          <Lock size={14} /> Officially Close PCR / ปิด PCR อย่างเป็นทางการ
        </Button>
      );
    }

    if (userProfile?.roles?.includes('MasterAdmin')) {
      actions.push(
        <Button key="delete" variant="danger" size="sm" onClick={() => setDeleteTarget(pcr)}>
          <Trash2 size={14} /> Delete / ลบ
        </Button>
      );
    }

    return actions;
  };

  const allStatuses = [...new Set(pcrs.map((p) => p.status))];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-800 truncate whitespace-nowrap">
            PCR Management <span className="text-sm font-medium text-slate-500">/ จัดการ PCR • Petty Cash Requests / คำขอเงินสดย่อย – {visiblePcrs.length} รายการ</span>
          </h2>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} className="h-9 px-3 shrink-0">
            <Plus size={15} /> New PCR / สร้าง PCR ใหม่
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-nowrap overflow-x-auto pb-0.5">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-1.5 h-9 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[260px]"
        >
          <option value="">All Projects / ทุกโครงการ</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 h-9 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[190px]"
        >
          <option value="">All Statuses / ทุกสถานะ</option>
          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* PCR list */}
      {visiblePcrs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <FileText size={40} />
            <p className="font-medium">No PCRs found / ไม่พบรายการ PCR</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visiblePcrs.map((pcr) => (
            <PcrRow
              key={pcr.id}
              pcr={pcr}
              project={getProject(pcr.projectId)}
              onAction={renderActions}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Petty Cash Request (PCR) / คำขอเงินสดย่อยใหม่" size="md">
        <PcrForm projects={userProjects} onSubmit={handleCreate} onClose={() => setShowCreate(false)} title="Submit PCR / ส่งคำขอ" />
      </Modal>

      <Modal open={!!editPcr} onClose={() => setEditPcr(null)} title={`Edit & Resubmit – ${editPcr?.id}`} size="md">
        {editPcr && (
          <PcrForm
            initial={editPcr}
            projects={userProjects}
            onSubmit={handleResubmit}
            onClose={() => setEditPcr(null)}
            title="Resubmit PCR / ส่งคำขอใหม่"
          />
        )}
      </Modal>

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject PCR – ${rejectTarget?.id}`}
        onConfirm={(note) => { rejectPcr(rejectTarget.id, currentUser.id, note); setRejectTarget(null); }}
      />

      <Modal open={!!closureTarget} onClose={() => setClosureTarget(null)} title="Request PCR Closure / ขอปิด PCR" size="sm">
        {closureTarget && (
          <ClosureModalContent
            onClose={() => setClosureTarget(null)}
            onConfirm={(note) => { requestClosePcr(closureTarget.pcr.id, currentUser.id, note); setClosureTarget(null); }}
            pcr={closureTarget.pcr}
            amountToReturn={closureTarget.amountToReturn}
          />
        )}
      </Modal>

      <Modal open={!!confirmReceiptTarget} onClose={() => setConfirmReceiptTarget(null)} title="Confirm Receipt of Returned Funds / ยืนยันรับเงินคืน" size="sm">
        {confirmReceiptTarget && (
          <ConfirmReceiptModalContent
            onClose={() => setConfirmReceiptTarget(null)}
            onConfirm={(note) => { confirmClosurePcr(confirmReceiptTarget.id, currentUser.id, note); setConfirmReceiptTarget(null); }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete / ยืนยันการลบ" size="sm">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <p className="text-slate-800 font-semibold mb-1">Are you sure you want to delete this PCR?</p>
              <p className="text-sm text-slate-500">
                PCR: <span className="font-mono font-bold text-slate-700">{deleteTarget?.id}</span>
                <br />
                This action cannot be undone. / การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel / ยกเลิก</Button>
            <Button variant="danger" onClick={() => {
              if (deleteTarget) {
                deletePcr(deleteTarget.id);
                setDeleteTarget(null);
              }
            }}>
              Confirm Delete / ยืนยันการลบ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
