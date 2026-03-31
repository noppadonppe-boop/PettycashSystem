import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getProjects,
  getPcrs,
  getPccs,
  getPccItems,
  addProject,
  updateProject,
  addPcr,
  updatePcr,
  addPcc,
  updatePcc,
  addPccItem,
  updatePccItem,
  deletePccItem,
  initializeRootDocument
} from '../services/firebaseService.js';
import { PCR_STATUS, PCC_STATUS } from '../data/constants.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [pcrs, setPcrs] = useState([]);
  const [pccs, setPccs] = useState([]);
  const [pccItems, setPccItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Firebase and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add shorter timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.error('Firebase connection timeout');
          setError('Firebase connection timeout - switching to empty data');
          setProjects([]);
          setPcrs([]);
          setPccs([]);
          setPccItems([]);
          setLoading(false);
        }, 5000); // 5 second timeout
        
        await initializeRootDocument();
        
        // Load all data from Firebase with error handling for each
        const [projectsData, pcrsData, pccsData, pccItemsData] = await Promise.allSettled([
          getProjects(),
          getPcrs(),
          getPccs(),
          getPccItems()
        ]);
        
        // Clear timeout if successful
        clearTimeout(timeoutId);
        
        // Process results with fallback to empty arrays
        setProjects(projectsData.status === 'fulfilled' ? projectsData.value : []);
        setPcrs(pcrsData.status === 'fulfilled' ? pcrsData.value : []);
        setPccs(pccsData.status === 'fulfilled' ? pccsData.value : []);
        setPccItems(pccItemsData.status === 'fulfilled' ? pccItemsData.value : []);
        
        // Check if any failed
        const failures = [projectsData, pcrsData, pccsData, pccItemsData].filter(result => result.status === 'rejected');
        if (failures.length > 0) {
          console.warn('Some data failed to load:', failures);
          setError(`Partial data load - ${failures.length} collections failed`);
        } else {
          setError(null);
        }
        
      } catch (err) {
        console.error('Error initializing data:', err);
        setError(err.message);
        // Set empty data to prevent crashes
        setProjects([]);
        setPcrs([]);
        setPccs([]);
        setPccItems([]);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

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
    async (data, createdBy) => {
      try {
        const year = new Date().getFullYear();
        const existingNums = projects
          .map((p) => parseInt(p.id.split('-').pop(), 10))
          .filter((n) => !isNaN(n));
        const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        const id = `PRJ-${year}-J-${String(next).padStart(3, '0')}`;
        
        const project = { 
          ...data, 
          id, 
          createdBy, 
          createdAt: new Date().toISOString().slice(0, 10) 
        };
        
        await addProject(project);
        setProjects((prev) => [...prev, project]);
        return project;
      } catch (err) {
        console.error('Error creating project:', err);
        throw err;
      }
    },
    [projects]
  );

  const updateProjectData = useCallback(async (id, data) => {
    try {
      await updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  }, []);

  // ─── PCR CRUD & Workflow ──────────────────────────────────────────────────────

  const createPcr = useCallback(
    async (data, createdBy) => {
      try {
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
        
        await addPcr(pcr);
        setPcrs((prev) => [...prev, pcr]);
        return pcr;
      } catch (err) {
        console.error('Error creating PCR:', err);
        throw err;
      }
    },
    [pcrs]
  );

  const updatePcrStatus = useCallback(async (id, updates) => {
    try {
      await updatePcr(id, updates);
      setPcrs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    } catch (err) {
      console.error('Error updating PCR status:', err);
      throw err;
    }
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
    async (data, items, createdBy) => {
      try {
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
        
        await addPcc(pcc);
        setPccs((prev) => [...prev, pcc]);
        
        // Add PCC items
        const newItems = [];
        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const itemData = {
            ...item,
            id: `ITEM-${Date.now()}-${idx}`,
            pccId: id,
            amount: Number(item.amount),
          };
          await addPccItem(itemData);
          newItems.push(itemData);
        }
        
        setPccItems((prev) => [...prev, ...newItems]);
        return pcc;
      } catch (err) {
        console.error('Error creating PCC:', err);
        throw err;
      }
    },
    [pccs]
  );

  const updatePccStatus = useCallback(async (id, updates) => {
    try {
      await updatePcc(id, updates);
      setPccs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    } catch (err) {
      console.error('Error updating PCC status:', err);
      throw err;
    }
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
    async (id, items) => {
      try {
        const totalAmount = items.reduce((s, i) => s + Number(i.amount), 0);
        
        await updatePccStatus(id, {
          status: PCC_STATUS.PENDING_PM,
          totalAmount,
          rejectNote: '',
          verifiedByAP: null,
          verifiedByAPAt: null,
          approvedByGM: null,
          approvedByGMAt: null,
        });
        
        // Remove old items and add new ones
        const oldItems = pccItems.filter((i) => i.pccId === id);
        for (const oldItem of oldItems) {
          await deletePccItem(oldItem.id);
        }
        
        const newItems = [];
        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const itemData = {
            ...item,
            id: `ITEM-${Date.now()}-${idx}`,
            pccId: id,
            amount: Number(item.amount),
          };
          await addPccItem(itemData);
          newItems.push(itemData);
        }
        
        setPccItems((prev) => {
          const filtered = prev.filter((i) => i.pccId !== id);
          return [...filtered, ...newItems];
        });
      } catch (err) {
        console.error('Error resubmitting PCC:', err);
        throw err;
      }
    },
    [updatePccStatus, pccItems]
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

  // Show loading screen while initializing
  if (loading) {
    return (
      <DataContext.Provider value={{ loading: true, error: null, projects: [], pcrs: [], pccs: [], pccItems: [] }}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">กำลังโหลดข้อมูลจาก Firebase...</p>
            <p className="text-sm text-slate-400 mt-1">Loading data from Firebase...</p>
            <div className="mt-4 text-xs text-slate-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>เชื่อมต่อฐานข้อมูล</span>
              </div>
            </div>
          </div>
        </div>
      </DataContext.Provider>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Firebase Warning</strong><br/>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      <DataContext.Provider
        value={{
          projects,
          pcrs,
          pccs,
          pccItems,
          loading,
          error,
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
        updateProject: updateProjectData,
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
    </>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
