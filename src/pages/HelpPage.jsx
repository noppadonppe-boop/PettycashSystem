import { useState } from 'react';
import {
  BookOpen, Users, GitBranch, Layers, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, ArrowRight, AlertTriangle,
  LayoutDashboard, FolderOpen, FileText, Receipt, Printer,
  Lock, DollarSign, RefreshCw, Eye, Plus, Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ children, color = 'slate' }) {
  const map = {
    blue:    'bg-blue-100 text-blue-800 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber:   'bg-amber-100 text-amber-800 border-amber-200',
    rose:    'bg-rose-100 text-rose-800 border-rose-200',
    purple:  'bg-purple-100 text-purple-800 border-purple-200',
    indigo:  'bg-indigo-100 text-indigo-800 border-indigo-200',
    slate:   'bg-slate-100 text-slate-700 border-slate-200',
    orange:  'bg-orange-100 text-orange-800 border-orange-200',
  };
  return (
    <span className={cn('inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border', map[color])}>
      {children}
    </span>
  );
}

function SectionCard({ icon: Icon, title, titleTh, color = 'blue', children }) {
  const colors = {
    blue:    { header: 'bg-blue-700',    icon: 'bg-blue-100 text-blue-700' },
    emerald: { header: 'bg-emerald-700', icon: 'bg-emerald-100 text-emerald-700' },
    amber:   { header: 'bg-amber-600',   icon: 'bg-amber-100 text-amber-700' },
    purple:  { header: 'bg-purple-700',  icon: 'bg-purple-100 text-purple-700' },
    slate:   { header: 'bg-slate-700',   icon: 'bg-slate-100 text-slate-700' },
    rose:    { header: 'bg-rose-700',    icon: 'bg-rose-100 text-rose-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={cn('px-6 py-4 flex items-center gap-3', c.header)}>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-white/20')}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">{title}</p>
          <p className="text-white/70 text-xs">{titleTh}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Accordion({ title, titleTh, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{titleTh}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-5 py-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Step({ num, title, titleTh, by, byTh, byColor = 'slate', action, actionTh, note, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
          {num}
        </div>
        {!isLast && <div className="w-0.5 bg-blue-200 flex-1 my-1 min-h-[24px]" />}
      </div>
      <div className={cn('pb-5', isLast ? '' : '')}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{titleTh}</p>
          <Badge color={byColor}>{by} / {byTh}</Badge>
        </div>
        <p className="text-sm text-slate-600 mb-1">
          <span className="font-semibold text-slate-700">Action:</span> {action}
        </p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold">การดำเนินการ:</span> {actionTh}
        </p>
        {note && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
            ⚠ {note}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusFlow({ statuses }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {statuses.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className={cn(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full border',
            s.color === 'amber'   ? 'bg-amber-50 text-amber-700 border-amber-200' :
            s.color === 'blue'    ? 'bg-blue-50 text-blue-700 border-blue-200' :
            s.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            s.color === 'purple'  ? 'bg-purple-50 text-purple-700 border-purple-200' :
            s.color === 'indigo'  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            s.color === 'rose'    ? 'bg-rose-50 text-rose-700 border-rose-200' :
            s.color === 'slate'   ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
          )}>
            {s.label}
          </span>
          {i < statuses.length - 1 && (
            s.alt
              ? <span className="text-slate-400 text-xs font-bold">or</span>
              : <ArrowRight size={13} className="text-slate-400 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function RoleCard({ role, roleTh, color, icon: Icon, responsibilities, canDo }) {
  const colors = {
    purple:  { bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-800',dot: 'bg-emerald-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500' },
    orange:  { bg: 'bg-orange-50',  border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-400' },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className={cn('rounded-xl border p-4 flex flex-col gap-3', c.bg, c.border)}>
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.badge)}>
          <Icon size={17} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">{role}</p>
          <p className="text-xs text-slate-500">{roleTh}</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Responsibilities / ความรับผิดชอบ</p>
        <ul className="flex flex-col gap-1">
          {responsibilities.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', c.dot)} />
              {r}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Can Access / เข้าถึงได้</p>
        <div className="flex flex-wrap gap-1">
          {canDo.map((d, i) => (
            <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main HelpPage ────────────────────────────────────────────────────────────

export function HelpPage() {
  const [activeTab, setActiveTab] = useState('workflow');

  const tabs = [
    { id: 'workflow',  label: 'Workflow',        labelTh: 'ขั้นตอนการทำงาน',   icon: GitBranch },
    { id: 'roles',     label: 'Roles & Access',  labelTh: 'บทบาทและสิทธิ์',    icon: Users },
    { id: 'features',  label: 'Feature Guide',   labelTh: 'คู่มือการใช้งาน',   icon: Layers },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          System Guide{' '}
          <span className="text-base font-medium text-slate-500">/ คู่มือการใช้งานระบบ</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Workflow, role responsibilities, and feature documentation for CMG Petty Cash System. /
          ขั้นตอนการทำงาน ความรับผิดชอบ และคู่มือฟีเจอร์ระบบเงินสดย่อย CMG
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer',
              activeTab === t.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <t.icon size={15} />
            {t.label}
            <span className="text-[10px] font-normal opacity-60 hidden sm:inline">/ {t.labelTh}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: WORKFLOW ─────────────────────────────────────────────────── */}
      {activeTab === 'workflow' && (
        <div className="flex flex-col gap-6">

          {/* PCR Workflow */}
          <SectionCard icon={FileText} title="PCR Workflow — Petty Cash Request" titleTh="ขั้นตอนการขอเงินสดย่อย (PCR)" color="blue">
            <p className="text-sm text-slate-500 mb-5">
              A PCR is a request to open a petty cash wallet for a project. Funds are held until spent via PCC claims, then the wallet is formally closed. /
              PCR คือการขอเปิดกระเป๋าเงินสดย่อยสำหรับโครงการ เงินจะถูกถือไว้จนกว่าจะมีการเบิกจ่ายผ่าน PCC และปิดกระเป๋าอย่างเป็นทางการ
            </p>

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status Flow / การเปลี่ยนสถานะ</p>
              <StatusFlow statuses={[
                { label: 'Pending GM',            color: 'amber' },
                { label: 'Approved',              color: 'blue' },
                { label: 'Acknowledged by AP',    color: 'emerald' },
                { label: 'Closure Requested',     color: 'purple' },
                { label: 'Closure Confirmed by AP', color: 'indigo' },
                { label: 'Closed',                color: 'slate' },
              ]} />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold">Rejection path:</span>
                <StatusFlow statuses={[
                  { label: 'Pending GM', color: 'amber' },
                  { label: 'GM Rejected', color: 'rose' },
                  { label: 'Pending GM (resubmit)', color: 'amber' },
                ]} />
              </div>
            </div>

            <div className="flex flex-col gap-0">
              <Step num={1}
                title="PM Creates PCR" titleTh="PM สร้างคำขอ PCR"
                by="PM" byTh="ผู้จัดการโครงการ" byColor="emerald"
                action="Fill in project, amount (THB), due date, and justification reason. Submit to GM for approval."
                actionTh="กรอกโครงการ จำนวนเงิน (บาท) วันครบกำหนด และเหตุผลความจำเป็น ส่งให้ GM อนุมัติ"
              />
              <Step num={2}
                title="GM / MD Reviews PCR" titleTh="GM/MD พิจารณา PCR"
                by="GM / MD" byTh="ผู้จัดการใหญ่/กรรมการผู้จัดการ" byColor="blue"
                action="Approve or reject the PCR. If rejected, PM must edit and resubmit with corrections."
                actionTh="อนุมัติหรือปฏิเสธ PCR หากปฏิเสธ PM ต้องแก้ไขและส่งใหม่"
                note="Rejection requires a written reason. PM can then Edit & Resubmit. / การปฏิเสธต้องระบุเหตุผล PM สามารถแก้ไขและส่งใหม่ได้"
              />
              <Step num={3}
                title="AccountPay Acknowledges & Transfers Funds" titleTh="AP รับทราบและโอนเงิน"
                by="AccountPay" byTh="บัญชีเจ้าหนี้" byColor="amber"
                action="After GM approves, AP confirms the physical cash transfer to the PM. Status becomes 'Acknowledged by AP'."
                actionTh="หลัง GM อนุมัติ AP ยืนยันการโอนเงินสดให้ PM สถานะเปลี่ยนเป็น 'Acknowledged by AP'"
              />
              <Step num={4}
                title="PM Uses Funds & Submits PCCs" titleTh="PM ใช้เงินและส่ง PCC"
                by="PM / SiteAdmin" byTh="ผู้จัดการโครงการ/ผู้ดูแลไซต์" byColor="emerald"
                action="SiteAdmin records expenses as PCC claims against this PCR wallet. PCCs go through their own approval chain."
                actionTh="SiteAdmin บันทึกค่าใช้จ่ายเป็น PCC เทียบกับกระเป๋า PCR นี้ PCC จะผ่านขั้นตอนการอนุมัติของตนเอง"
              />
              <Step num={5}
                title="PM Requests PCR Closure" titleTh="PM ขอปิด PCR"
                by="PM" byTh="ผู้จัดการโครงการ" byColor="emerald"
                action="When all expenses are settled, PM submits a closure request with a note and the amount to be returned."
                actionTh="เมื่อค่าใช้จ่ายทั้งหมดเสร็จสิ้น PM ส่งคำขอปิดพร้อมหมายเหตุและยอดเงินที่จะคืน"
              />
              <Step num={6}
                title="AccountPay Confirms Returned Cash" titleTh="AP ยืนยันรับเงินคืน"
                by="AccountPay" byTh="บัญชีเจ้าหนี้" byColor="amber"
                action="AP physically receives the leftover cash from the PM and confirms the amount. Status becomes 'Closure Confirmed by AP'."
                actionTh="AP รับเงินสดที่เหลือจาก PM คืนและยืนยันยอดเงิน สถานะเปลี่ยนเป็น 'Closure Confirmed by AP'"
              />
              <Step num={7}
                title="GM / MD Officially Closes PCR" titleTh="GM/MD ปิด PCR อย่างเป็นทางการ"
                by="GM / MD" byTh="ผู้จัดการใหญ่/กรรมการผู้จัดการ" byColor="blue"
                action="GM/MD performs the final official closure of the PCR wallet. Status becomes 'Closed'."
                actionTh="GM/MD ดำเนินการปิดกระเป๋า PCR อย่างเป็นทางการ สถานะเปลี่ยนเป็น 'Closed'"
                isLast
              />
            </div>
          </SectionCard>

          {/* PCC Workflow */}
          <SectionCard icon={Receipt} title="PCC Workflow — Petty Cash Claim" titleTh="ขั้นตอนการเบิกเงินสดย่อย (PCC)" color="emerald">
            <p className="text-sm text-slate-500 mb-5">
              A PCC is a reimbursement claim submitted against an active PCR wallet. It must pass through PM → AP → GM approval before payment is authorized. /
              PCC คือใบเบิกเงินสดย่อยที่ส่งเทียบกับกระเป๋า PCR ที่ใช้งานอยู่ ต้องผ่านการอนุมัติ PM → AP → GM ก่อนการชำระเงิน
            </p>

            <div className="mb-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status Flow / การเปลี่ยนสถานะ</p>
              <StatusFlow statuses={[
                { label: 'Pending PM',  color: 'amber' },
                { label: 'Pending AP',  color: 'orange' },
                { label: 'Pending GM',  color: 'blue' },
                { label: 'Approved',    color: 'emerald' },
              ]} />
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">AP rejection:</span>
                  <StatusFlow statuses={[
                    { label: 'Pending AP', color: 'orange' },
                    { label: 'AP Rejected', color: 'rose' },
                  ]} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">GM rejection:</span>
                  <StatusFlow statuses={[
                    { label: 'Pending GM', color: 'blue' },
                    { label: 'GM Rejected', color: 'rose' },
                  ]} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-0">
              <Step num={1}
                title="SiteAdmin Creates PCC" titleTh="SiteAdmin สร้าง PCC"
                by="SiteAdmin" byTh="ผู้ดูแลไซต์" byColor="orange"
                action="Select project → active PCR wallet → add line items (description, amount, reason). System checks PCR balance automatically."
                actionTh="เลือกโครงการ → กระเป๋า PCR ที่ใช้งาน → เพิ่มรายการ (รายละเอียด จำนวนเงิน เหตุผล) ระบบตรวจสอบยอดคงเหลือ PCR อัตโนมัติ"
                note="PCC cannot be submitted if total exceeds PCR remaining balance. / ไม่สามารถส่ง PCC ได้หากยอดเกินคงเหลือ PCR"
              />
              <Step num={2}
                title="PM Verifies PCC" titleTh="PM ตรวจสอบ PCC"
                by="PM" byTh="ผู้จัดการโครงการ" byColor="emerald"
                action="PM reviews line items for validity and correctness. Clicks 'Verify & Pass to AP' to forward to AccountPay."
                actionTh="PM ตรวจสอบรายการค่าใช้จ่ายว่าถูกต้อง กด 'Verify & Pass to AP' เพื่อส่งต่อให้ AccountPay"
              />
              <Step num={3}
                title="AccountPay Verifies PCC" titleTh="AP ตรวจสอบ PCC"
                by="AccountPay" byTh="บัญชีเจ้าหนี้" byColor="amber"
                action="AP performs accounting verification. Can approve (pass to GM) or reject back to SiteAdmin with a reason."
                actionTh="AP ตรวจสอบทางบัญชี สามารถอนุมัติ (ส่งต่อ GM) หรือปฏิเสธคืน SiteAdmin พร้อมเหตุผล"
                note="If AP rejects: SiteAdmin must create a new corrected PCC. The rejected PCC is locked. / หาก AP ปฏิเสธ: SiteAdmin ต้องสร้าง PCC ใหม่ที่แก้ไขแล้ว PCC ที่ถูกปฏิเสธจะถูกล็อก"
              />
              <Step num={4}
                title="GM / MD Approves Payment" titleTh="GM/MD อนุมัติการชำระเงิน"
                by="GM / MD" byTh="ผู้จัดการใหญ่/กรรมการผู้จัดการ" byColor="blue"
                action="Final approval. GM/MD clicks 'Approve Payment'. PCC status becomes 'Approved' and spend is deducted from PCR wallet."
                actionTh="การอนุมัติขั้นสุดท้าย GM/MD กด 'Approve Payment' สถานะ PCC เปลี่ยนเป็น 'Approved' และยอดถูกหักออกจากกระเป๋า PCR"
                isLast
              />
            </div>
          </SectionCard>

          {/* PCR–PCC Relationship */}
          <SectionCard icon={GitBranch} title="PCR ↔ PCC Relationship" titleTh="ความสัมพันธ์ระหว่าง PCR และ PCC" color="purple">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-blue-700" />
                  <p className="font-bold text-blue-800">PCR = Wallet / กระเป๋าเงิน</p>
                </div>
                <ul className="flex flex-col gap-1 text-xs text-blue-700">
                  <li>• One PCR per project per period</li>
                  <li>• Holds the approved cash amount</li>
                  <li>• Multiple PCCs can draw from it</li>
                  <li>• 1 PCR สำหรับ 1 โครงการต่อช่วงเวลา</li>
                  <li>• ถือจำนวนเงินที่ได้รับอนุมัติ</li>
                  <li>• PCC หลายรายการสามารถเบิกจ่ายจากกระเป๋าเดียวกัน</li>
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-400">1 : N</p>
                  <p className="text-xs text-slate-400 mt-1">One PCR → Many PCCs</p>
                  <p className="text-xs text-slate-400">PCR 1 รายการ → PCC หลายรายการ</p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={16} className="text-emerald-700" />
                  <p className="font-bold text-emerald-800">PCC = Expense Claim / ใบเบิก</p>
                </div>
                <ul className="flex flex-col gap-1 text-xs text-emerald-700">
                  <li>• Many PCCs per PCR</li>
                  <li>• Each PCC = one expense event</li>
                  <li>• Must not exceed PCR balance</li>
                  <li>• PCC หลายรายการต่อ PCR</li>
                  <li>• PCC 1 รายการ = 1 เหตุการณ์ค่าใช้จ่าย</li>
                  <li>• ต้องไม่เกินยอดคงเหลือ PCR</li>
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* Aging / Overdue Alerts */}
          <SectionCard icon={AlertTriangle} title="Aging Alerts / Overdue Warning" titleTh="การแจ้งเตือน PCR เกินกำหนด" color="amber">
            <p className="text-sm text-slate-600">
              The Dashboard automatically highlights any <strong>active PCR</strong> (status = <Badge color="emerald">Acknowledged by AP</Badge>) whose <strong>due date has passed</strong>.
              This means the PM has not yet requested closure and there may be unaccounted funds outstanding. /
              แดชบอร์ดจะไฮไลต์ PCR ที่ใช้งานอยู่ (สถานะ = Acknowledged by AP) ที่<strong>เลยวันครบกำหนดแล้ว</strong>
              หมายความว่า PM ยังไม่ได้ขอปิด PCR และอาจมีเงินที่ยังไม่ได้บัญชี
            </p>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>PM should request PCR closure promptly after all expenses are recorded. / PM ควรขอปิด PCR ทันทีหลังบันทึกค่าใช้จ่ายทั้งหมดแล้ว</span>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── TAB: ROLES ────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-6">
          <SectionCard icon={Users} title="Roles & Responsibilities" titleTh="บทบาทและความรับผิดชอบ" color="slate">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <RoleCard
                role="MD — Managing Director"
                roleTh="กรรมการผู้จัดการ"
                color="purple"
                icon={Shield}
                responsibilities={[
                  'Approve or reject PCR requests (same authority as GM)',
                  'Officially close PCRs after AP confirms funds returned',
                  'Approve PCC payment (same authority as GM)',
                  'Full read access to all data and Dashboard',
                  'อนุมัติ/ปฏิเสธคำขอ PCR (สิทธิ์เทียบเท่า GM)',
                  'ปิด PCR อย่างเป็นทางการหลัง AP ยืนยันรับเงินคืน',
                  'อนุมัติการจ่าย PCC',
                  'เข้าถึงข้อมูลและแดชบอร์ดทั้งหมด',
                ]}
                canDo={['Dashboard', 'Projects (view)', 'PCR Management', 'PCC Management', 'Print', 'Help']}
              />
              <RoleCard
                role="GM — General Manager"
                roleTh="ผู้จัดการทั่วไป"
                color="blue"
                icon={Shield}
                responsibilities={[
                  'Primary approver for PCR requests',
                  'Officially close PCRs (final step)',
                  'Final approver for PCC payment',
                  'Full Dashboard and reporting access',
                  'ผู้อนุมัติหลักสำหรับคำขอ PCR',
                  'ปิด PCR อย่างเป็นทางการ (ขั้นสุดท้าย)',
                  'ผู้อนุมัติขั้นสุดท้ายสำหรับการจ่าย PCC',
                  'เข้าถึงแดชบอร์ดและรายงานทั้งหมด',
                ]}
                canDo={['Dashboard', 'Projects (view)', 'PCR Management', 'PCC Management', 'Print', 'Help']}
              />
              <RoleCard
                role="PM — Project Manager"
                roleTh="ผู้จัดการโครงการ"
                color="emerald"
                icon={FolderOpen}
                responsibilities={[
                  'Create and submit PCR requests for own projects',
                  'Edit and resubmit rejected PCRs',
                  'Acknowledge cash receipt (PCR becomes active)',
                  'Request PCR closure when expenses are complete',
                  'Verify (Step 1 approval) PCC claims from SiteAdmin',
                  'Create and manage projects',
                  'สร้างและส่งคำขอ PCR สำหรับโครงการของตน',
                  'แก้ไขและส่ง PCR ที่ถูกปฏิเสธใหม่',
                  'รับทราบการรับเงิน (PCR เริ่มใช้งาน)',
                  'ขอปิด PCR เมื่อค่าใช้จ่ายครบ',
                  'ตรวจสอบ (การอนุมัติขั้น 1) ใบเบิก PCC',
                ]}
                canDo={['Projects', 'PCR Management', 'PCC Management', 'Print', 'Help']}
              />
              <RoleCard
                role="AccountPay — Accounts Payable"
                roleTh="บัญชีเจ้าหนี้"
                color="amber"
                icon={DollarSign}
                responsibilities={[
                  'Acknowledge fund transfer after GM approves PCR',
                  'Verify PCC claims (Step 2 of PCC approval)',
                  'Reject PCC back to SiteAdmin if accounting errors',
                  'Confirm receipt of returned cash on PCR closure',
                  'Access Dashboard and all financial reports',
                  'ยืนยันการโอนเงินหลัง GM อนุมัติ PCR',
                  'ตรวจสอบใบเบิก PCC (ขั้นที่ 2)',
                  'ปฏิเสธ PCC คืน SiteAdmin หากมีข้อผิดพลาดทางบัญชี',
                  'ยืนยันรับเงินสดคืนเมื่อปิด PCR',
                ]}
                canDo={['Dashboard', 'PCR Management', 'PCC Management', 'Print', 'Help']}
              />
              <RoleCard
                role="SiteAdmin — Site Administrator"
                roleTh="ผู้ดูแลไซต์"
                color="orange"
                icon={FileText}
                responsibilities={[
                  'Submit PCC expense claims against active PCR wallets',
                  'Record all on-site purchases with descriptions and receipts',
                  'Create a new corrected PCC if previous one was rejected',
                  'Cannot approve or manage PCRs',
                  'ส่งใบเบิก PCC เทียบกับกระเป๋า PCR ที่ใช้งาน',
                  'บันทึกการซื้อทั้งหมดในไซต์พร้อมรายละเอียด',
                  'สร้าง PCC ใหม่หากรายการก่อนหน้าถูกปฏิเสธ',
                  'ไม่มีสิทธิ์อนุมัติหรือจัดการ PCR',
                ]}
                canDo={['PCC Management', 'Print', 'Help']}
              />
              <RoleCard
                role="CM — Construction Manager"
                roleTh="ผู้จัดการก่อสร้าง"
                color="slate"
                icon={Eye}
                responsibilities={[
                  'View-only access to projects assigned to them',
                  'No PCR or PCC creation or approval rights',
                  'Can view Print Documents page',
                  'Read-only role for oversight and monitoring',
                  'เข้าถึงโครงการที่ได้รับมอบหมายแบบอ่านอย่างเดียว',
                  'ไม่มีสิทธิ์สร้างหรืออนุมัติ PCR/PCC',
                  'สิทธิ์อ่านอย่างเดียวสำหรับการติดตาม',
                ]}
                canDo={['Projects (view only)', 'Print', 'Help']}
              />
            </div>
          </SectionCard>

          {/* Responsibility Matrix */}
          <SectionCard icon={GitBranch} title="Responsibility Matrix" titleTh="ตารางความรับผิดชอบ" color="blue">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold rounded-tl-lg">Action / การดำเนินการ</th>
                    {['MD','GM','PM','AccountPay','SiteAdmin','CM'].map((r) => (
                      <th key={r} className="px-3 py-2.5 text-center font-semibold last:rounded-tr-lg">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { action: 'Create Project / สร้างโครงการ',          perms: ['✓','✓','✓','—','—','—'] },
                    { action: 'Create PCR / สร้าง PCR',                  perms: ['—','—','✓','—','—','—'] },
                    { action: 'Approve PCR / อนุมัติ PCR',               perms: ['✓','✓','—','—','—','—'] },
                    { action: 'Reject PCR / ปฏิเสธ PCR',                 perms: ['✓','✓','—','—','—','—'] },
                    { action: 'Acknowledge Fund Transfer / ยืนยันโอนเงิน',perms: ['—','—','—','✓','—','—'] },
                    { action: 'Request PCR Closure / ขอปิด PCR',         perms: ['—','—','✓','—','—','—'] },
                    { action: 'Confirm Returned Cash / ยืนยันเงินคืน',   perms: ['—','—','—','✓','—','—'] },
                    { action: 'Officially Close PCR / ปิด PCR',          perms: ['✓','✓','—','—','—','—'] },
                    { action: 'Create PCC / สร้าง PCC',                  perms: ['—','—','—','—','✓','—'] },
                    { action: 'PM Verify PCC / PM ตรวจสอบ',              perms: ['—','—','✓','—','—','—'] },
                    { action: 'AP Verify PCC / AP ตรวจสอบ',              perms: ['—','—','—','✓','—','—'] },
                    { action: 'AP Reject PCC / AP ปฏิเสธ',               perms: ['—','—','—','✓','—','—'] },
                    { action: 'GM Approve PCC Payment / GM อนุมัติ PCC', perms: ['✓','✓','—','—','—','—'] },
                    { action: 'View Dashboard / ดูแดชบอร์ด',             perms: ['✓','✓','—','✓','—','—'] },
                    { action: 'Print Documents / พิมพ์เอกสาร',           perms: ['✓','✓','✓','✓','✓','✓'] },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 text-slate-700 font-medium border-b border-slate-100">{row.action}</td>
                      {row.perms.map((p, j) => (
                        <td key={j} className="px-3 py-2 text-center border-b border-slate-100">
                          {p === '✓'
                            ? <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">✓</span>
                            : <span className="text-slate-300 text-sm">—</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── TAB: FEATURES ─────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <div className="flex flex-col gap-4">

          <Accordion title="Dashboard / แดชบอร์ด" titleTh="ภาพรวมทางการเงิน" defaultOpen icon={LayoutDashboard}>
            <div className="flex flex-col gap-4 text-sm text-slate-700">
              <p>The Dashboard is visible to <Badge color="purple">MD</Badge> <Badge color="blue">GM</Badge> <Badge color="amber">AccountPay</Badge> only. It provides a real-time financial overview. / แดชบอร์ดมองเห็นได้เฉพาะ MD, GM, AccountPay เท่านั้น แสดงภาพรวมทางการเงินแบบเรียลไทม์</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: DollarSign, color: 'text-blue-600 bg-blue-100', label: 'Outstanding Cash / เงินสดคงค้าง', desc: 'Total cash across all PCRs with status "Acknowledged by AP" minus already-claimed PCC amounts. / เงินสดทั้งหมดใน PCR ที่มีสถานะ "Acknowledged by AP" ลบยอด PCC ที่เบิกจ่ายแล้ว' },
                  { icon: FolderOpen, color: 'text-emerald-600 bg-emerald-100', label: 'Active Projects / โครงการที่ใช้งาน', desc: 'Total number of registered projects and how many have active (acknowledged) PCR wallets. / จำนวนโครงการทั้งหมดและจำนวนที่มีกระเป๋า PCR ที่ใช้งานอยู่' },
                  { icon: Clock, color: 'text-amber-600 bg-amber-100', label: 'Pending Your Approval / รออนุมัติ', desc: 'Count of PCRs and PCCs waiting for the logged-in user\'s action. Changes based on your role. / จำนวน PCR และ PCC ที่รอการดำเนินการจากผู้ใช้ที่ล็อกอินอยู่ เปลี่ยนตามบทบาท' },
                  { icon: Receipt, color: 'text-purple-600 bg-purple-100', label: 'Total Approved Claims / ยอดอนุมัติทั้งหมด', desc: 'Sum of all fully-approved PCC amounts across all projects. / ยอดรวม PCC ที่ได้รับอนุมัติครบทั้งหมดในทุกโครงการ' },
                ].map((m, i) => (
                  <div key={i} className="flex gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', m.color)}>
                      <m.icon size={15} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs mb-0.5">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <strong>Aging Alerts:</strong> Displayed when any active PCR's due date has passed. Table shows PCR ID, project, amount, days overdue, and responsible PM. / แสดงเมื่อวันครบกำหนดของ PCR ที่ใช้งานอยู่ผ่านไปแล้ว ตารางแสดง ID, โครงการ, จำนวนเงิน, จำนวนวันที่เกินกำหนด และ PM ที่รับผิดชอบ
              </div>
            </div>
          </Accordion>

          <Accordion title="Projects / โครงการ" titleTh="การจัดการโครงการ">
            <div className="flex flex-col gap-3 text-sm text-slate-700">
              <p>Visible to: <Badge color="purple">MD</Badge> <Badge color="blue">GM</Badge> <Badge color="emerald">PM</Badge> <Badge color="slate">CM</Badge> <Badge color="amber">AccountPay</Badge></p>
              <ul className="flex flex-col gap-2">
                <li className="flex gap-2"><Plus size={14} className="text-blue-500 shrink-0 mt-0.5" /><span><strong>New Project:</strong> Available to MD, GM, PM. Fill in name, location, assign PM and CM, set start/end dates, optional notes. / สร้างโครงการใหม่: กรอกชื่อ สถานที่ มอบหมาย PM/CM กำหนดวันเริ่มและสิ้นสุด</span></li>
                <li className="flex gap-2"><Eye size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>View PCRs:</strong> Button on each project card — navigates directly to PCR Management filtered by that project. / ปุ่มบนการ์ดโครงการแต่ละรายการ — นำทางไปยัง PCR Management ที่กรองตามโครงการนั้น</span></li>
                <li className="flex gap-2"><RefreshCw size={14} className="text-amber-500 shrink-0 mt-0.5" /><span><strong>Edit Project:</strong> Available to MD, GM, PM. Opens the same form pre-filled with existing data. / แก้ไขโครงการ: ใช้ได้สำหรับ MD, GM, PM เปิดฟอร์มพร้อมข้อมูลที่มีอยู่</span></li>
              </ul>
            </div>
          </Accordion>

          <Accordion title="PCR Management / จัดการ PCR" titleTh="การจัดการคำขอเงินสดย่อย">
            <div className="flex flex-col gap-3 text-sm text-slate-700">
              <p>Visible to: <Badge color="purple">MD</Badge> <Badge color="blue">GM</Badge> <Badge color="emerald">PM</Badge> <Badge color="amber">AccountPay</Badge></p>
              <ul className="flex flex-col gap-2">
                <li className="flex gap-2"><Plus size={14} className="text-blue-500 shrink-0 mt-0.5" /><span><strong>New PCR:</strong> PM selects their project, enters amount (THB), due date, and reason. Submitted to "Pending GM". / สร้าง PCR ใหม่: PM เลือกโครงการ กรอกจำนวนเงิน (บาท) วันครบกำหนด และเหตุผล ส่งไปที่ "Pending GM"</span></li>
                <li className="flex gap-2"><ChevronDown size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Expand Row:</strong> Click any PCR row to expand and see fund utilization bar, reason, audit trail, related notes, and available action buttons. / คลิกแถว PCR เพื่อขยายและดูแถบการใช้เงิน เหตุผล ประวัติ หมายเหตุ และปุ่มดำเนินการที่ใช้ได้</span></li>
                <li className="flex gap-2"><Eye size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Filters:</strong> Filter by Project or Status using the dropdowns at the top. PM sees only their own projects' PCRs. / กรองตามโครงการหรือสถานะโดยใช้ตัวกรอง PM จะเห็นเฉพาะ PCR ของโครงการตนเอง</span></li>
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {[
                  { btn: 'Approve PCR / อนุมัติ PCR',      who: 'GM / MD', color: 'emerald', desc: 'When status is "Pending GM"' },
                  { btn: 'Reject / ปฏิเสธ',                who: 'GM / MD', color: 'rose',    desc: 'Requires written reason. PM can resubmit.' },
                  { btn: 'Acknowledge (Fund Transferred)', who: 'AccountPay', color: 'blue', desc: 'When status is "Approved"' },
                  { btn: 'Edit & Resubmit',                who: 'PM', color: 'amber',         desc: 'Only after GM rejection' },
                  { btn: 'Request Closure / ขอปิด',        who: 'PM', color: 'purple',        desc: 'When status is "Acknowledged by AP"' },
                  { btn: 'Confirm Receipt / ยืนยันเงินคืน',who: 'AccountPay', color: 'indigo',desc: 'After PM requests closure' },
                  { btn: 'Officially Close PCR / ปิด PCR', who: 'GM / MD', color: 'slate',   desc: 'Final step after AP confirms' },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <Badge color={b.color}>{b.btn}</Badge>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">{b.who}</span>
                      <span className="text-slate-400"> — {b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion title="PCC Management / จัดการ PCC" titleTh="การจัดการใบเบิกเงินสดย่อย">
            <div className="flex flex-col gap-3 text-sm text-slate-700">
              <p>Visible to: <Badge color="purple">MD</Badge> <Badge color="blue">GM</Badge> <Badge color="emerald">PM</Badge> <Badge color="amber">AccountPay</Badge> <Badge color="orange">SiteAdmin</Badge></p>
              <ul className="flex flex-col gap-2">
                <li className="flex gap-2"><Plus size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>New PCC:</strong> SiteAdmin selects project → active PCR → adds line items. Each item needs description, amount, and reason. System shows PCR balance check automatically. / SiteAdmin เลือกโครงการ → PCR ที่ใช้งาน → เพิ่มรายการ แต่ละรายการต้องมีรายละเอียด จำนวนเงิน และเหตุผล ระบบแสดงการตรวจสอบยอดคงเหลือ PCR อัตโนมัติ</span></li>
                <li className="flex gap-2"><AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /><span><strong>Balance Guard:</strong> If the total PCC amount would exceed the PCR remaining balance, the Submit button is disabled. / หากยอดรวม PCC จะเกินยอดคงเหลือ PCR ปุ่มส่งจะถูกปิดใช้งาน</span></li>
                <li className="flex gap-2"><ChevronDown size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Expand Row:</strong> Shows the approval workflow stepper, line items table, audit trail, and action buttons. / แสดงขั้นตอนการอนุมัติ ตารางรายการ ประวัติการดำเนินการ และปุ่มดำเนินการ</span></li>
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {[
                  { btn: 'Verify & Pass to AP',       who: 'PM',         color: 'emerald', desc: 'Step 1: when status is "Pending PM"' },
                  { btn: 'Verify & Pass to GM',        who: 'AccountPay', color: 'blue',    desc: 'Step 2: when status is "Pending AP"' },
                  { btn: 'Reject Back to SiteAdmin',   who: 'AccountPay', color: 'rose',    desc: 'SiteAdmin must create a new PCC' },
                  { btn: 'Approve Payment / อนุมัติ',  who: 'GM / MD',    color: 'emerald', desc: 'Final approval. PCC becomes "Approved"' },
                  { btn: 'Reject / ปฏิเสธ',            who: 'GM / MD',    color: 'rose',    desc: 'Step 3 rejection. SiteAdmin creates new PCC' },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <Badge color={b.color}>{b.btn}</Badge>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">{b.who}</span>
                      <span className="text-slate-400"> — {b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion title="Print Documents / พิมพ์เอกสาร" titleTh="พิมพ์ PCR และ PCC เป็น PDF ขนาด A4">
            <div className="flex flex-col gap-3 text-sm text-slate-700">
              <p>Visible to: All roles / ทุกบทบาท</p>
              <ul className="flex flex-col gap-2">
                <li className="flex gap-2"><FileText size={14} className="text-blue-500 shrink-0 mt-0.5" /><span><strong>PCR Tab:</strong> Lists all PCR records. Click "Preview & Print" to open full-screen A4 preview with project info, financial summary, related PCCs, and signature block. / แสดงรายการ PCR ทั้งหมด กด "Preview & Print" เพื่อเปิดหน้าต่างแสดงตัวอย่าง A4 พร้อมข้อมูลโครงการ สรุปการเงิน PCC ที่เกี่ยวข้อง และช่องลายเซ็น</span></li>
                <li className="flex gap-2"><Receipt size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>PCC Tab:</strong> Lists all PCC records. Preview shows line items table, approval workflow steps visual, and 4-column signature block. / แสดงรายการ PCC ทั้งหมด ตัวอย่างแสดงตารางรายการ ขั้นตอนการอนุมัติ และช่องลายเซ็น 4 คอลัมน์</span></li>
                <li className="flex gap-2"><Printer size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Save as PDF:</strong> Click "Print / พิมพ์ / Save as PDF" in the preview toolbar → browser's print dialog opens → choose "Save as PDF" as the destination. / กด "Print" ในแถบเครื่องมือ → กล่องโต้ตอบการพิมพ์เปิดขึ้น → เลือก "Save as PDF" เป็นปลายทาง</span></li>
              </ul>
            </div>
          </Accordion>

          <Accordion title="Switch User (Demo) / เปลี่ยนผู้ใช้ (สาธิต)" titleTh="ทดสอบมุมมองตามบทบาท">
            <div className="text-sm text-slate-700 flex flex-col gap-2">
              <p>Click the <strong>user badge</strong> in the top-right corner to switch between demo users. The interface, visible nav items, and available action buttons all change based on the selected user's role. / คลิก <strong>ป้ายชื่อผู้ใช้</strong> ที่มุมบนขวาเพื่อเปลี่ยนระหว่างผู้ใช้ตัวอย่าง อินเทอร์เฟซ เมนูนำทาง และปุ่มดำเนินการทั้งหมดจะเปลี่ยนตามบทบาทของผู้ใช้ที่เลือก</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {[
                  { name: 'Robert Chen', role: 'MD', color: 'purple' },
                  { name: 'Sarah Williams', role: 'GM', color: 'blue' },
                  { name: 'James Tran', role: 'PM', color: 'emerald' },
                  { name: 'David Park', role: 'AccountPay', color: 'amber' },
                  { name: 'Maria Santos', role: 'SiteAdmin', color: 'orange' },
                  { name: 'Tom Bradley', role: 'CM', color: 'slate' },
                ].map((u) => (
                  <div key={u.name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{u.name}</p>
                      <Badge color={u.color}>{u.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion title="Notification Bell / กระดิ่งแจ้งเตือน" titleTh="จำนวนรายการที่รอดำเนินการ">
            <div className="text-sm text-slate-700">
              <p>The red badge count on the bell icon <strong>automatically counts items pending your action</strong> based on your role: / จำนวนป้ายสีแดงบนไอคอนกระดิ่งนับรายการที่รอการดำเนินการตามบทบาทของคุณ:</p>
              <ul className="flex flex-col gap-1.5 mt-3">
                <li className="flex gap-2"><Badge color="purple">MD / GM</Badge><span className="text-xs text-slate-600">Counts PCRs with "Pending GM" + PCCs with "Pending GM" / นับ PCR ที่รอ GM + PCC ที่รอ GM</span></li>
                <li className="flex gap-2"><Badge color="emerald">PM</Badge><span className="text-xs text-slate-600">Counts PCCs with "Pending PM" assigned to PM's projects / นับ PCC ที่รอ PM ตรวจสอบ</span></li>
                <li className="flex gap-2"><Badge color="amber">AccountPay</Badge><span className="text-xs text-slate-600">Counts PCRs with "Approved" (awaiting fund transfer) + PCCs with "Pending AP" / นับ PCR ที่อนุมัติแล้ว + PCC ที่รอ AP</span></li>
                <li className="flex gap-2"><Badge color="orange">SiteAdmin</Badge><span className="text-xs text-slate-600">Counts own PCCs that were "AP Rejected" (need to be recreated) / นับ PCC ของตนที่ AP ปฏิเสธ (ต้องสร้างใหม่)</span></li>
              </ul>
            </div>
          </Accordion>

        </div>
      )}
    </div>
  );
}
