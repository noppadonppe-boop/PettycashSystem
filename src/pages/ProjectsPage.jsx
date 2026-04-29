import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, User, Eye, Edit2, FolderOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/SafeFirebaseContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { usersColRef } from '../auth/firestorePaths';

const emptyForm = {
  name: '', location: '', pmId: '', cmId: '', startDate: '', finishDate: '', note: '',
};

function ProjectForm({ initial, onSubmit, onClose, title }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);

  // Load users from Firebase
  useEffect(() => {
    const q = query(usersColRef(), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data());
      setUsers(list);
    }, () => {
      setUsers([]);
    });
    return () => unsub();
  }, []);

  // Filter users by role
  const pms = users.filter((u) => u.roles?.includes('PM'));
  const cms = users.filter((u) => u.roles?.includes('CM'));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    // PM and CM are now optional - removed required validation
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.finishDate) e.finishDate = 'Finish date is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit(form);
  };

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Project Name / ชื่อโครงการ" id="name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Sunrise Tower Complex" />
        </div>
        <div className="col-span-2">
          <Input label="Location / สถานที่" id="location" required value={form.location} onChange={set('location')} error={errors.location} placeholder="City, District / เมือง, อำเภอ" />
        </div>
        <Select label="Assign Project Manager (PM) / มอบหมาย PM (ไม่บังคับ)" id="pmId" value={form.pmId} onChange={set('pmId')} error={errors.pmId}>
          <option value="">-- Select PM --</option>
          {pms.map((u) => <option key={u.uid} value={u.uid}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</option>)}
        </Select>
        <Select label="Assign Construction Manager (CM) / มอบหมาย CM (ไม่บังคับ)" id="cmId" value={form.cmId} onChange={set('cmId')} error={errors.cmId}>
          <option value="">-- Select CM --</option>
          {cms.map((u) => <option key={u.uid} value={u.uid}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</option>)}
        </Select>
        <Input label="Start Date / วันเริ่มต้น" id="startDate" type="date" required value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input label="Finish Date / วันสิ้นสุด" id="finishDate" type="date" required value={form.finishDate} onChange={set('finishDate')} error={errors.finishDate} />
        <div className="col-span-2">
          <Textarea label="Notes / หมายเหตุ" id="note" value={form.note} onChange={set('note')} rows={3} placeholder="Project description or notes... / คำอธิบายโครงการหรือหมายเหตุ" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel / ยกเลิก</Button>
        <Button type="submit" variant="primary">
          <Plus size={15} /> {title}
        </Button>
      </div>
    </form>
  );
}

// Roles that should always see ALL data — not restricted to their own projects
const BROAD_VIEW_ROLES = ['MasterAdmin', 'MD', 'GM', 'AccountPay', 'ppeAdmin', 'ppeManager', 'ppeLeader', 'Requestors', 'Eng', 'SenEng', 'Arch', 'SenArch'];

export function ProjectsPage() {
  const { currentUser, hasRole, userProfile } = useAuth();
  const { projects, createProject, updateProject, deleteProject, getPcrsByProject } = useData();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Load users for displaying PM/CM names
  useEffect(() => {
    const q = query(usersColRef(), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data());
      setUsers(list);
    }, () => {
      setUsers([]);
    });
    return () => unsub();
  }, []);

  // Admins / upper-management see everything; PM/CM see only their own
  const isBroadView = userProfile?.roles?.some((r) => BROAD_VIEW_ROLES.includes(r)) ?? true;

  const canCreate = hasRole('GM', 'MD') || userProfile?.roles?.includes('MasterAdmin');
  const canDelete = hasRole('GM', 'MD') || userProfile?.roles?.includes('MasterAdmin');

  const visibleProjects = isBroadView
    ? projects
    : (userProfile?.assignedProjects?.length > 0)
    ? projects.filter((p) => userProfile.assignedProjects.includes(p.id))
    : hasRole('CM')
    ? projects.filter((p) => p.cmId === currentUser?.id)
    : hasRole('PM')
    ? projects.filter((p) => p.pmId === currentUser?.id)
    : projects;

  const getUserName = (id) => {
    if (!id) return '-';
    const u = users.find((user) => user.uid === id);
    return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : '-';
  };

  const handleCreate = (form) => {
    createProject(form, currentUser.id);
    setShowCreate(false);
  };

  const handleEdit = (form) => {
    updateProject(editProject.id, form);
    setEditProject(null);
  };

  const handleDelete = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะลบโครงการ "${projectName}" (${projectId})?\n\nการลบโครงการจะลบข้อมูลทั้งหมดที่เกี่ยวข้องและไม่สามารถเรียกคืนได้`
    );
    if (!confirmed) return;
    await deleteProject(projectId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Projects <span className="text-base font-medium text-slate-500">/ โครงการ</span></h2>
          <p className="text-sm text-slate-500 mt-0.5">{visibleProjects.length} project(s) found / พบ {visibleProjects.length} โครงการ</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project / โครงการใหม่
          </Button>
        )}
      </div>

      {/* Projects grid */}
      {visibleProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <FolderOpen size={40} />
            <p className="font-medium">No projects found / ไม่พบโครงการ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleProjects.map((proj) => {
            const pcrs = getPcrsByProject(proj.id);
            const activePcrs = pcrs.filter((p) => p.status === 'Acknowledged by AP').length;
            return (
              <Card key={proj.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{proj.name}</h3>
                  </div>
                  <span className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                    {activePcrs} Active PCR{activePcrs !== 1 ? 's' : ''}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{proj.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>PM / ผู้จัดการโครงการ: <span className="font-medium text-slate-700">{getUserName(proj.pmId)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>CM / ผู้จัดการก่อสร้าง: <span className="font-medium text-slate-700">{getUserName(proj.cmId)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDate(proj.startDate)} → {formatDate(proj.finishDate)}</span>
                    </div>
                  </div>
                  {proj.note && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 line-clamp-2">
                      {proj.note}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/pcr?project=${proj.id}`)}
                    >
                      <Eye size={13} /> View PCRs / ดู PCR
                    </Button>
                    {canCreate && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditProject(proj)}
                      >
                        <Edit2 size={13} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(proj.id, proj.name)}
                        title="Delete Project / ลบโครงการ"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project / สร้างโครงการใหม่" size="md">
        <ProjectForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} title="Create Project / สร้างโครงการ" />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title={`Edit Project – ${editProject?.id}`} size="md">
        {editProject && (
          <ProjectForm
            initial={editProject}
            onSubmit={handleEdit}
            onClose={() => setEditProject(null)}
            title="Save Changes"
          />
        )}
      </Modal>
    </div>
  );
}
