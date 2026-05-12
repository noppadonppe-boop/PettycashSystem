import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/SafeFirebaseContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { usersColRef } from '../auth/firestorePaths';
import { PrintPreviewModal } from './PrintPage';

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

export function AAAPage() {
  const { projects, pccs, updatePccStatus } = useData();
  const users = useUsers();
  
  // Set first project as default active tab
  const [activeTab, setActiveTab] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleToggleRecord = (pccId, recorded) => {
    updatePccStatus(pccId, { recorded });
  };

  useEffect(() => {
    if (projects.length > 0 && !activeTab) {
      setActiveTab(projects[0].id);
    }
  }, [projects, activeTab]);

  const activeProject = projects.find(p => p.id === activeTab);

  const filteredPccs = useMemo(() => {
    if (!activeTab) return [];
    return pccs.filter(pcc => (pcc.relatedProjectId || pcc.projectId) === activeTab)
               .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [pccs, activeTab]);

  // Calculate totals
  const totals = filteredPccs.reduce((acc, pcc) => {
    acc.totalAmount += (pcc.totalAmount || 0);
    return acc;
  }, { totalAmount: 0 });

  return (
    <div className="flex flex-col h-full bg-slate-50 gap-3">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ตาราง แยกแต่ละโครงการ</h1>
          <p className="text-xs text-slate-500 mt-0.5">สรุปค่าใช้จ่ายตามโครงการ / Expense Summary by Project</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-slate-50/50">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setActiveTab(project.id)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === project.id
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex justify-center items-start">
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white w-full max-w-5xl shadow-sm">
            {/* Table title with pink background to match screenshot loosely */}
            <div className="bg-fuchsia-300 text-center py-2 border-b border-slate-200">
              <span className="font-bold text-sm uppercase tracking-wider text-slate-900">{activeProject?.name || 'PROJECT'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] sm:text-[13px]">
                <thead>
                  <tr className="bg-fuchsia-200 border-b border-slate-200">
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 w-12">ลำดับ</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">เลขที่เอกสาร</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">ผู้เบิกเงิน</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">วันที่</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">ก่อน VAT</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 w-16">VAT</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 w-24">หัก ณ ที่จ่าย</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">รวมเงิน</th>
                    <th className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-800 whitespace-nowrap w-20">บันทึกแล้ว</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPccs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">
                        ไม่มีข้อมูล / No data available
                      </td>
                    </tr>
                  ) : (
                    filteredPccs.map((pcc, idx) => (
                      <tr 
                        key={pcc.id} 
                        className={`border-b border-slate-100 transition-colors ${
                          pcc.recorded ? 'bg-emerald-100/60 hover:bg-emerald-100/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-2 sm:px-3 py-1.5 text-center text-slate-700 font-medium border-r border-slate-100">{idx + 1}</td>
                        <td className="px-2 sm:px-3 py-1.5 text-center text-slate-700 font-mono text-[11px] border-r border-slate-100">
                          <button 
                            onClick={() => setPreviewDoc({ type: 'pcc', id: pcc.id, data: pcc })}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold"
                          >
                            {pcc.id}
                          </button>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 text-left text-slate-700 border-r border-slate-100 truncate max-w-[150px]">{getUserName(users, pcc.createdBy)}</td>
                        <td className="px-2 sm:px-3 py-1.5 text-center text-slate-700 border-r border-slate-100">{formatDate(pcc.date)}</td>
                        <td className="px-2 sm:px-3 py-1.5 text-right text-slate-700 border-r border-slate-100">{formatCurrency(pcc.totalAmount || 0)}</td>
                        <td className="px-2 sm:px-3 py-1.5 text-center text-slate-400 border-r border-slate-100">-</td>
                        <td className="px-2 sm:px-3 py-1.5 text-center text-slate-400 border-r border-slate-100">-</td>
                        <td className="px-2 sm:px-3 py-1.5 text-right font-semibold text-slate-800 bg-rose-50/50 border-r border-slate-100">{formatCurrency(pcc.totalAmount || 0)}</td>
                        <td className="px-2 sm:px-3 py-1.5 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            checked={!!pcc.recorded}
                            onChange={(e) => handleToggleRecord(pcc.id, e.target.checked)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredPccs.length > 0 && (
                  <tfoot>
                    <tr className="bg-yellow-300 border-t-2 border-slate-300">
                      <td colSpan={4} className="px-2 sm:px-3 py-1.5 text-right font-bold text-slate-900 border-r border-slate-300">รวมทั้งหมด</td>
                      <td className="px-2 sm:px-3 py-1.5 text-right font-bold text-slate-900 border-r border-slate-300">{formatCurrency(totals.totalAmount)}</td>
                      <td className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-900 border-r border-slate-300">-</td>
                      <td className="px-2 sm:px-3 py-1.5 text-center font-bold text-slate-900 border-r border-slate-300">-</td>
                      <td className="px-2 sm:px-3 py-1.5 text-right font-bold text-slate-900 border-r border-slate-300">{formatCurrency(totals.totalAmount)}</td>
                      <td className="px-2 sm:px-3 py-1.5"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Print Preview Modal */}
      {previewDoc && (
        <PrintPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
