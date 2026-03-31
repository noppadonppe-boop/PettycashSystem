import { createContext, useContext, useState, useCallback } from 'react';
import {
  PCR_STATUS,
  PCC_STATUS,
} from '../data/constants.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [pcrs, setPcrs] = useState([]);
  const [pccs, setPccs] = useState([]);
  const [pccItems, setPccItems] = useState([]);

  // ─── Derived helpers ─────────────────────────────────────────────────────────

  const getPcrsByProject = useCallback(
    (projectId) => pcrs.filter((p) => p.projectId === projectId),
    [pcrs]
  );

  const getPccsByPcr = useCallback(
    (pcrId) => pccs.filter((p) => p.pcrId === pcrId),
    [pccs]
  );

  const getItemsByPcc = useCallback(
    (pccId) => pccItems.filter((i) => i.pccId === pccId),
    [pccItems]
  );

  const getPcrById = useCallback((id) => pcrs.find((p) => p.id === id), [pcrs]);
  const getPccById = useCallback((id) => pccs.find((p) => p.id === id), [pccs]);
  const getProjectById = useCallback((id) => projects.find((p) => p.id === id), [projects]);

  // Remaining balance = PCR amount - sum of (Pending + Approved) PCCs
  const getPcrRemainingBalance = useCallback(
    (pcrId) => {
      const pcr = getPcrById(pcrId);
      if (!pcr) return 0;
      const consumed = pccs
        .filter(
          (p) =>
            p.pcrId === pcrId &&
            p.status !== PCC_STATUS.AP_REJECTED &&
            p.status !== PCC_STATUS.GM_REJECTED
        )
        .reduce((sum, p) => sum + p.totalAmount, 0);
      return pcr.amount - consumed;
    },
    [pcrs, pccs, getPcrById]
  );

  const getPcrApprovedSpend = useCallback(
    (pcrId) =>
      pccs
        .filter((p) => p.pcrId === pcrId && p.status === PCC_STATUS.APPROVED)
        .reduce((sum, p) => sum + p.totalAmount, 0),
    [pccs]
  );

  // ─── Project CRUD ─────────────────────────────────────────────────────────────

  const createProject = useCallback(
    (data, createdBy) => {
      const year = new Date().getFullYear();
      const existingNums = projects
        .map((p) => parseInt(p.id.split('-').pop(), 10))
        .filter((n) => !isNaN(n));
      const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      const id = `PRJ-${year}-J-${String(next).padStart(3, '0')}`;
      const project = { ...data, id, createdBy, createdAt: new Date().toISOString().slice(0, 10) };
      setProjects((prev) => [...prev, project]);
      return project;
    },
    [projects]
  );

  const updateProject = useCallback((id, data) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  // ─── PCR CRUD & Workflow ──────────────────────────────────────────────────────

  const createPcr = useCallback(
    (data, createdBy) => {
      const projectPcrs = pcrs.filter((p) => p.projectId === data.projectId);
      const next = projectPcrs.length + 1;
      const projSeq = data.projectId.split('-').pop();
      const id = `PCR-J-${projSeq}-${String(next).padStart(4, '0')}`;
      const pcr = {
        ...data,
        id,
        status: PCR_STATUS.PENDING_GM,
        rejectNote: '',
        createdBy,
        approvedBy: null,
        approvedAt: null,
        acknowledgedBy: null,
        acknowledgedAt: null,
        closureRequestedBy: null,
        closureRequestedAt: null,
        closureNote: '',
        closureConfirmedBy: null,
        closureConfirmedAt: null,
        closureConfirmNote: '',
        closedBy: null,
        closedAt: null,
      };
      setPcrs((prev) => [...prev, pcr]);
      return pcr;
    },
    [pcrs]
  );

  const updatePcrStatus = useCallback((id, updates) => {
    setPcrs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const approvePcr = useCallback(
    (id, userId) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.APPROVED,
        approvedBy: userId,
        approvedAt: new Date().toISOString().slice(0, 10),
        rejectNote: '',
      }),
    [updatePcrStatus]
  );

  const rejectPcr = useCallback(
    (id, userId, rejectNote) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.GM_REJECTED,
        rejectNote,
      }),
    [updatePcrStatus]
  );

  const resubmitPcr = useCallback(
    (id, data) =>
      updatePcrStatus(id, {
        ...data,
        status: PCR_STATUS.PENDING_GM,
        rejectNote: '',
      }),
    [updatePcrStatus]
  );

  const acknowledgePcr = useCallback(
    (id, userId) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.ACKNOWLEDGED,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString().slice(0, 10),
      }),
    [updatePcrStatus]
  );

  const requestClosePcr = useCallback(
    (id, userId, closureNote) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.CLOSURE_REQUESTED,
        closureRequestedBy: userId,
        closureRequestedAt: new Date().toISOString().slice(0, 10),
        closureNote,
      }),
    [updatePcrStatus]
  );

  const confirmClosurePcr = useCallback(
    (id, userId, note) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.CLOSURE_CONFIRMED,
        closureConfirmedBy: userId,
        closureConfirmedAt: new Date().toISOString().slice(0, 10),
        closureConfirmNote: note,
      }),
    [updatePcrStatus]
  );

  const officiallyClosePcr = useCallback(
    (id, userId) =>
      updatePcrStatus(id, {
        status: PCR_STATUS.CLOSED,
        closedBy: userId,
        closedAt: new Date().toISOString().slice(0, 10),
      }),
    [updatePcrStatus]
  );

  // ─── PCC CRUD & Workflow ──────────────────────────────────────────────────────

  const createPcc = useCallback(
    (data, items, createdBy) => {
      const pcrPccs = pccs.filter((p) => p.pcrId === data.pcrId);
      const next = pcrPccs.length + 1;
      const id = `${data.pcrId}-PCC-${String(next).padStart(3, '0')}`;
      const totalAmount = items.reduce((s, i) => s + Number(i.amount), 0);
      const pcc = {
        ...data,
        id,
        totalAmount,
        status: PCC_STATUS.PENDING_PM,
        rejectNote: '',
        createdBy,
        verifiedByPM: null,
        verifiedByPMAt: null,
        verifiedByAP: null,
        verifiedByAPAt: null,
        approvedByGM: null,
        approvedByGMAt: null,
      };
      setPccs((prev) => [...prev, pcc]);
      const newItems = items.map((item, idx) => ({
        ...item,
        id: `ITEM-${Date.now()}-${idx}`,
        pccId: id,
        amount: Number(item.amount),
      }));
      setPccItems((prev) => [...prev, ...newItems]);
      return pcc;
    },
    [pccs]
  );

  const updatePccStatus = useCallback((id, updates) => {
    setPccs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const pmVerifyPcc = useCallback(
    (id, userId) =>
      updatePccStatus(id, {
        status: PCC_STATUS.PENDING_AP,
        verifiedByPM: userId,
        verifiedByPMAt: new Date().toISOString().slice(0, 10),
      }),
    [updatePccStatus]
  );

  const apVerifyPcc = useCallback(
    (id, userId) =>
      updatePccStatus(id, {
        status: PCC_STATUS.PENDING_GM,
        verifiedByAP: userId,
        verifiedByAPAt: new Date().toISOString().slice(0, 10),
        rejectNote: '',
      }),
    [updatePccStatus]
  );

  const apRejectPcc = useCallback(
    (id, userId, rejectNote) =>
      updatePccStatus(id, {
        status: PCC_STATUS.AP_REJECTED,
        rejectNote,
      }),
    [updatePccStatus]
  );

  const gmApprovePcc = useCallback(
    (id, userId) =>
      updatePccStatus(id, {
        status: PCC_STATUS.APPROVED,
        approvedByGM: userId,
        approvedByGMAt: new Date().toISOString().slice(0, 10),
        rejectNote: '',
      }),
    [updatePccStatus]
  );

  const gmRejectPcc = useCallback(
    (id, userId, rejectNote) =>
      updatePccStatus(id, {
        status: PCC_STATUS.GM_REJECTED,
        rejectNote,
      }),
    [updatePccStatus]
  );

  const resubmitPcc = useCallback(
    (id, items) => {
      const totalAmount = items.reduce((s, i) => s + Number(i.amount), 0);
      updatePccStatus(id, {
        status: PCC_STATUS.PENDING_PM,
        totalAmount,
        rejectNote: '',
        verifiedByAP: null,
        verifiedByAPAt: null,
        approvedByGM: null,
        approvedByGMAt: null,
      });
      setPccItems((prev) => {
        const filtered = prev.filter((i) => i.pccId !== id);
        const newItems = items.map((item, idx) => ({
          ...item,
          id: `ITEM-${Date.now()}-${idx}`,
          pccId: id,
          amount: Number(item.amount),
        }));
        return [...filtered, ...newItems];
      });
    },
    [updatePccStatus]
  );

  // ─── Dashboard helpers ────────────────────────────────────────────────────────

  const getTotalOutstandingCash = useCallback(() => {
    return pcrs
      .filter((p) => p.status === PCR_STATUS.ACKNOWLEDGED)
      .reduce((sum, pcr) => {
        const approved = getPcrApprovedSpend(pcr.id);
        return sum + (pcr.amount - approved);
      }, 0);
  }, [pcrs, getPcrApprovedSpend]);

  const getUtilizationByProject = useCallback(() => {
    return projects.map((proj) => {
      const projPcrs = pcrs.filter((p) => p.projectId === proj.id);
      const totalApproved = projPcrs
        .filter((p) => [PCR_STATUS.APPROVED, PCR_STATUS.ACKNOWLEDGED, PCR_STATUS.CLOSED].includes(p.status))
        .reduce((s, p) => s + p.amount, 0);
      const totalClaimed = projPcrs.reduce((s, pcr) => s + getPcrApprovedSpend(pcr.id), 0);
      return {
        name: proj.name.length > 20 ? proj.name.slice(0, 18) + '…' : proj.name,
        fullName: proj.name,
        approved: totalApproved,
        claimed: totalClaimed,
      };
    });
  }, [projects, pcrs, getPcrApprovedSpend]);

  const getAgingAlerts = useCallback(() => {
    const today = new Date();
    return pcrs.filter(
      (p) =>
        p.status === PCR_STATUS.ACKNOWLEDGED &&
        p.dueDate &&
        new Date(p.dueDate) < today
    );
  }, [pcrs]);

  return (
    <DataContext.Provider
      value={{
        projects,
        pcrs,
        pccs,
        pccItems,
        // Getters
        getPcrsByProject,
        getPccsByPcr,
        getItemsByPcc,
        getPcrById,
        getPccById,
        getProjectById,
        getPcrRemainingBalance,
        getPcrApprovedSpend,
        // Project actions
        createProject,
        updateProject,
        // PCR actions
        createPcr,
        approvePcr,
        rejectPcr,
        resubmitPcr,
        acknowledgePcr,
        requestClosePcr,
        confirmClosurePcr,
        officiallyClosePcr,
        // PCC actions
        createPcc,
        pmVerifyPcc,
        apVerifyPcc,
        apRejectPcc,
        gmApprovePcc,
        gmRejectPcc,
        resubmitPcc,
        // Dashboard
        getTotalOutstandingCash,
        getUtilizationByProject,
        getAgingAlerts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
