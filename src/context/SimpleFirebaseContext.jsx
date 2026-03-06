import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { PCR_STATUS, PCC_STATUS } from '../data/mockData.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

const ROOT_COLLECTION = 'cmg-petty-cash-management';
const ROOT_DOC = 'root';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [pcrs, setPcrs] = useState([]);
  const [pccs, setPccs] = useState([]);
  const [pccItems, setPccItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Helper function to get subcollection reference
  const getSubcollection = (subcollectionName) => {
    return collection(db, ROOT_COLLECTION, ROOT_DOC, subcollectionName);
  };

  // Load data from Firebase
  const loadData = async () => {
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading data from Firebase...');

      // Load each collection separately with error handling
      const loadCollection = async (collectionName, setter) => {
        try {
          const snapshot = await getDocs(getSubcollection(collectionName));
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setter(data);
          console.log(`Loaded ${data.length} ${collectionName}`);
          return data;
        } catch (err) {
          console.error(`Error loading ${collectionName}:`, err);
          setter([]);
          return [];
        }
      };

      // Load all collections
      await Promise.all([
        loadCollection('projects', setProjects),
        loadCollection('pcrs', setPcrs),
        loadCollection('pccs', setPccs),
        loadCollection('pccItems', setPccItems)
      ]);

      setConnected(true);
      console.log('Firebase data loaded successfully');

    } catch (err) {
      console.error('Error loading Firebase data:', err);
      setError(`Firebase error: ${err.message}`);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Firebase loading timeout');
        setError('Firebase connection timeout');
        setLoading(false);
      }
    }, 8000);

    loadData().finally(() => {
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
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

  // ─── CRUD Operations (simplified for now) ─────────────────────────────────────

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

  // Dashboard helpers
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

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูลจาก Firebase...</p>
          <p className="text-sm text-slate-400 mt-1">Loading Firebase data...</p>
          <div className="mt-4 text-xs text-slate-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>เชื่อมต่อฐานข้อมูล</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Firebase Error</strong><br/>
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
          connected,
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
          // Dashboard
          getTotalOutstandingCash,
          getUtilizationByProject,
          getAgingAlerts,
          // Utility
          loadData
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
