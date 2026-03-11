import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  initialProjects,
  initialPcrs,
  initialPccs,
  initialPccItems,
  PCR_STATUS,
  PCC_STATUS
} from '../data/mockData.js';
import { db as sharedDb, APP_NAME } from '../firebase/firebase';

const ROOT_COLLECTION = APP_NAME;
const ROOT_DOC = 'root';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects, setProjects] = useState(initialProjects);
  const [pcrs, setPcrs] = useState(initialPcrs);
  const [pccs, setPccs] = useState(initialPccs);
  const [pccItems, setPccItems] = useState(initialPccItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  // Each collection tracks its own "has-seen-firestore-data" flag independently
  const hasDataRef = useRef({ projects: false, pcrs: false, pccs: false, pccItems: false });
  const inFlightRef = useRef(new Set());
  const db = sharedDb;

  useEffect(() => {
    try {
      setFirebaseReady(true);
    } catch (err) {
      console.warn('Firebase initialization failed, using mock data:', err);
      setError('Firebase unavailable - using local data');
      setFirebaseReady(false);
    }
  }, []);

  const getSubcollection = (subcollectionName) => {
    return collection(db, ROOT_COLLECTION, ROOT_DOC, subcollectionName);
  };

  // Sort helper — sort by createdAt desc in JS to avoid needing a Firestore index
  const sortByCreatedAtDesc = (list) =>
    [...list].sort((a, b) => {
      const aVal = a.createdAt ?? '';
      const bVal = b.createdAt ?? '';
      if (bVal < aVal) return -1;
      if (bVal > aVal) return 1;
      return 0;
    });

  // Realtime subscriptions — no orderBy so no composite index required
  useEffect(() => {
    if (!firebaseReady) return;

    setLoading(true);
    const subs = [];

    const subCollection = (name, setter, mockFallback) => {
      const colRef = collection(db, ROOT_COLLECTION, ROOT_DOC, name);
      const unsub = onSnapshot(
        colRef,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (list.length > 0) {
            // Firestore has real data → use it (sorted in JS)
            hasDataRef.current[name] = true;
            setter(sortByCreatedAtDesc(list));
          } else if (!hasDataRef.current[name]) {
            // Firestore is empty AND we've never seen data → keep local mock
            setter(mockFallback);
          } else {
            // Firestore intentionally cleared → show empty
            setter([]);
          }
          setLoading(false);
        },
        (err) => {
          console.warn(`Realtime load failed for ${name}:`, err);
          setError(`Failed to load ${name} — using local data`);
          setLoading(false);
        }
      );
      subs.push(unsub);
    };

    subCollection('projects', setProjects, initialProjects);
    subCollection('pcrs', setPcrs, initialPcrs);
    subCollection('pccs', setPccs, initialPccs);
    subCollection('pccItems', setPccItems, initialPccItems);

    return () => subs.forEach((u) => u());
  }, [firebaseReady]);

  // Save to Firebase helper
  const saveToFirebase = async (collectionName, docId, data) => {
    if (!firebaseReady) {
      console.warn('Firebase not ready, data not saved');
      return false;
    }

    const key = `${collectionName}/${docId}`;
    if (inFlightRef.current.has(key)) {
      console.warn('Duplicate save blocked:', key);
      return false;
    }
    inFlightRef.current.add(key);

    try {
      const collectionRef = getSubcollection(collectionName);

      await setDoc(
        doc(collectionRef, docId),
        { ...data, updatedAt: serverTimestamp() },
        { merge: true }
      );
      console.log(`Saved ${docId} to ${collectionName}`);
      return true;
    } catch (err) {
      console.error(`Failed to save to ${collectionName}:`, err);
      setError(`Failed to save to Firebase: ${err.message}`);
      return false;
    } finally {
      inFlightRef.current.delete(key);
    }
  };

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
      
      // Update local state immediately
      setProjects((prev) => [...prev, project]);
      
      // Save to Firebase in background
      await saveToFirebase('projects', id, project);
      
      return project;
    },
    [projects, saveToFirebase]
  );

  const updateProject = useCallback(async (id, data) => {
    // Update local state immediately
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    
    // Save to Firebase in background
    await saveToFirebase('projects', id, data);
  }, [projects, saveToFirebase]);

  // ─── PCR CRUD & Workflow ──────────────────────────────────────────────────────

  const createPcr = useCallback(
    async (data, createdBy) => {
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
      
      // Update local state immediately
      setPcrs((prev) => [...prev, pcr]);
      
      // Save to Firebase in background
      await saveToFirebase('pcrs', id, pcr);
      
      return pcr;
    },
    [pcrs, saveToFirebase]
  );

  const updatePcrStatus = useCallback(async (id, updates) => {
    // Update local state immediately
    setPcrs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    
    // Save to Firebase in background
    await saveToFirebase('pcrs', id, updates);
  }, [pcrs, saveToFirebase]);

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
      
      // Update local state immediately
      setPccs((prev) => [...prev, pcc]);
      
      // Create PCC items
      const newItems = items.map((item, idx) => ({
        ...item,
        id: `ITEM-${Date.now()}-${idx}`,
        pccId: id,
        amount: Number(item.amount),
      }));
      
      setPccItems((prev) => [...prev, ...newItems]);
      
      // Save to Firebase in background
      await saveToFirebase('pccs', id, pcc);
      
      // Save PCC items to Firebase
      for (const item of newItems) {
        await saveToFirebase('pccItems', item.id, item);
      }
      
      return pcc;
    },
    [pccs, saveToFirebase]
  );

  const updatePccStatus = useCallback(async (id, updates) => {
    // Update local state immediately
    setPccs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    
    // Save to Firebase in background
    await saveToFirebase('pccs', id, updates);
  }, [pccs, saveToFirebase]);

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
      const totalAmount = items.reduce((s, i) => s + Number(i.amount), 0);
      
      // Update PCC status
      await updatePccStatus(id, {
        status: PCC_STATUS.PENDING_PM,
        totalAmount,
        rejectNote: '',
        verifiedByAP: null,
        verifiedByAPAt: null,
        approvedByGM: null,
        approvedByGMAt: null,
      });
      
      // Update PCC items locally
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
      
      // Save new items to Firebase
      const newItems = items.map((item, idx) => ({
        ...item,
        id: `ITEM-${Date.now()}-${idx}`,
        pccId: id,
        amount: Number(item.amount),
      }));
      
      for (const item of newItems) {
        await saveToFirebase('pccItems', item.id, item);
      }
    },
    [updatePccStatus, saveToFirebase]
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
                <strong>Firebase Status</strong><br/>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Intentionally hide Firebase Connected badge (per UI request). */}
      
      <DataContext.Provider
        value={{
          projects,
          pcrs,
          pccs,
          pccItems,
          loading,
          error,
          firebaseReady,
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
    </>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
