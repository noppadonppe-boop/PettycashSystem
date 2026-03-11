import { useState, useMemo, useRef } from 'react';
import {
  Plus, CheckCircle, XCircle, Receipt, Trash2,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw,
  Paperclip, Camera, X, ImageIcon, FileText as FileIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { ROLES, USERS, PCC_STATUS, PCR_STATUS } from '../data/mockData';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { PccStepper } from '../components/PccStepper';
import { formatDate, formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

// ─── Attachment helpers ───────────────────────────────────────────────────────

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, type: file.type, dataUrl: e.target.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AttachmentThumb({ att, onRemove }) {
  const isImage = att.type.startsWith('image/');
  return (
    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
      {isImage ? (
        <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 px-1">
          <FileIcon size={18} className="text-slate-400" />
          <span className="text-[8px] text-slate-500 text-center leading-tight break-all line-clamp-2">{att.name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X size={9} className="text-white" />
      </button>
    </div>
  );
}

// ─── Line Item Editor ─────────────────────────────────────────────────────────

function LineItemEditor({ items, onChange }) {
  const addItem = () => onChange([...items, { description: '', amount: '', reason: '', attachments: [] }]);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const setField = (idx, field, val) =>
    onChange(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const fileInputRefs = useRef([]);
  const cameraInputRefs = useRef([]);

  const handleFiles = async (idx, files) => {
    const newAtts = await Promise.all(Array.from(files).map(readFileAsDataURL));
    const existing = items[idx].attachments || [];
    setField(idx, 'attachments', [...existing, ...newAtts]);
  };

  const removeAttachment = (itemIdx, attIdx) => {
    const existing = items[itemIdx].attachments || [];
    setField(itemIdx, 'attachments', existing.filter((_, i) => i !== attIdx));
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Line Items / รายการค่าใช้จ่าย</p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={13} /> Add Item / เพิ่มรายการ
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          No items yet. Click "Add Item" to begin. / ยังไม่มีรายการ กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น
        </div>
      )}

      {items.map((item, idx) => {
        const atts = item.attachments || [];
        return (
          <div key={idx} className="flex flex-col gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
            {/* Fields row */}
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-5">
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Description / รายละเอียด"
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
                  placeholder="Amount / จำนวนเงิน (บาท)"
                  value={item.amount}
                  onChange={(e) => setField(idx, 'amount', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Reason / เหตุผล"
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

            {/* Attachments row */}
            <div className="flex items-center gap-2 flex-wrap pl-1">
              {/* Thumbnails */}
              {atts.map((att, attIdx) => (
                <AttachmentThumb
                  key={attIdx}
                  att={att}
                  onRemove={() => removeAttachment(idx, attIdx)}
                />
              ))}

              {/* Upload file button */}
              <button
                type="button"
                title="Attach file / แนบไฟล์"
                onClick={() => fileInputRefs.current[idx]?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-blue-500 transition-all cursor-pointer shrink-0"
              >
                <Paperclip size={16} />
                <span className="text-[9px] font-medium leading-tight text-center">File<br/>ไฟล์</span>
              </button>
              <input
                ref={(el) => (fileInputRefs.current[idx] = el)}
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => { handleFiles(idx, e.target.files); e.target.value = ''; }}
              />

              {/* Camera capture button */}
              <button
                type="button"
                title="Take photo / ถ่ายภาพ"
                onClick={() => cameraInputRefs.current[idx]?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-emerald-500 transition-all cursor-pointer shrink-0"
              >
                <Camera size={16} />
                <span className="text-[9px] font-medium leading-tight text-center">Photo<br/>ถ่ายรูป</span>
              </button>
              <input
                ref={(el) => (cameraInputRefs.current[idx] = el)}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { handleFiles(idx, e.target.files); e.target.value = ''; }}
              />

              {atts.length > 0 && (
                <span className="text-[10px] text-slate-400 ml-1">
                  {atts.length} file{atts.length > 1 ? 's' : ''} attached / แนบแล้ว {atts.length} ไฟล์
                </span>
              )}
            </div>
          </div>
        );
      })}

      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm font-semibold text-blue-800">
            Total / รวม: {formatCurrency(total)}
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
  const [items, setItems] = useState([{ description: '', amount: '', reason: '', attachments: [] }]);
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
          label="Project / โครงการ"
          required
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setPcrId(''); }}
          error={errors.projectId}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </Select>

        <Select
          label="Active PCR (Wallet) / PCR ที่ใช้งาน"
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
            PCR Balance Check / ตรวจสอบยอดคงเหลือ PCR
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="opacity-70">PCR Total / รวม PCR:</span><br /><span className="font-bold">{formatCurrency(selectedPcr.amount)}</span></div>
            <div><span className="opacity-70">Available / คงเหลือ:</span><br /><span className="font-bold">{formatCurrency(remaining)}</span></div>
            <div><span className="opacity-70">This Claim / คำขอนี้:</span><br /><span className="font-bold">{formatCurrency(newTotal)}</span></div>
          </div>
          {wouldExceed && (
            <p className="mt-2 font-semibold text-rose-700 text-xs">
              ⚠ Submission blocked: claim exceeds available PCR balance. / ไม่สามารถส่งได้: ยอดเกินคงเหลือ PCR
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
        <Button type="button" variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
        <Button type="submit" variant="primary" disabled={wouldExceed}>
          <Receipt size={15} /> Submit PCC / ส่งคำขอ PCC
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
          label="Rejection Reason / เหตุผลการปฏิเสธ"
          required
          rows={4}
          value={note}
          onChange={(e) => { setNote(e.target.value); setError(''); }}
          placeholder="Provide a clear reason for rejection... / ระบุเหตุผลการปฏิเสธ"
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
          <Button variant="danger" onClick={() => {
            if (!note.trim()) { setError('Reason is required'); return; }
            onConfirm(note);
            setNote('');
          }}>
            <XCircle size={15} /> Confirm Reject / ยืนยันการปฏิเสธ
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Approval Workflow / ขั้นตอนการอนุมัติ</p>
            <PccStepper status={pcc.status} />
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Rejection note */}
            {pcc.rejectNote && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-rose-700 mb-0.5">Rejection Note / หมายเหตุการปฏิเสธ:</p>
                <p className="text-sm text-rose-700">{pcc.rejectNote}</p>
              </div>
            )}

            {/* Line items table */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Line Items / รายการค่าใช้จ่าย</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description / รายละเอียด</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason / เหตุผล</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachments / เอกสาร</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount / จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const atts = item.attachments || [];
                      return (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2.5 text-slate-700">{item.description}</td>
                          <td className="px-4 py-2.5 text-slate-500">{item.reason}</td>
                          <td className="px-4 py-2.5">
                            {atts.length === 0 ? (
                              <span className="text-slate-300 text-xs">—</span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {atts.map((att, ai) => (
                                  att.type.startsWith('image/') ? (
                                    <a key={ai} href={att.dataUrl} target="_blank" rel="noreferrer" title={att.name}>
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-10 h-10 rounded-md object-cover border border-slate-200 hover:border-blue-400 transition-colors"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      key={ai}
                                      href={att.dataUrl}
                                      download={att.name}
                                      title={att.name}
                                      className="w-10 h-10 rounded-md border border-slate-200 hover:border-blue-400 bg-slate-50 flex flex-col items-center justify-center gap-0.5 transition-colors"
                                    >
                                      <FileIcon size={14} className="text-slate-400" />
                                      <span className="text-[7px] text-slate-400 leading-tight px-0.5 text-center truncate w-full">.{att.name.split('.').pop()}</span>
                                    </a>
                                  )
                                ))}
                                <span className="text-[10px] text-slate-400">{atts.length} file{atts.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-800">{formatCurrency(item.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50">
                      <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-blue-800">Total / รวม</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-800">{formatCurrency(pcc.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Audit trail */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              {pcc.verifiedByPM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">PM verified / PM ตรวจสอบ: </span>{getUserName(pcc.verifiedByPM)} ({formatDate(pcc.verifiedByPMAt)})</div>}
              {pcc.verifiedByAP && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">AP verified / AP ตรวจสอบ: </span>{getUserName(pcc.verifiedByAP)} ({formatDate(pcc.verifiedByAPAt)})</div>}
              {pcc.approvedByGM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">GM approved / GM อนุมัติ: </span>{getUserName(pcc.approvedByGM)} ({formatDate(pcc.approvedByGMAt)})</div>}
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

const BROAD_VIEW_ROLES = ['MasterAdmin', 'MD', 'GM', 'AccountPay', 'ppeAdmin', 'ppeManager', 'ppeLeader', 'Requestors', 'Eng', 'SenEng', 'Arch', 'SenArch'];

export function PccPage() {
  const { currentUser, hasRole, userProfile } = useAuth();
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

  const isBroadView = userProfile?.roles?.some((r) => BROAD_VIEW_ROLES.includes(r)) ?? true;

  const canCreate = hasRole(ROLES.SiteAdmin) || userProfile?.roles?.includes('MasterAdmin');

  const visiblePccs = useMemo(() => {
    let list = pccs;
    // Only restrict view for pure site-level roles (CM / PM / SiteAdmin)
    if (!isBroadView) {
      if (hasRole(ROLES.PM)) {
        const myProjectIds = projects.filter((p) => p.pmId === currentUser?.id).map((p) => p.id);
        list = list.filter((p) => myProjectIds.includes(p.projectId));
      }
      if (hasRole(ROLES.CM)) {
        const myProjectIds = projects.filter((p) => p.cmId === currentUser?.id).map((p) => p.id);
        list = list.filter((p) => myProjectIds.includes(p.projectId));
      }
      if (hasRole(ROLES.SiteAdmin)) {
        list = list.filter((p) => p.createdBy === currentUser?.id);
      }
    }
    if (projectFilter) list = list.filter((p) => p.projectId === projectFilter);
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [pccs, currentUser, projects, projectFilter, statusFilter, isBroadView]);

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
          <CheckCircle size={14} /> Verify & Pass to AP / ตรวจสอบและส่งต่อ AP
        </Button>
      );
    }

    if (hasRole(ROLES.AccountPay) && pcc.status === PCC_STATUS.PENDING_AP) {
      actions.push(
        <Button key="apverify" variant="success" size="sm" onClick={() => apVerifyPcc(pcc.id, currentUser.id)}>
          <CheckCircle size={14} /> Verify & Pass to GM / ตรวจสอบและส่งต่อ GM
        </Button>,
        <Button key="apreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('ap'); }}>
          <XCircle size={14} /> Reject Back to SiteAdmin / ส่งคืน SiteAdmin
        </Button>
      );
    }

    if (hasRole(ROLES.GM, ROLES.MD) && pcc.status === PCC_STATUS.PENDING_GM) {
      actions.push(
        <Button key="gmapprove" variant="success" size="sm" onClick={() => gmApprovePcc(pcc.id, currentUser.id)}>
          <CheckCircle size={14} /> Approve Payment / อนุมัติการจ่ายเงิน
        </Button>,
        <Button key="gmreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('gm'); }}>
          <XCircle size={14} /> Reject / ปฏิเสธ
        </Button>
      );
    }

    if (hasRole(ROLES.SiteAdmin) && (pcc.status === PCC_STATUS.AP_REJECTED || pcc.status === PCC_STATUS.GM_REJECTED)) {
      actions.push(
        <span key="info" className="text-xs text-slate-500 italic flex items-center gap-1">
          <RefreshCw size={12} /> This PCC was rejected. Please create a new corrected PCC. / PCC นี้ถูกปฏิเสธ กรุณาสร้าง PCC ใหม่ที่แก้ไขแล้ว
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
          <h2 className="text-xl font-bold text-slate-800">PCC Management <span className="text-base font-medium text-slate-500">/ จัดการ PCC</span></h2>
          <p className="text-sm text-slate-500 mt-0.5">Petty Cash Claims / ใบเบิกเงินสดย่อย – {visiblePccs.length} รายการ</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New PCC / สร้าง PCC ใหม่
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
          <option value="">All Projects / ทุกโครงการ</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Statuses / ทุกสถานะ</option>
          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* PCC List */}
      {visiblePccs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Receipt size={40} />
            <p className="font-medium">No PCCs found / ไม่พบรายการ PCC</p>
            {canCreate && <p className="text-sm">Click "New PCC" to submit a petty cash claim. / กดปุ่ม "สร้าง PCC ใหม่" เพื่อยื่นคำขอ</p>}
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
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Petty Cash Claim (PCC) / ใบเบิกเงินสดย่อยใหม่" size="lg">
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
