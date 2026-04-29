import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, CheckCircle, XCircle, Receipt, Trash2,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw,
  Paperclip, Camera, X, FileText as FileIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { PCC_STATUS, PCR_STATUS } from '../data/constants.js';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { PccStepper } from '../components/PccStepper';
import { formatDate, formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { usersColRef } from '../auth/firestorePaths';
import { storage } from '../firebase/firebase';

// ─── Attachment helpers ───────────────────────────────────────────────────────

async function uploadFileToStorage(file) {
  const fileExt = file.name.split('.').pop() || 'file';
  const fileName = `pcc-attachments/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, fileName);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  return { name: file.name, type: file.type, dataUrl: downloadUrl };
}

function AttachmentThumb({ att, onRemove }) {
  const isImage = att?.type?.startsWith('image/');
  return (
    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
      {isImage ? (
        <img src={att.dataUrl} alt={att.name || 'image'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 px-1">
          <FileIcon size={18} className="text-slate-400 shrink-0" />
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
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const handleFiles = async (idx, files) => {
    try {
      setUploadingIdx(idx);
      const results = await Promise.allSettled(Array.from(files).map(uploadFileToStorage));
      
      const newAtts = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
        
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Upload failed for file ${files[i].name}:`, r.reason);
          alert(`Failed to upload ${files[i].name}. Please try again.`);
        }
      });
      
      if (newAtts.length > 0) {
        const existing = items[idx].attachments || [];
        setField(idx, 'attachments', [...existing, ...newAtts]);
      }
    } catch (err) {
      console.error('File reading/uploading error:', err);
    } finally {
      setUploadingIdx(null);
    }
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
                disabled={uploadingIdx === idx}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-blue-500 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingIdx === idx ? <RefreshCw size={16} className="animate-spin" /> : <Paperclip size={16} />}
                <span className="text-[9px] font-medium leading-tight text-center">
                  {uploadingIdx === idx ? 'Wait...' : <>File<br/>ไฟล์</>}
                </span>
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
                disabled={uploadingIdx === idx}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-emerald-500 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingIdx === idx ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
                <span className="text-[9px] font-medium leading-tight text-center">
                  {uploadingIdx === idx ? 'Wait...' : <>Photo<br/>ถ่ายรูป</>}
                </span>
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

// Returns true when selected project id is within PRJ-2026-J-001..009
function isSpecialProject(projectId) {
  return /^PRJ-2026-J-00[1-9]$/i.test(projectId || '');
}

