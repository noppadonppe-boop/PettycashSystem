import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, AlertTriangle, TrendingUp, FileText, Receipt, FolderOpen, DatabaseZap, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { USERS, PCR_STATUS, PCC_STATUS } from '../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDate, isOverdue } from '../lib/utils';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { seedMockData, SEED_SUMMARY } from '../scripts/seedMockData';

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function SeedDataModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = useCallback(async () => {
    setLogs([]);
    setRunning(true);
    setDone(false);
    try {
      await seedMockData((msg) => setLogs((prev) => [...prev, msg]));
      setDone(true);
    } catch {
      // error already pushed by seedMockData
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <DatabaseZap size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Seed ข้อมูลตัวอย่าง</h3>
            <p className="text-xs text-slate-500">เขียนข้อมูล Mock เข้า Firestore เพื่อทดสอบระบบ</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 grid grid-cols-2 gap-y-1 gap-x-4">
          <span>📁 Projects</span><span className="text-right font-semibold text-slate-800">{SEED_SUMMARY.projects} รายการ</span>
          <span>📄 PCR</span><span className="text-right font-semibold text-slate-800">{SEED_SUMMARY.pcrs} รายการ</span>
          <span>🧾 PCC</span><span className="text-right font-semibold text-slate-800">{SEED_SUMMARY.pccs} รายการ</span>
          <span>📎 PCC Items</span><span className="text-right font-semibold text-slate-800">{SEED_SUMMARY.pccItems} รายการ</span>
        </div>

        {logs.length > 0 && (
          <div className="rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono p-3 max-h-44 overflow-y-auto flex flex-col gap-1">
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-1">
          {!done ? (
            <button
              onClick={handleSeed}
              disabled={running}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                running
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm'
              )}
            >
              {running ? (
                <><Loader2 size={15} className="animate-spin" /> กำลัง Seed…</>
              ) : (
                <><DatabaseZap size={15} /> เริ่ม Seed ข้อมูล</>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
            >
              <CheckCircle2 size={15} /> เสร็จสิ้น — ปิด
            </button>
          )}
          {!running && !done && (
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className={cn('border', c.border)}>
      <CardContent className="flex items-start gap-4 py-5">
        <div className={cn('p-3 rounded-xl', c.bg)}>
          <Icon size={22} className={c.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { currentUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const [showSeed, setShowSeed] = useState(false);
  const {
    projects, pcrs, pccs,
    getTotalOutstandingCash,
    getUtilizationByProject,
    getAgingAlerts,
    getPcrApprovedSpend,
    getPcrRemainingBalance,
  } = useData();

  const totalOutstanding = getTotalOutstandingCash();
  const utilizationData = getUtilizationByProject();
  const agingAlerts = getAgingAlerts();

  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const activePcrs = pcrs.filter((p) => p.status === PCR_STATUS.ACKNOWLEDGED).length;
    const pendingApprovals =
      pcrs.filter((p) => p.status === PCR_STATUS.PENDING_GM).length +
      pccs.filter((p) => p.status === PCC_STATUS.PENDING_GM).length;
    const approvedPccs = pccs.filter((p) => p.status === PCC_STATUS.APPROVED).length;
    const totalPccValue = pccs
      .filter((p) => p.status === PCC_STATUS.APPROVED)
      .reduce((s, p) => s + p.totalAmount, 0);
    return { totalProjects, activePcrs, pendingApprovals, approvedPccs, totalPccValue };
  }, [projects, pcrs, pccs]);

  // Ledger data
  const ledgerRows = useMemo(() => {
    const rows = [];
    pcrs.forEach((pcr) => {
      const proj = projects.find((p) => p.id === pcr.projectId);
      const pccList = pccs.filter((p) => p.pcrId === pcr.id);
      if (pccList.length === 0) {
        rows.push({
          projectId: pcr.projectId,
          projectName: proj?.name || '-',
          pcrId: pcr.id,
          pccId: '-',
          amount: pcr.amount,
          pccAmount: null,
          date: pcr.date,
          type: 'PCR',
          status: pcr.status,
        });
      } else {
        pccList.forEach((pcc) => {
          rows.push({
            projectId: pcr.projectId,
            projectName: proj?.name || '-',
            pcrId: pcr.id,
            pccId: pcc.id,
            amount: pcr.amount,
            pccAmount: pcc.totalAmount,
            date: pcc.date,
            type: 'PCC',
            status: pcc.status,
          });
        });
      }
    });
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [projects, pcrs, pccs]);

  // Pie chart for PCR statuses
  const pcrStatusData = useMemo(() => {
    const statusCounts = {};
    pcrs.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [pcrs]);

  if (view === 'users') {
    if (!hasRole('MasterAdmin')) {
      navigate('/dashboard', { replace: true });
      return null;
    }
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">จัดการ User <span className="text-base font-medium text-slate-500">/ User Management</span></h2>
            <p className="text-sm text-slate-500 mt-0.5">จัดการสถานะการอนุมัติ และกำหนดสิทธิ์ผู้ใช้งาน</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back</Button>
        </div>
        <UserManagementPanel />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {showSeed && <SeedDataModal onClose={() => setShowSeed(false)} />}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Executive Dashboard <span className="text-base font-medium text-slate-500">/ แดชบอร์ดผู้บริหาร</span></h2>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {currentUser?.name} — here's your financial overview. / ยินดีต้อนรับ {currentUser?.name} — ภาพรวมการเงินของคุณ</p>
        </div>
        {hasRole('MasterAdmin') && (
          <button
            onClick={() => setShowSeed(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <DatabaseZap size={14} /> Seed ข้อมูลตัวอย่าง
          </button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Outstanding Cash (Active PCRs) / เงินสดคงค้าง"
          value={formatCurrency(totalOutstanding)}
          sub="Cash held across all active PCR wallets / เงินสดทั้งหมดใน PCR ที่ใช้งานอยู่"
          color="blue"
        />
        <MetricCard
          icon={FolderOpen}
          label="Active Projects / โครงการที่ใช้งาน"
          value={metrics.totalProjects}
          sub={`${metrics.activePcrs} active PCR wallets / กระเป๋าเงิน PCR`}
          color="emerald"
        />
        <MetricCard
          icon={FileText}
          label="Pending Your Approval / รออนุมัติ"
          value={metrics.pendingApprovals}
          sub="PCRs + PCCs awaiting GM/MD action / รอดำเนินการ"
          color="amber"
        />
        <MetricCard
          icon={Receipt}
          label="Total Approved Claims / ยอดอนุมัติทั้งหมด"
          value={formatCurrency(metrics.totalPccValue)}
          sub={`${metrics.approvedPccs} PCC(s) fully approved / อนุมัติแล้ว`}
          color="purple"
        />
      </div>

      {/* Aging Alerts */}
      {agingAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <CardTitle className="text-amber-800">Aging Alerts – Overdue Active PCRs ({agingAlerts.length}) / การแจ้งเตือน PCR เกินกำหนด</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-700 uppercase">PCR ID</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-700 uppercase">Project / โครงการ</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-700 uppercase">Amount / จำนวนเงิน</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-700 uppercase">Due Date / วันครบกำหนด</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-700 uppercase">Remaining / คงเหลือ</th>
                    <th className="text-left py-2 text-xs font-semibold text-amber-700 uppercase">PM</th>
                  </tr>
                </thead>
                <tbody>
                  {agingAlerts.map((pcr) => {
                    const proj = projects.find((p) => p.id === pcr.projectId);
                    const remaining = getPcrRemainingBalance(pcr.id);
                    const pm = USERS.find((u) => u.id === proj?.pmId);
                    return (
                      <tr key={pcr.id} className="border-b border-amber-100 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs text-amber-800 font-semibold">{pcr.id}</td>
                        <td className="py-2 pr-4 text-slate-700">{proj?.name || '-'}</td>
                        <td className="py-2 pr-4 font-medium">{formatCurrency(pcr.amount)}</td>
                        <td className="py-2 pr-4 text-rose-600 font-semibold">{formatDate(pcr.dueDate)}</td>
                        <td className="py-2 pr-4 font-medium text-slate-700">{formatCurrency(remaining)}</td>
                        <td className="py-2 text-slate-600">{pm?.name || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Utilization bar chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <CardTitle>PCR Approved vs PCC Claimed by Project / PCR อนุมัติ vs PCC เบิกจ่าย รายโครงการ</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={utilizationData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="approved" name="PCR อนุมัติ" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="claimed" name="PCC เบิกจ่าย" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PCR Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>PCR Status Distribution / การกระจายสถานะ PCR</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pcrStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pcrStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {pcrStatusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-slate-600 truncate">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 shrink-0 ml-2">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <CardTitle>Master Ledger / บัญชีแยกประเภทหลัก</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / โครงการ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PCR No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PCC No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type / ประเภท</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PCR Amt / จำนวน PCR</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PCC Amt / จำนวน PCC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date / วันที่</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status / สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-slate-500">{row.projectId}</p>
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[160px]">{row.projectName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-blue-700 font-medium">{row.pcrId}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{row.pccId}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        row.type === 'PCR' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                      )}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {row.pccAmount != null ? formatCurrency(row.pccAmount) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.date)}</td>
                    <td className="px-4 py-3"><Badge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
