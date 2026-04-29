import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileText, Receipt, Printer, HelpCircle,
  ChevronDown, Building2, Menu, X, LogOut, Bell, UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { logout } from '../auth/authService';
import { updateUserProfile } from '../auth/userProfileStore';
// User management is rendered inside Dashboard (not a modal)

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    labelTh: 'แดชบอร์ด',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['MD', 'GM', 'AccountPay'],
  },
  {
    label: 'Projects',
    labelTh: 'โครงการ',
    icon: FolderOpen,
    path: '/projects',
    roles: ['MD', 'GM', 'PM', 'CM', 'AccountPay'],
  },
  {
    label: 'PCR Management',
    labelTh: 'จัดการ PCR',
    icon: FileText,
    path: '/pcr',
    roles: ['MD', 'GM', 'PM', 'AccountPay'],
  },
  {
    label: 'PCC Management',
    labelTh: 'จัดการ PCC',
    icon: Receipt,
    path: '/pcc',
    roles: ['MD', 'GM', 'PM', 'AccountPay', 'SiteAdmin'],
  },
  {
    label: 'Print Documents',
    labelTh: 'พิมพ์เอกสาร',
    icon: Printer,
    path: '/print',
    roles: ['MD', 'GM', 'PM', 'AccountPay', 'SiteAdmin', 'CM'],
  },
  {
    label: 'System Guide',
    labelTh: 'คู่มือการใช้งาน',
    icon: HelpCircle,
    path: '/help',
    roles: ['MD', 'GM', 'PM', 'AccountPay', 'SiteAdmin', 'CM'],
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
    MasterAdmin: 'bg-fuchsia-100 text-fuchsia-800',
  };
  return map[role] || 'bg-slate-100 text-slate-700';
}

export function MainLayout({ children }) {
  const { currentUser, userProfile, firebaseUser, hasRole, refreshProfile } = useAuth();
  const { pcrs, pccs } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => hasRole(...item.roles)),
    [hasRole]
  );

  const displayName = userProfile
    ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ') || userProfile.email
    : '';
  const displayRoles = userProfile?.roles?.length ? userProfile.roles.join(', ') : '';
  const photoUrl = userProfile?.photoURL || firebaseUser?.photoURL;

  // Notification count
  const pendingActions = (() => {
    let count = 0;
    if (currentUser?.role === 'GM' || currentUser?.role === 'MD') {
      count += pcrs.filter((p) => p.status === 'Pending GM').length;
      count += pccs.filter((p) => p.status === 'Pending GM').length;
    }
    if (currentUser?.role === 'PM') {
      count += pccs.filter((p) => p.status === 'Pending PM').length;
    }
    if (currentUser?.role === 'AccountPay') {
      count += pcrs.filter((p) => p.status === 'Approved').length;
      count += pccs.filter((p) => p.status === 'Pending AP').length;
    }
    if (currentUser?.role === 'SiteAdmin') {
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

        {/* Sidebar user profile (top) */}
        <div className="px-3 py-3 border-b border-slate-700">
          <button
            onClick={() => setProfileModalOpen(true)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-800 transition-colors cursor-pointer',
              !sidebarOpen && 'justify-center px-2'
            )}
            title="Profile"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-slate-600 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {currentUser?.avatar}
              </div>
            )}
            {sidebarOpen && (
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">{displayName || '-'}</p>
                <p className="text-[10px] text-slate-300 leading-tight truncate">{displayRoles || '-'}</p>
              </div>
            )}
          </button>
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
          {/* MasterAdmin-only user management (bottom-left) */}
          {hasRole('MasterAdmin') && (
            <button
              onClick={() => navigate('/dashboard?view=users')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 mx-0 rounded-lg text-sm font-medium transition-all text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer mb-2',
                !sidebarOpen && 'justify-center px-2'
              )}
              title="จัดการ User"
            >
              <UserCog size={18} className="shrink-0" />
              {sidebarOpen && <span>จัดการ User</span>}
            </button>
          )}
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
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate whitespace-nowrap">
              CMG Petty Cash Management System
              <span className="ml-2 text-xs font-normal text-slate-500">ระบบจัดการเงินสดย่อย • Construction Management Group / กลุ่มบริหารการก่อสร้าง</span>
            </h1>
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
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {currentUser?.avatar}
                  </div>
                )}
                <div className="text-left hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[180px]">{displayName || currentUser?.name}</p>
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
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-800">Update Profile / อัปเดตโปรไฟล์</span>
                    </button>
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        navigate('/login', { replace: true });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100"
                    >
                      <LogOut size={16} className="text-rose-600" />
                      <span className="text-sm font-medium text-rose-700">Logout</span>
                    </button>
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

      {/* Profile update modal */}
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profile / โปรไฟล์" size="sm">
        <ProfileModalContent
          initial={{
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            position: userProfile?.position || '',
            photoURL: userProfile?.photoURL || '',
          }}
          onClose={() => setProfileModalOpen(false)}
          onSave={async (form) => {
            if (!firebaseUser) return;
            await updateUserProfile(firebaseUser.uid, {
              firstName: form.firstName,
              lastName: form.lastName,
              position: form.position,
              photoURL: form.photoURL || undefined,
            });
            await refreshProfile();
            setProfileModalOpen(false);
          }}
          onLogout={async () => {
            await logout();
            setProfileModalOpen(false);
            navigate('/login', { replace: true });
          }}
        />
      </Modal>

    </div>
  );
}

function ProfileModalContent({ initial, onClose, onSave, onLogout }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="p-6 flex flex-col gap-4">
      <Input label="First name / ชื่อ" id="pf_first" value={form.firstName} onChange={set('firstName')} />
      <Input label="Last name / นามสกุล" id="pf_last" value={form.lastName} onChange={set('lastName')} />
      <Input label="Position / ตำแหน่ง" id="pf_pos" value={form.position} onChange={set('position')} />
      <Input label="Photo URL (Google Sheet) / รูปโปรไฟล์" id="pf_photo" value={form.photoURL} onChange={set('photoURL')} placeholder="https://..." />
      <div className="flex justify-between gap-3 pt-2 border-t border-slate-100">
        <Button variant="danger" onClick={onLogout}>
          <LogOut size={16} /> Logout
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </div>
      </div>
    </div>
  );
}