function CreatePccForm({ onSubmit, onClose, initialData = null, initialItems = [], isEdit = false }) {
  const { currentUser } = useAuth();
  const { projects, pcrs, getPcrRemainingBalance } = useData();

  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [pcrId, setPcrId] = useState(initialData?.pcrId || '');
  const [relatedProjectId, setRelatedProjectId] = useState(initialData?.relatedProjectId || '');
  const [items, setItems] = useState(initialItems.length > 0 ? initialItems : [{ description: '', amount: '', reason: '', attachments: [] }]);
  const [errors, setErrors] = useState({});

  // True when selected project is in the PRJ-????-J-001..009 range
  const needsRelatedProject = isSpecialProject(projectId);

  // Show all existing projects in dropdown (no truncation)
  const relatedProjectOptions = useMemo(() => projects, [projects]);

  const activePcrs = useMemo(
    () => {
      const list = pcrs.filter((p) => p.projectId === projectId && p.status === PCR_STATUS.ACKNOWLEDGED);
      if (isEdit && initialData?.pcrId && !list.find(p => p.id === initialData.pcrId)) {
        const orig = pcrs.find(p => p.id === initialData.pcrId);
        if (orig) list.push(orig);
      }
      return list;
    },
    [pcrs, projectId, isEdit, initialData]
  );

  const selectedPcr = pcrs.find((p) => p.id === pcrId);
  const remainingCalculated = pcrId ? getPcrRemainingBalance(pcrId) : null;
  const remaining = isEdit && pcrId === initialData?.pcrId 
    ? (remainingCalculated !== null ? remainingCalculated + (initialData?.totalAmount || 0) : null)
    : remainingCalculated;
  const newTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const wouldExceed = remaining !== null && newTotal > remaining;

  const validate = () => {
    const e = {};
    if (!projectId) e.projectId = 'Select a project';
    if (!pcrId) e.pcrId = 'Select an active PCR';
    if (needsRelatedProject && !relatedProjectId) e.relatedProjectId = 'กรุณาเลือกโครงการที่ใช้งาน';
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
        relatedProjectId: needsRelatedProject ? relatedProjectId : '',
        requester: initialData?.requester || currentUser.id,
        date: initialData?.date || new Date().toISOString().slice(0, 10),
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
          onChange={(e) => { setProjectId(e.target.value); setPcrId(''); setRelatedProjectId(''); }}
          error={errors.projectId}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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

      {/* Conditional: ใช้กับโครงการ — shows only for PRJ-2026-J-001..009 */}
      {needsRelatedProject && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm font-semibold text-amber-800">ข้อมูลเพิ่มเติมสำหรับโครงการนี้</p>
          </div>
          <Select
            label="ใช้กับโครงการ / Applied to Project"
            required
            value={relatedProjectId}
            onChange={(e) => setRelatedProjectId(e.target.value)}
            error={errors.relatedProjectId}
          >
            <option value="">-- เลือกโครงการ --</option>
            {relatedProjectOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
      )}

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
          <Receipt size={15} /> {isEdit ? 'Save Changes / บันทึกการแก้ไข' : 'Submit PCC / ส่งคำขอ PCC'}
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

// Hook to load users from Firebase
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

function isValidHttpUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function PccRow({ pcc, onAction, canEditPoLinks = false, getPoLinkValue, onPoLinkChange }) {
  const { projects, getItemsByPcc, getPcrById, getProjectById } = useData();
  const [expanded, setExpanded] = useState(false);
  const users = useUsers();
  const items = getItemsByPcc(pcc.id);
  const pcr = getPcrById(pcc.pcrId);
  const project = getProjectById(pcc.projectId);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
            <span className="text-[13px] font-mono font-semibold text-blue-700">{pcc.id}</span>
            <Badge status={pcc.status} />
            {pcc.editStatus === 'REQUESTED' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-200 rounded px-2 py-0.5 text-xs font-semibold">
                <RefreshCw size={12} /> Edit Requested
              </span>
            )}
            {pcc.status === PCC_STATUS.EDITING && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-0.5 text-xs font-semibold">
                <FileIcon size={12} /> Editing
              </span>
            )}
            <p className="text-[11px] text-slate-500 truncate whitespace-nowrap leading-tight min-w-0">
              {project?.name} • PCR: {pcc.pcrId} • {formatDate(pcc.date)} • By: {getUserName(users, pcc.createdBy)}
              {pcc.relatedProjectId && (
                <span className="ml-1 inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 text-[10px] font-semibold">
                  ใช้กับ: {pcc.relatedProjectId}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-bold text-slate-800 whitespace-nowrap">{formatCurrency(pcc.totalAmount)} <span className="text-[11px] font-normal text-slate-400">• {items.length} item(s)</span></p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Stepper */}
          <div className="px-3.5 py-2 border-b border-slate-100 bg-white">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Workflow / ขั้นตอนการอนุมัติ</p>
            <PccStepper status={pcc.status} />
          </div>

          <div className="px-3.5 py-2.5 flex flex-col gap-2.5">
            {/* Rejection note */}
            {pcc.rejectNote && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2">
                <p className="text-[11px] font-semibold text-rose-700 mb-0.5">Rejection Note / หมายเหตุการปฏิเสธ:</p>
                <p className="text-xs text-rose-700">{pcc.rejectNote}</p>
              </div>
            )}

            {/* Line items table */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Line Items / รายการค่าใช้จ่าย</p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description / รายละเอียด</th>
                      <th className="text-left px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reason / เหตุผล</th>
                      <th className="text-left px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attachments / เอกสาร</th>
                      <th className="text-left px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">PO Link</th>
                      <th className="text-right px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount / จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const atts = item.attachments || [];
                      return (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-1.5 text-slate-700 align-top leading-tight">{item.description}</td>
                          <td className="px-3 py-1.5 text-slate-500 align-top leading-tight">{item.reason}</td>
                          <td className="px-3 py-1.5 align-top">
                            {atts.length === 0 ? (
                              <span className="text-slate-300 text-xs">—</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                {atts.map((att, ai) => (
                                  <a
                                    key={ai}
                                    href={att.dataUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={att.name || `Attachment ${ai + 1}`}
                                    className="text-[11px] leading-tight text-blue-700 hover:text-blue-800 hover:underline truncate"
                                  >
                                    {att.name || `attachment-${ai + 1}`}
                                  </a>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            {canEditPoLinks ? (
                              <input
                                type="url"
                                value={getPoLinkValue ? getPoLinkValue(item) : (item.poLink || '')}
                                onChange={(e) => onPoLinkChange && onPoLinkChange(item, e.target.value)}
                                placeholder="https://..."
                                className="w-full min-w-[180px] max-w-[320px] px-2 py-1 text-[11px] leading-tight rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            ) : item.poLink ? (
                              <a
                                href={item.poLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[11px] leading-tight text-blue-700 hover:text-blue-800 hover:underline truncate"
                                title={item.poLink}
                              >
                                {item.poLink}
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium text-slate-800 align-top">{formatCurrency(item.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-3 py-1.5 text-[13px] font-semibold text-blue-800">Total / รวม</td>
                      <td className="px-3 py-1.5 text-right font-bold text-blue-800">{formatCurrency(pcc.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Related project info */}
            {pcc.relatedProjectId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
                <span className="inline-flex w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="text-amber-700 font-semibold">ใช้กับโครงการ / Applied to Project: </span>
                  <span className="font-mono text-amber-800 font-bold">{pcc.relatedProjectId}</span>
                  {(() => {
                    const rp = projects.find((p) => p.id === pcc.relatedProjectId);
                    return rp ? <span className="text-amber-700"> – {rp.name}</span> : null;
                  })()}
                </div>
              </div>
            )}

            {/* Audit trail */}
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
              {pcc.verifiedByPM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">PM verified / PM ตรวจสอบ: </span>{getUserName(users, pcc.verifiedByPM)} ({formatDate(pcc.verifiedByPMAt)})</div>}
              {pcc.verifiedByAP && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">AP verified / AP ตรวจสอบ: </span>{getUserName(users, pcc.verifiedByAP)} ({formatDate(pcc.verifiedByAPAt)})</div>}
              {pcc.approvedByGM && <div className="bg-white rounded px-2 py-1.5 border border-slate-100"><span className="text-slate-400">GM approved / GM อนุมัติ: </span>{getUserName(users, pcc.approvedByGM)} ({formatDate(pcc.approvedByGMAt)})</div>}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
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
    projects, pccs, pcrs, getItemsByPcc,
    pmVerifyPcc, apVerifyPcc, apRejectPcc, gmApprovePcc, gmRejectPcc,
    createPcc, deletePcc, requestEditPcc, approveEditPcc, saveEditPcc
  } = useData();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectMode, setRejectMode] = useState('ap');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poLinksByItem, setPoLinksByItem] = useState({});

  const isBroadView = userProfile?.roles?.some((r) => BROAD_VIEW_ROLES.includes(r)) ?? true;

  const canCreate = hasRole('SiteAdmin') || userProfile?.roles?.includes('MasterAdmin');

  const visiblePccs = useMemo(() => {
    let list = pccs;
    // Only restrict view for pure site-level roles (CM / PM / SiteAdmin)
    if (!isBroadView) {
      if (hasRole('PM')) {
        const myProjectIds = projects.filter((p) => p.pmId === currentUser?.id).map((p) => p.id);
        list = list.filter((p) => myProjectIds.includes(p.projectId));
      }
      if (hasRole('CM')) {
        const myProjectIds = projects.filter((p) => p.cmId === currentUser?.id).map((p) => p.id);
        list = list.filter((p) => myProjectIds.includes(p.projectId));
      }
      if (hasRole('SiteAdmin')) {
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
    
    const isEditing = pcc.status === PCC_STATUS.EDITING;
    const isEditRequested = pcc.editStatus === 'REQUESTED';
    const rowItems = getItemsByPcc(pcc.id);
    const poLinksByItemId = rowItems.reduce((acc, item) => {
      const key = `${pcc.id}::${item.id}`;
      acc[item.id] = (poLinksByItem[key] ?? item.poLink ?? '').trim();
      return acc;
    }, {});
    const canVerifyWithPoLink = rowItems.length > 0 && rowItems.every((item) => isValidHttpUrl(poLinksByItemId[item.id]));

    if (hasRole('PM') && pcc.status === PCC_STATUS.PENDING_PM && !isEditing) {
      actions.push(
        <Button key="verify" variant="success" size="sm" onClick={() => pmVerifyPcc(pcc.id, currentUser.id)} disabled={isEditRequested}>
          <CheckCircle size={14} /> Verify & Pass to AP / ตรวจสอบและส่งต่อ AP
        </Button>
      );
    }

    if (hasRole('AccountPay') && pcc.status === PCC_STATUS.PENDING_AP && !isEditing) {
      actions.push(
        <Button
          key="apverify"
          variant="success"
          size="sm"
          onClick={() => apVerifyPcc(pcc.id, currentUser.id, poLinksByItemId)}
          disabled={isEditRequested || !canVerifyWithPoLink}
          title={!canVerifyWithPoLink ? 'Please provide valid PO Link URL for all line items first.' : undefined}
        >
          <CheckCircle size={14} /> Verify & Pass to GM / ตรวจสอบและส่งต่อ GM
        </Button>,
        <Button key="apreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('ap'); }} disabled={isEditRequested}>
          <XCircle size={14} /> Reject Back to SiteAdmin / ส่งคืน SiteAdmin
        </Button>
      );
      if (!canVerifyWithPoLink) {
        actions.push(
          <span key="po-link-required" className="text-[11px] text-amber-700">
            PO Link is required for every line item before Verify to GM.
          </span>
        );
      }
    }

    if (hasRole('GM', 'MD') && pcc.status === PCC_STATUS.PENDING_GM && !isEditing) {
      actions.push(
        <Button key="gmapprove" variant="success" size="sm" onClick={() => gmApprovePcc(pcc.id, currentUser.id)} disabled={isEditRequested}>
          <CheckCircle size={14} /> Approve Payment / อนุมัติการจ่ายเงิน
        </Button>,
        <Button key="gmreject" variant="danger" size="sm" onClick={() => { setRejectTarget(pcc); setRejectMode('gm'); }} disabled={isEditRequested}>
          <XCircle size={14} /> Reject / ปฏิเสธ
        </Button>
      );
    }

    if (hasRole('SiteAdmin') && (pcc.status === PCC_STATUS.AP_REJECTED || pcc.status === PCC_STATUS.GM_REJECTED)) {
      actions.push(
        <span key="info" className="text-xs text-slate-500 italic flex items-center gap-1">
          <RefreshCw size={12} /> This PCC was rejected. Please create a new corrected PCC. / PCC นี้ถูกปฏิเสธ กรุณาสร้าง PCC ใหม่ที่แก้ไขแล้ว
        </span>
      );
    }

    if (userProfile?.roles?.includes('MasterAdmin')) {
      actions.push(
        <Button key="delete" variant="danger" size="sm" onClick={() => setDeleteTarget(pcc)}>
          <Trash2 size={14} /> Delete / ลบ
        </Button>
      );
    }

    // Edit Request Button (Available to any role if it's in a pending state)
    const canRequestEdit = [PCC_STATUS.PENDING_PM, PCC_STATUS.PENDING_AP, PCC_STATUS.PENDING_GM].includes(pcc.status) 
                           && !isEditRequested && !isEditing;
    if (canRequestEdit) {
      actions.push(
        <Button key="request_edit" variant="secondary" size="sm" onClick={() => requestEditPcc(pcc.id, currentUser.id)}>
          <RefreshCw size={14} /> Request Edit / ขอแก้ไข
        </Button>
      );
    }
    
    // Approve Edit Button (Available to the approver of the current step)
    if (isEditRequested) {
      const canApproveEdit = 
        (pcc.status === PCC_STATUS.PENDING_PM && hasRole('PM')) ||
        (pcc.status === PCC_STATUS.PENDING_AP && hasRole('AccountPay')) ||
        (pcc.status === PCC_STATUS.PENDING_GM && hasRole('GM', 'MD'));
        
      if (canApproveEdit) {
        actions.push(
          <Button key="approve_edit" variant="success" size="sm" onClick={() => approveEditPcc(pcc.id, pcc.status)}>
            <CheckCircle size={14} /> Approve Edit / อนุญาตแก้ไข
          </Button>
        );
      }
    }
    
    // Edit Button (Available to the requester when edit is approved)
    if (isEditing && pcc.editRequestedBy === currentUser.id) {
      actions.push(
        <Button key="edit" variant="primary" size="sm" onClick={() => setEditTarget(pcc)}>
          <FileIcon size={14} /> Edit / แก้ไข
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-800 truncate whitespace-nowrap">
            PCC Management <span className="text-sm font-medium text-slate-500">/ จัดการ PCC • Petty Cash Claims / ใบเบิกเงินสดย่อย – {visiblePccs.length} รายการ</span>
          </h2>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} className="h-9 px-3 shrink-0">
            <Plus size={15} /> New PCC / สร้าง PCC ใหม่
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
            <PccRow
              key={pcc.id}
              pcc={pcc}
              onAction={renderActions}
              canEditPoLinks={hasRole('AccountPay') && pcc.status === PCC_STATUS.PENDING_AP && pcc.status !== PCC_STATUS.EDITING}
              getPoLinkValue={(item) => {
                const key = `${pcc.id}::${item.id}`;
                return poLinksByItem[key] ?? item.poLink ?? '';
              }}
              onPoLinkChange={(item, value) => {
                const key = `${pcc.id}::${item.id}`;
                setPoLinksByItem((prev) => ({ ...prev, [key]: value }));
              }}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Petty Cash Claim (PCC) / ใบเบิกเงินสดย่อยใหม่" size="lg">
        <CreatePccForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>
      
      {/* Edit Modal */}
      {editTarget && (
        <Modal open={true} onClose={() => setEditTarget(null)} title={`Edit PCC / แก้ไข PCC: ${editTarget.id}`} size="lg">
          <CreatePccForm 
            initialData={editTarget}
            initialItems={getItemsByPcc(editTarget.id)}
            isEdit={true}
            onSubmit={(data, items) => {
              saveEditPcc(editTarget.id, data, items, editTarget.statusBeforeEdit);
              setEditTarget(null);
            }} 
            onClose={() => setEditTarget(null)} 
          />
        </Modal>
      )}

      {/* Reject Modal */}
      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(note) => {
          if (rejectMode === 'ap') apRejectPcc(rejectTarget.id, currentUser.id, note);
          else gmRejectPcc(rejectTarget.id, currentUser.id, note);
          setRejectTarget(null);
        }}
        title={`Reject PCC / ปฏิเสธ PCC: ${rejectTarget?.id}`}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete / ยืนยันการลบ" size="sm">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <p className="text-slate-800 font-semibold mb-1">Are you sure you want to delete this PCC?</p>
              <p className="text-sm text-slate-500">
                PCC: <span className="font-mono font-bold text-slate-700">{deleteTarget?.id}</span>
                <br />
                This action cannot be undone. / การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel / ยกเลิก</Button>
            <Button variant="danger" onClick={() => {
              if (deleteTarget) {
                deletePcc(deleteTarget.id);
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
