import { useState, useMemo } from 'react';
import {
  Plus, CheckCircle, XCircle, Receipt, Trash2,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ROLES, USERS, PCC_STATUS, PCR_STATUS } from '../data/mockData';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { PccStepper } from '../components/PccStepper';
import { formatDate, formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

// ─── Line Item Editor ─────────────────────────────────────────────────────────

function LineItemEditor({ items, onChange }) {
  const addItem = () => onChange([...items, { description: '', amount: '', reason: '' }]);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const setField = (idx, field, val) =>
    onChange(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Line Items</p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={13} /> Add Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          No items yet. Click "Add Item" to begin.
        </div>
      )}

      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="col-span-5">
            <input
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Description"
              value={item.description}
              onChange={(e) => setField(idx, 'description', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => setField(idx, 'amount', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <input
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Reason"
              value={item.reason}
              onChange={(e) => setField(idx, 'reason', e.target.value)}
            />
          </div>
          <div className="col-span-1 flex justify-center pt-1.5">
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm font-semibold text-blue-800">
            Total: {formatCurrency(total)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create PCC Form ──────────────────────────────────────────────────────────

function CreatePccForm({ onSubmit, onClose }) {
  const { currentUser } = useAuth();
  const { projects, pcrs, getPcrRemainingBalance } = useData();

  const [projectId, setProjectId] = useState('');
  const [pcrId, setPcrId] = useState('');
  const [items, setItems] = useState([{ description: '', amount: '', reason: '' }]);
  const [errors, setErrors] = useState({});

  const activePcrs = useMemo(
    () => pcrs.filter((p) => p.projectId === projectId && p.status === PCR_STATUS.ACKNOWLEDGED),
    [pcrs, projectId]
  );

  const selectedPcr = pcrs.find((p) => p.id === pcrId);
  const remaining = pcrId ? getPcrRemainingBalance(pcrId) : null;
  const newTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const wouldExceed = remaining !== null && newTotal > remaining;

  const validate = () => {
    const e = {};
    if (!projectId) e.projectId = 'Select a project';
    if (!pcrId) e.pcrId = 'Select an active PCR';
    if (items.length === 0) e.items = 'Add at least one item';
    if (items.some((i) => !i.description.trim() || !i.amount || Number(i.amount) <= 0)) {
      e.items = 'All items must have a description and valid amount';
    }
    if (wouldExceed) e.budget = `This claim (${formatCurrency(newTotal)}) exceeds the PCR remaining balance (${formatCurrency(remaining)}).`;
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(
      {
        pcrId,
        projectId,
        requester: currentUser.id,
        date: new Date().toISOString().slice(0, 10),
      },
      items
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Project"
          required
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setPcrId(''); }}
          error={errors.projectId}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </Select>

        <Select
          label="Active PCR (Wallet)"
          required
          value={pcrId}
          onChange={(e) => setPcrId(e.target.value)}
          error={errors.pcrId}
          disabled={!projectId}
        >
          <option value="">-- Select PCR --</option>
          {activePcrs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} – {formatCurrency(p.amount)}
            </option>
          ))}
        </Select>
      </div>

      {/* PCR Balance indicator */}
      {selectedPcr && (
        <div className={cn(
          'rounded-xl p-3 border text-sm',
          wouldExceed
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        )}>
          <div className="flex items-center gap-2 font-semibold mb-1">
            {wouldExceed ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            PCR Balance Check
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="opacity-70">PCR Total:</span><br /><span className="font-bold">{formatCurrency(selectedPcr.amount)}</span></div>
            <div><span className="opacity-70">Available:</span><br /><span className="font-bold">{formatCurrency(remaining)}</span></div>
            <div><span className="opacity-70">This Claim:</span><br /><span className="font-bold">{formatCurrency(newTotal)}</span></div>
          </div>
          {wouldExceed && (
            <p className="mt-2 font-semibold text-rose-700 text-xs">
              ⚠ Submission blocked: claim exceeds available PCR balance.
            </p>
          )}
        </div>
      )}

      {errors.budget && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {errors.budget}
        </div>
      )}

      <div>
        <LineItemEditor items={items} onChange={setItems} />
        {errors.items && <p className="text-xs text-rose-600 mt-1">{errors.items}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={wouldExceed}>
          <Receipt size={15} /> Submit PCC
        </Button>
      </div>
    </form>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ open, onClose, onConfirm, title }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6 flex flex-col gap-4">
        <Textarea
          label="Rejection Reason"
          required
          rows={4}
          value={note}
          onChange={(e) => { setNote(e.target.value); setError(''); }}
          placeholder="Provide a clear reason for rejection..."
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            if (!note.trim()) { setError('Reason is required'); return; }
            onConfirm(note);
            setNote('');
          }}>
            <XCircle size={15} /> Confirm Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── PCC Row ──────────────────────────────────────────────────────────────────

function PccRow({ pcc, onAction }) {
  const { getItemsByPcc, getPcrById, getProjectById } = useData();
  const [expanded, setExpanded] = useState(false);
  const items = getItemsByPcc(pcc.id);
  const pcr = getPcrById(pcc.pcrId);
  const project = getProjectById(pcc.projectId);
  const getUserName = (id) => USERS.find((u) => u.id === id)?.name || '-';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-semibold text-blue-700">{pcc.id}</span>
            <Badge status={pcc.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {project?.name} • PCR: {pcc.pcrId} • {formatDate(pcc.date)} • By: {getUserName(pcc.createdBy)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-800">{formatCurrency(pcc.totalAmount)}</p>
          <p className="text-xs text-slate-400">{items.length} item(s)</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Stepper */}
          <div className="px-5 py-4 border-b border-slate-100 bg-white">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Approval Workflow</p>
            <PccStepper status={pcc.status} />
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Rejection note */}
            {pcc.rejectNote && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-rose-700 mb-0.5">Rejection Note:</p>
                <p className="text-sm text-rose-700">{pcc.rejectNote}</p>
              </div>
            )}

            {/* Line items table */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Line Items</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2.5 text-slate-700">{item.description}</td>
                        <td className="px-4 py-2.5 text-slate-500">{item.reason}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50">
                      <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-blue-800">Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-800">{formatCurrency(pcc.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Audit trail */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              {pcc.verifiedByPM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">PM verified: </span>{getUserName(pcc.verifiedByPM)} ({formatDate(pcc.verifiedByPMAt)})</div>}
              {pcc.verifiedByAP && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">AP verified: </span>{getUserName(pcc.verifiedByAP)} ({formatDate(pcc.verifiedByAPAt)})</div>}
              {pcc.approvedByGM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">GM approved: </span>{getUserName(pcc.approvedByGM)} ({formatDate(pcc.approvedByGMAt)})</div>}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              {onAction(pcc)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PccPage() {
  const { currentUser, hasRole } = useAuth();
  const {
    projects, pccs, pcrs,
    pmVerifyPcc, apVerifyPcc, apRejectPcc, gmApprovePcc, gmRejectPcc,
    createPcc
  } = useData();

  const [showCreate, setShowCreate] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectMode, setRejectMode] = useState('ap');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canCreate = hasRole(ROLES.SiteAdmin);

  const visiblePccs = useMemo(() => {
    let list = pccs;
    // Role-based filtering
    if (hasRole(ROLES.PM)) {
      const myProjectIds = projects.filter((p) => p.pmId === currentUser.id).map((p) => p.id);
      list = list.filter((p) => myProjectIds.includes(p.projectId));
    }
    if (hasRole(ROLES.CM)) {
      const myProjectIds = projects.filter((p) => p.cmId === currentUser.id).map((p) => p.id);
      list = list.filter((p) => myProjectIds.includes(p.projectId));
    }
    if (hasRole(ROLES.SiteAdmin)) {
      list = list.filter((p) => p.createdBy === currentUser.id);
    }
    if (projectFilter) list = list.filter((p) => p.projectId === projectFilter);
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list.slice().sort((a, b) => b.date.localeCompare(a.date));
  }, [pccs, currentUser, projects, projectFilter, statusFilter, hasRole]);

  const allStatuses = [...new Set(pccs.map((p) => p.status))];

  const handleCreate = (data, items) => {
    createPcc(data, items, currentUser.id);
    setShowCreate(false);
  };

  const renderActions = (pcc) => {
    const actions = [];

    if (hasRole(ROLES.PM) && pcc.status === PCC_STATUS.PENDING_PM) {
      actions.push(
        <Button key="verify" variant="success" size="sm" onClick={() => pmVerifyPcc(pcc.id, currentUser.id)}>
          <CheckCircle size={14} /> Verify & Pass to AP
        </Button>
      );
    }

    if (hasRole(ROLES.AccountPay) && pcc.status === PCC_STATUS.PENDING_AP) {
      actions.push(
        <Button key="apverify" variant="success" size="sm" onClick={() => apVerifyPcc(pcc.id, currentUser.id)}>
          <CheckCircle size={14} /> Verify & Pass to GM
        </Button>,
        <Button key="apreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('ap'); }}>
          <XCircle size={14} /> Reject Back to SiteAdmin
        </Button>
      );
    }

    if (hasRole(ROLES.GM, ROLES.MD) && pcc.status === PCC_STATUS.PENDING_GM) {
      actions.push(
        <Button key="gmapprove" variant="success" size="sm" onClick={() => gmApprovePcc(pcc.id, currentUser.id)}>
          <CheckCircle size={14} /> Approve Payment
        </Button>,
        <Button key="gmreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('gm'); }}>
          <XCircle size={14} /> Reject
        </Button>
      );
    }

    if (hasRole(ROLES.SiteAdmin) && (pcc.status === PCC_STATUS.AP_REJECTED || pcc.status === PCC_STATUS.GM_REJECTED)) {
      actions.push(
        <span key="info" className="text-xs text-slate-500 italic flex items-center gap-1">
          <RefreshCw size={12} /> This PCC was rejected. Please create a new corrected PCC.
        </span>
      );
    }

    return actions;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">PCC Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Petty Cash Claims – {visiblePccs.length} record(s)</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New PCC
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Statuses</option>
          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* PCC List */}
      {visiblePccs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Receipt size={40} />
            <p className="font-medium">No PCCs found</p>
            {canCreate && <p className="text-sm">Click "New PCC" to submit a petty cash claim.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visiblePccs.map((pcc) => (
            <PccRow key={pcc.id} pcc={pcc} onAction={renderActions} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Petty Cash Claim (PCC)" size="lg">
        <CreatePccForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Reject Modal */}
      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject PCC – ${rejectTarget?.id}`}
        onConfirm={(note) => {
          if (rejectMode === 'ap') apRejectPcc(rejectTarget.id, currentUser.id, note);
          else gmRejectPcc(rejectTarget.id, currentUser.id, note);
          setRejectTarget(null);
        }}
      />
    </div>
  );
}
