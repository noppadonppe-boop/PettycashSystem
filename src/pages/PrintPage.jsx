import { useState, useRef } from 'react';
import { Printer, FileText, Receipt, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useData } from '../context/SafeFirebaseContext';
import { useAuth } from '../context/AuthContext';
import { USERS, PCR_STATUS, PCC_STATUS } from '../data/mockData';
import { formatCurrency, formatDate, cn } from '../lib/utils';

function getUserName(id) {
  return USERS.find((u) => u.id === id)?.name ?? id ?? '—';
}

function StatusBadge({ status }) {
  const map = {
    [PCR_STATUS.PENDING_GM]:        'bg-amber-100 text-amber-800 border-amber-300',
    [PCR_STATUS.GM_REJECTED]:       'bg-rose-100 text-rose-800 border-rose-300',
    [PCR_STATUS.APPROVED]:          'bg-blue-100 text-blue-800 border-blue-300',
    [PCR_STATUS.ACKNOWLEDGED]:      'bg-emerald-100 text-emerald-800 border-emerald-300',
    [PCR_STATUS.CLOSURE_REQUESTED]: 'bg-purple-100 text-purple-800 border-purple-300',
    [PCR_STATUS.CLOSURE_CONFIRMED]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    [PCR_STATUS.CLOSED]:            'bg-slate-100 text-slate-700 border-slate-300',
    [PCC_STATUS.PENDING_PM]:        'bg-amber-100 text-amber-800 border-amber-300',
    [PCC_STATUS.PENDING_AP]:        'bg-orange-100 text-orange-800 border-orange-300',
    [PCC_STATUS.AP_REJECTED]:       'bg-rose-100 text-rose-800 border-rose-300',
    [PCC_STATUS.PENDING_GM]:        'bg-blue-100 text-blue-800 border-blue-300',
    [PCC_STATUS.GM_REJECTED]:       'bg-rose-100 text-rose-800 border-rose-300',
    [PCC_STATUS.APPROVED]:          'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', map[status] || 'bg-slate-100 text-slate-700 border-slate-300')}>
      {status}
    </span>
  );
}

// ─── PCR Document (A4) ────────────────────────────────────────────────────────

