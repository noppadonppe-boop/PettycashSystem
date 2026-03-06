import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileText, Receipt, Printer, HelpCircle,
  ChevronDown, Building2, Menu, X, LogOut, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { cn } from '../lib/utils';
import { ROLES } from '../data/mockData';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    labelTh: 'แดชบอร์ด',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [ROLES.MD, ROLES.GM, ROLES.AccountPay],
  },
  {
    label: 'Projects',
    labelTh: 'โครงการ',
    icon: FolderOpen,
    path: '/projects',
    roles: [ROLES.MD, ROLES.GM, ROLES.PM, ROLES.CM, ROLES.AccountPay],
  },
  {
    label: 'PCR Management',
    labelTh: 'จัดการ PCR',
    icon: FileText,
    path: '/pcr',
    roles: [ROLES.MD, ROLES.GM, ROLES.PM, ROLES.AccountPay],
  },
  {
    label: 'PCC Management',
    labelTh: 'จัดการ PCC',
    icon: Receipt,
    path: '/pcc',
    roles: [ROLES.MD, ROLES.GM, ROLES.PM, ROLES.AccountPay, ROLES.SiteAdmin],
  },
  {
    label: 'Print Documents',
    labelTh: 'พิมพ์เอกสาร',
    icon: Printer,
    path: '/print',
    roles: [ROLES.MD, ROLES.GM, ROLES.PM, ROLES.AccountPay, ROLES.SiteAdmin, ROLES.CM],
  },
  {
    label: 'System Guide',
    labelTh: 'คู่มือการใช้งาน',
    icon: HelpCircle,
    path: '/help',
    roles: [ROLES.MD, ROLES.GM, ROLES.PM, ROLES.AccountPay, ROLES.SiteAdmin, ROLES.CM],
  },
];

function RoleColor(role) {
  const map = {
    MD: 'bg-purple-100 text-purple-800',
    GM: 'bg-blue-100 text-blue-800',
    PM: 'bg-emerald-100 text-emerald-800',
    AccountPay: 'bg-amber-100 text-amber-800',
    SiteAdmin: 'bg-orange-100 text-orange-800',
    CM: 'bg-slate-100 text-slate-700',
  };
  return map[role] || 'bg-slate-100 text-slate-700';
}

export function MainLayout({ children }) {
  const { currentUser, switchUser, USERS } = useAuth();
  const { pcrs, pccs } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(currentUser?.role));

  // Notification count
  const pendingActions = (() => {
    let count = 0;
    if (currentUser?.role === ROLES.GM || currentUser?.role === ROLES.MD) {
      count += pcrs.filter((p) => p.status === 'Pending GM').length;
      count += pccs.filter((p) => p.status === 'Pending GM').length;
    }
    if (currentUser?.role === ROLES.PM) {
      count += pccs.filter((p) => p.status === 'Pending PM').length;
    }
    if (currentUser?.role === ROLES.AccountPay) {
      count += pcrs.filter((p) => p.status === 'Approved').length;
      count += pccs.filter((p) => p.status === 'Pending AP').length;
    }
    if (currentUser?.role === ROLES.SiteAdmin) {
      count += pccs.filter((p) => p.status === 'AP Rejected' && p.createdBy === currentUser.id).length;
    }
    return count;
  })();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700 h-16">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight">CMG</p>
              <p className="text-[10px] text-slate-400 leading-tight">Petty Cash System / ระบบเงินสดย่อย</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && (
                <span className="truncate">
                  {item.label}
                  <span className="block text-[10px] font-normal opacity-70 leading-tight">{item.labelTh}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom toggle */}
        <div className="border-t border-slate-700 p-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-slate-800">
              CMG Petty Cash Management System
              <span className="ml-2 text-xs font-normal text-slate-500">ระบบจัดการเงินสดย่อย</span>
            </h1>
            <p className="text-xs text-slate-400">Construction Management Group / กลุ่มบริหารการก่อสร้าง</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                <Bell size={18} />
              </button>
              {pendingActions > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingActions}
                </span>
              )}
            </div>

            {/* User switcher */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser?.avatar}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.name}</p>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', RoleColor(currentUser?.role))}>
                    {currentUser?.role}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch User / เปลี่ยนผู้ใช้ (ทดสอบ)</p>
                    </div>
                    {USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUser(user.id);
                          setUserDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer',
                          currentUser?.id === user.id && 'bg-blue-50'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', RoleColor(user.role))}>
                            {user.role}
                          </span>
                        </div>
                        {currentUser?.id === user.id && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
