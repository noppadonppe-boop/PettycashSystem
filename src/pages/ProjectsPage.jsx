import { useState } from 'react';
import { Plus, MapPin, Calendar, User, Eye, Edit2, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ROLES, USERS } from '../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const emptyForm = {
  name: '', location: '', pmId: '', cmId: '', startDate: '', finishDate: '', note: '',
};

function ProjectForm({ initial, onSubmit, onClose, title }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});
  const pms = USERS.filter((u) => u.role === ROLES.PM);
  const cms = USERS.filter((u) => u.role === ROLES.CM);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.pmId) e.pmId = 'PM assignment is required';
    if (!form.cmId) e.cmId = 'CM assignment is required';
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
        <Select label="Assign Project Manager (PM) / มอบหมาย PM" id="pmId" required value={form.pmId} onChange={set('pmId')} error={errors.pmId}>
          <option value="">-- Select PM --</option>
          {pms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select label="Assign Construction Manager (CM) / มอบหมาย CM" id="cmId" required value={form.cmId} onChange={set('cmId')} error={errors.cmId}>
          <option value="">-- Select CM --</option>
          {cms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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

export function ProjectsPage() {
  const { currentUser, hasRole } = useAuth();
  const { projects, createProject, updateProject, getPcrsByProject } = useData();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const navigate = useNavigate();

  const canCreate = hasRole(ROLES.GM, ROLES.MD);

  const visibleProjects = hasRole(ROLES.CM)
    ? projects.filter((p) => p.cmId === currentUser.id)
    : hasRole(ROLES.PM)
    ? projects.filter((p) => p.pmId === currentUser.id)
    : projects;

  const getUserName = (id) => USERS.find((u) => u.id === id)?.name || '-';

  const handleCreate = (form) => {
    createProject(form, currentUser.id);
    setShowCreate(false);
  };

  const handleEdit = (form) => {
    updateProject(editProject.id, form);
    setEditProject(null);
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
                    <p className="text-xs font-mono text-blue-600 font-medium">{proj.id}</p>
                    <h3 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{proj.name}</h3>
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