function PcrDocument({ pcr, project }) {
  const { getPcrRemainingBalance, getPcrApprovedSpend, getPccsByPcr, getItemsByPcc } = useData();
  const remaining = getPcrRemainingBalance(pcr.id);
  const approvedSpend = getPcrApprovedSpend(pcr.id);
  const utilizationPct = pcr.amount > 0 ? Math.round((approvedSpend / pcr.amount) * 100) : 0;
  const relatedPccs = getPccsByPcr(pcr.id);
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="a4-page bg-white shadow-xl mx-auto print:shadow-none print:mx-0">
      {/* Header band */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Construction Management Group</p>
            <p className="text-xl font-black text-slate-900 leading-tight">CMG Petty Cash System</p>
            <p className="text-[10px] text-slate-400">ระบบจัดการเงินสดย่อย</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block bg-blue-700 text-white px-4 py-2 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Document Type</p>
            <p className="text-lg font-black tracking-wider">PCR</p>
            <p className="text-[10px] opacity-80">ใบขอเงินสดย่อย</p>
          </div>
        </div>
      </div>

      {/* Document ID & Status row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Document No. / เลขที่เอกสาร</p>
          <p className="text-2xl font-black text-blue-700 tracking-wider font-mono">{pcr.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Status / สถานะ</p>
          <StatusBadge status={pcr.status} />
        </div>
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Project Information / ข้อมูลโครงการ</p>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <InfoRow label="Project ID / รหัสโครงการ" value={project?.id ?? '—'} mono />
            <InfoRow label="Project Name / ชื่อโครงการ" value={project?.name ?? '—'} />
            <InfoRow label="Location / สถานที่" value={project?.location ?? '—'} />
            <InfoRow label="PM" value={getUserName(project?.pmId)} />
            <InfoRow label="CM" value={getUserName(project?.cmId)} />
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">PCR Details / รายละเอียด PCR</p>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <InfoRow label="Created Date / วันที่สร้าง" value={formatDate(pcr.date)} />
            <InfoRow label="Due Date / วันครบกำหนด" value={formatDate(pcr.dueDate)} />
            <InfoRow label="Created By / สร้างโดย" value={getUserName(pcr.createdBy)} />
            {pcr.approvedBy && <InfoRow label="Approved By / อนุมัติโดย" value={`${getUserName(pcr.approvedBy)} (${formatDate(pcr.approvedAt)})`} />}
            {pcr.acknowledgedBy && <InfoRow label="Acknowledged By / รับทราบโดย" value={`${getUserName(pcr.acknowledgedBy)} (${formatDate(pcr.acknowledgedAt)})`} />}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reason / Justification / เหตุผลและความจำเป็น</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{pcr.reason}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="border border-blue-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-blue-700 px-4 py-2">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Financial Summary / สรุปการเงิน</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-blue-100">
          <FinancialBox label="PCR Amount / วงเงิน PCR" value={formatCurrency(pcr.amount)} color="blue" />
          <FinancialBox label="Approved Spend / เบิกจ่ายแล้ว" value={formatCurrency(approvedSpend)} color="emerald" />
          <FinancialBox label="Remaining Balance / คงเหลือ" value={formatCurrency(remaining)} color={remaining < 0 ? 'rose' : 'slate'} />
        </div>
        {/* Utilization bar */}
        <div className="px-4 py-3 border-t border-blue-100 bg-blue-50">
          <div className="flex justify-between text-xs text-blue-700 font-medium mb-1.5">
            <span>Fund Utilization / การใช้วงเงิน</span>
            <span className="font-bold">{utilizationPct}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className={cn('h-2.5 rounded-full', utilizationPct >= 90 ? 'bg-rose-500' : utilizationPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Related PCCs */}
      {relatedPccs.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Related PCC Claims / ใบเบิกที่เกี่ยวข้อง ({relatedPccs.length})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>PCC No.</Th>
                <Th>Date / วันที่</Th>
                <Th>Items / รายการ</Th>
                <Th align="right">Amount / จำนวน</Th>
                <Th>Status / สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {relatedPccs.map((pcc) => {
                const items = getItemsByPcc(pcc.id);
                return (
                  <tr key={pcc.id} className="border-b border-slate-100 last:border-0">
                    <Td mono>{pcc.id}</Td>
                    <Td>{formatDate(pcc.date)}</Td>
                    <Td>{items.length} item(s)</Td>
                    <Td align="right" bold>{formatCurrency(pcc.totalAmount)}</Td>
                    <Td><StatusBadge status={pcc.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t border-blue-200">
                <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-blue-800 uppercase">Total PCCs / รวม PCC</td>
                <td className="px-4 py-2.5 text-right text-sm font-black text-blue-800">
                  {formatCurrency(relatedPccs.reduce((s, p) => s + p.totalAmount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Rejection / Closure notes */}
      {(pcr.rejectNote || pcr.closureNote) && (
        <div className="flex flex-col gap-3 mb-6">
          {pcr.rejectNote && (
            <div className="border border-rose-200 rounded-xl bg-rose-50 px-4 py-3">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Rejection Note / หมายเหตุปฏิเสธ</p>
              <p className="text-sm text-rose-700">{pcr.rejectNote}</p>
            </div>
          )}
          {pcr.closureNote && (
            <div className="border border-purple-200 rounded-xl bg-purple-50 px-4 py-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Closure Note / หมายเหตุปิด PCR</p>
              <p className="text-sm text-purple-700">{pcr.closureNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature block */}
      <SignatureBlock />

      {/* Footer */}
      <DocumentFooter docId={pcr.id} printDate={printDate} />
    </div>
  );
}

// ─── PCC Document (A4) ────────────────────────────────────────────────────────

function PccDocument({ pcc }) {
  const { getItemsByPcc, getPcrById, getProjectById } = useData();
  const items = getItemsByPcc(pcc.id);
  const pcr = getPcrById(pcc.pcrId);
  const project = pcr ? getProjectById(pcr.projectId) : null;
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="a4-page bg-white shadow-xl mx-auto print:shadow-none print:mx-0">
      {/* Header band */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Construction Management Group</p>
            <p className="text-xl font-black text-slate-900 leading-tight">CMG Petty Cash System</p>
            <p className="text-[10px] text-slate-400">ระบบจัดการเงินสดย่อย</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Document Type</p>
            <p className="text-lg font-black tracking-wider">PCC</p>
            <p className="text-[10px] opacity-80">ใบเบิกเงินสดย่อย</p>
          </div>
        </div>
      </div>

      {/* Document ID & Status row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Document No. / เลขที่เอกสาร</p>
          <p className="text-2xl font-black text-emerald-700 tracking-wider font-mono">{pcc.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Status / สถานะ</p>
          <StatusBadge status={pcc.status} />
        </div>
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Project / PCR Reference</p>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <InfoRow label="Project / โครงการ" value={project?.name ?? '—'} />
            <InfoRow label="PCR No. / เลขที่ PCR" value={pcc.pcrId} mono />
            <InfoRow label="PCR Amount / วงเงิน PCR" value={pcr ? formatCurrency(pcr.amount) : '—'} />
            <InfoRow label="Location / สถานที่" value={project?.location ?? '—'} />
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Approval Trail / การอนุมัติ</p>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <InfoRow label="Submitted Date / วันที่ยื่น" value={formatDate(pcc.date)} />
            <InfoRow label="Submitted By / ยื่นโดย" value={getUserName(pcc.createdBy)} />
            {pcc.verifiedByPM && <InfoRow label="PM Verified / PM ตรวจสอบ" value={`${getUserName(pcc.verifiedByPM)} (${formatDate(pcc.verifiedByPMAt)})`} />}
            {pcc.verifiedByAP && <InfoRow label="AP Verified / AP ตรวจสอบ" value={`${getUserName(pcc.verifiedByAP)} (${formatDate(pcc.verifiedByAPAt)})`} />}
            {pcc.approvedByGM && <InfoRow label="GM Approved / GM อนุมัติ" value={`${getUserName(pcc.approvedByGM)} (${formatDate(pcc.approvedByGMAt)})`} />}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Line Items / รายการค่าใช้จ่าย</p>
          <p className="text-xs text-slate-300">{items.length} รายการ</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <Th width="5%">#</Th>
              <Th width="40%">Description / รายละเอียด</Th>
              <Th width="35%">Reason / เหตุผล</Th>
              <Th align="right" width="20%">Amount / จำนวน (฿)</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <Td center muted>{idx + 1}</Td>
                <Td>{item.description}</Td>
                <Td muted>{item.reason}</Td>
                <Td align="right" bold>{formatCurrency(item.amount)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-50 border-t-2 border-emerald-200">
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-emerald-800 uppercase tracking-wider">
                Total Amount / จำนวนเงินรวมทั้งสิ้น
              </td>
              <td className="px-4 py-3 text-right text-lg font-black text-emerald-800">
                {formatCurrency(pcc.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Rejection note */}
      {pcc.rejectNote && (
        <div className="border border-rose-200 rounded-xl bg-rose-50 px-4 py-3 mb-6">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Rejection Note / หมายเหตุปฏิเสธ</p>
          <p className="text-sm text-rose-700">{pcc.rejectNote}</p>
        </div>
      )}

      {/* Approval workflow steps visual */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Approval Workflow / ขั้นตอนการอนุมัติ</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200">
          <WorkflowStep
            step="1" role="SiteAdmin" roleTh="ผู้ดูแลไซต์"
            action="Created / สร้าง"
            by={getUserName(pcc.createdBy)}
            date={formatDate(pcc.date)}
            done
          />
          <WorkflowStep
            step="2" role="PM" roleTh="ผู้จัดการโครงการ"
            action="Verify / ตรวจสอบ"
            by={pcc.verifiedByPM ? getUserName(pcc.verifiedByPM) : null}
            date={pcc.verifiedByPMAt ? formatDate(pcc.verifiedByPMAt) : null}
            done={!!pcc.verifiedByPM}
            pending={pcc.status === PCC_STATUS.PENDING_PM}
          />
          <WorkflowStep
            step="3" role="AccountPay" roleTh="บัญชีเจ้าหนี้"
            action="Verify / ตรวจสอบ"
            by={pcc.verifiedByAP ? getUserName(pcc.verifiedByAP) : null}
            date={pcc.verifiedByAPAt ? formatDate(pcc.verifiedByAPAt) : null}
            done={!!pcc.verifiedByAP}
            pending={pcc.status === PCC_STATUS.PENDING_AP}
            rejected={pcc.status === PCC_STATUS.AP_REJECTED}
          />
          <WorkflowStep
            step="4" role="GM / MD" roleTh="ผู้จัดการใหญ่"
            action="Approve / อนุมัติ"
            by={pcc.approvedByGM ? getUserName(pcc.approvedByGM) : null}
            date={pcc.approvedByGMAt ? formatDate(pcc.approvedByGMAt) : null}
            done={!!pcc.approvedByGM}
            pending={pcc.status === PCC_STATUS.PENDING_GM}
            rejected={pcc.status === PCC_STATUS.GM_REJECTED}
          />
        </div>
      </div>

      {/* Signature block */}
      <SignatureBlock pcc />

      {/* Footer */}
      <DocumentFooter docId={pcc.id} printDate={printDate} />
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm text-slate-800 font-medium', mono && 'font-mono text-blue-700')}>{value}</p>
    </div>
  );
}

function FinancialBox({ label, value, color }) {
  const colors = {
    blue:    'text-blue-800 bg-blue-50',
    emerald: 'text-emerald-800 bg-emerald-50',
    rose:    'text-rose-700 bg-rose-50',
    slate:   'text-slate-800 bg-white',
  };
  return (
    <div className={cn('px-4 py-4 text-center', colors[color] || colors.slate)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-base font-black">{value}</p>
    </div>
  );
}

function Th({ children, align = 'left', width }) {
  return (
    <th
      style={width ? { width } : {}}
      className={cn(
        'px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left', bold, mono, muted, center }) {
  return (
    <td
      className={cn(
        'px-4 py-2.5 text-sm',
        align === 'right' ? 'text-right' : center ? 'text-center' : 'text-left',
        bold ? 'font-bold text-slate-800' : muted ? 'text-slate-400' : 'text-slate-700',
        mono && 'font-mono'
      )}
    >
      {children}
    </td>
  );
}

function WorkflowStep({ step, role, roleTh, action, by, date, done, pending, rejected }) {
  const bg = done ? 'bg-emerald-50' : pending ? 'bg-amber-50' : rejected ? 'bg-rose-50' : 'bg-slate-50';
  const circleColor = done ? 'bg-emerald-600' : pending ? 'bg-amber-500' : rejected ? 'bg-rose-500' : 'bg-slate-300';
  const textColor = done ? 'text-emerald-700' : pending ? 'text-amber-700' : rejected ? 'text-rose-700' : 'text-slate-400';
  const indicator = done ? '✓' : pending ? '…' : rejected ? '✗' : step;

  return (
    <div className={cn('p-3 flex flex-col items-center text-center gap-1', bg)}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black', circleColor)}>
        {indicator}
      </div>
      <p className="text-xs font-bold text-slate-700">{role}</p>
      <p className="text-[9px] text-slate-400">{roleTh}</p>
      <p className={cn('text-[10px] font-semibold', textColor)}>{action}</p>
      {by && <p className="text-[9px] text-slate-600 font-medium">{by}</p>}
      {date && <p className="text-[9px] text-slate-400">{date}</p>}
      {rejected && <p className="text-[9px] font-bold text-rose-600">REJECTED</p>}
    </div>
  );
}

function SignatureBlock({ pcc }) {
  const cols = pcc
    ? ['Prepared By / ผู้จัดทำ', 'PM Verified / PM ตรวจสอบ', 'AP Verified / AP ตรวจสอบ', 'GM Approved / GM อนุมัติ']
    : ['Requested By / ผู้ขอ', 'PM Acknowledged / PM รับทราบ', 'GM Approved / GM อนุมัติ', 'AP Confirmed / AP ยืนยัน'];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized Signatures / ลายเซ็นผู้มีอำนาจ</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-slate-200">
        {cols.map((col) => (
          <div key={col} className="p-4 flex flex-col items-center gap-3">
            <div className="w-full h-12 border-b border-dashed border-slate-300 mt-2" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-600 leading-tight">{col.split(' / ')[0]}</p>
              <p className="text-[9px] text-slate-400">{col.split(' / ')[1]}</p>
            </div>
            <p className="text-[9px] text-slate-400">Date / วันที่: ________________</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentFooter({ docId, printDate }) {
  return (
    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
      <p className="text-[9px] text-slate-400">
        CMG Petty Cash Management System • ระบบจัดการเงินสดย่อย CMG
      </p>
      <p className="text-[9px] text-slate-400 font-mono">{docId}</p>
      <p className="text-[9px] text-slate-400">
        Printed / พิมพ์เมื่อ: {printDate}
      </p>
    </div>
  );
}

// ─── Print Preview Modal ──────────────────────────────────────────────────────

function PrintPreviewModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-700/90 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="h-14 bg-slate-900 flex items-center justify-between px-6 shrink-0 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-white text-sm font-semibold">
            Print Preview — {doc.id}
          </p>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">A4</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Printer size={15} /> Print / พิมพ์ / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close / ปิด
          </button>
        </div>
      </div>
      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto py-8 print:p-0 print:overflow-visible">
        <div id="print-area">
          {doc.type === 'pcr' ? (
            <PcrDocument pcr={doc.data} project={doc.project} />
          ) : (
            <PccDocument pcc={doc.data} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main PrintPage ───────────────────────────────────────────────────────────

export function PrintPage() {
  const { projects, pcrs, pccs, getProjectById } = useData();
  const { currentUser } = useAuth();

  const [tab, setTab] = useState('pcr');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [expandedPcr, setExpandedPcr] = useState(null);

  const visiblePcrs = pcrs.filter((p) => !projectFilter || p.projectId === projectFilter);
  const visiblePccs = pccs.filter((p) => !projectFilter || (() => {
    const pcr = pcrs.find((r) => r.id === p.pcrId);
    return pcr?.projectId === projectFilter;
  })());

  const openPcrPreview = (pcr) => {
    const project = getProjectById(pcr.projectId);
    setPreviewDoc({ type: 'pcr', id: pcr.id, data: pcr, project });
  };

  const openPccPreview = (pcc) => {
    setPreviewDoc({ type: 'pcc', id: pcc.id, data: pcc });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Print Documents{' '}
            <span className="text-base font-medium text-slate-500">/ พิมพ์เอกสาร</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a PCR or PCC to preview and print as a professional A4 PDF document. /
            เลือก PCR หรือ PCC เพื่อดูตัวอย่างและพิมพ์เป็น PDF รูปแบบ A4
          </p>
        </div>

        {/* Tabs + Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('pcr')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                tab === 'pcr'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <FileText size={15} />
              PCR <span className="text-xs font-normal opacity-70">/ ใบขอเงินสดย่อย</span>
              <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {visiblePcrs.length}
              </span>
            </button>
            <button
              onClick={() => setTab('pcc')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                tab === 'pcc'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Receipt size={15} />
              PCC <span className="text-xs font-normal opacity-70">/ ใบเบิกเงินสดย่อย</span>
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {visiblePccs.length}
              </span>
            </button>
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Projects / ทุกโครงการ</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.id} – {p.name}</option>
            ))}
          </select>
        </div>

        {/* PCR List */}
        {tab === 'pcr' && (
          <div className="flex flex-col gap-3">
            {visiblePcrs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No PCRs found / ไม่พบรายการ PCR</p>
              </div>
            ) : (
              visiblePcrs.map((pcr) => {
                const project = getProjectById(pcr.projectId);
                return (
                  <div
                    key={pcr.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-blue-700 font-mono">{pcr.id}</p>
                          <StatusBadge status={pcr.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {project?.name} • Due {formatDate(pcr.dueDate)}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-right shrink-0">
                        <div>
                          <p className="text-[10px] text-slate-400">Amount / วงเงิน</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(pcr.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Date / วันที่</p>
                          <p className="text-sm text-slate-600">{formatDate(pcr.date)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openPcrPreview(pcr)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Printer size={13} /> Preview & Print
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PCC List */}
        {tab === 'pcc' && (
          <div className="flex flex-col gap-3">
            {visiblePccs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No PCCs found / ไม่พบรายการ PCC</p>
              </div>
            ) : (
              visiblePccs.map((pcc) => {
                const pcr = pcrs.find((r) => r.id === pcc.pcrId);
                const project = pcr ? getProjectById(pcr.projectId) : null;
                return (
                  <div
                    key={pcc.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <Receipt size={18} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-emerald-700 font-mono">{pcc.id}</p>
                          <StatusBadge status={pcc.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {project?.name} • PCR: {pcc.pcrId} • {formatDate(pcc.date)}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-right shrink-0">
                        <div>
                          <p className="text-[10px] text-slate-400">Total / รวม</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(pcc.totalAmount)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openPccPreview(pcc)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Printer size={13} /> Preview & Print
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Full-screen Print Preview */}
      {previewDoc && (
        <PrintPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
}
