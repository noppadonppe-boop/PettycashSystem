import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// Database structure: cmg-petty-cash-management > root > subcollections
const ROOT_COLLECTION = 'cmg-petty-cash-management';
const ROOT_DOC = 'root';

// Helper function to get subcollection reference
const getSubcollection = (subcollectionName) => {
  return collection(db, ROOT_COLLECTION, ROOT_DOC, subcollectionName);
};

// Initialize root document if it doesn't exist
export const initializeRootDocument = async () => {
  try {
    const rootDocRef = doc(db, ROOT_COLLECTION, ROOT_DOC);
    const rootDoc = await getDoc(rootDocRef);
    
    if (!rootDoc.exists()) {
      await setDoc(rootDocRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        description: 'Root document for CMG Petty Cash Management System'
      });
    }
  } catch (error) {
    console.error('Error initializing root document:', error);
    throw error;
  }
};

// Users operations
export const getUsers = async () => {
  try {
    const usersRef = getSubcollection('users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const usersRef = getSubcollection('users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(getSubcollection('users'), userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Projects operations
export const getProjects = async () => {
  try {
    const projectsRef = getSubcollection('projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

export const addProject = async (projectData) => {
  try {
    const projectsRef = getSubcollection('projects');
    const docRef = await addDoc(projectsRef, {
      ...projectData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const projectRef = doc(getSubcollection('projects'), projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// PCR (Petty Cash Request) operations
export const getPcrs = async () => {
  try {
    const pcrsRef = getSubcollection('pcrs');
    const q = query(pcrsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCRs:', error);
    throw error;
  }
};

export const getPcrsByProject = async (projectId) => {
  try {
    const pcrsRef = getSubcollection('pcrs');
    const q = query(pcrsRef, where('projectId', '==', projectId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCRs by project:', error);
    throw error;
  }
};

export const addPcr = async (pcrData) => {
  try {
    const pcrsRef = getSubcollection('pcrs');
    const docRef = await addDoc(pcrsRef, {
      ...pcrData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding PCR:', error);
    throw error;
  }
};

export const updatePcr = async (pcrId, pcrData) => {
  try {
    const pcrRef = doc(getSubcollection('pcrs'), pcrId);
    await updateDoc(pcrRef, {
      ...pcrData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating PCR:', error);
    throw error;
  }
};

// PCC (Petty Cash Claim) operations
export const getPccs = async () => {
  try {
    const pccsRef = getSubcollection('pccs');
    const q = query(pccsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCCs:', error);
    throw error;
  }
};

export const getPccsByPcr = async (pcrId) => {
  try {
    const pccsRef = getSubcollection('pccs');
    const q = query(pccsRef, where('pcrId', '==', pcrId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCCs by PCR:', error);
    throw error;
  }
};

export const addPcc = async (pccData) => {
  try {
    const pccsRef = getSubcollection('pccs');
    const docRef = await addDoc(pccsRef, {
      ...pccData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding PCC:', error);
    throw error;
  }
};

export const updatePcc = async (pccId, pccData) => {
  try {
    const pccRef = doc(getSubcollection('pccs'), pccId);
    await updateDoc(pccRef, {
      ...pccData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating PCC:', error);
    throw error;
  }
};

// PCC Items operations
export const getPccItems = async () => {
  try {
    const pccItemsRef = getSubcollection('pccItems');
    const snapshot = await getDocs(pccItemsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCC items:', error);
    throw error;
  }
};

export const getPccItemsByPcc = async (pccId) => {
  try {
    const pccItemsRef = getSubcollection('pccItems');
    const q = query(pccItemsRef, where('pccId', '==', pccId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PCC items by PCC:', error);
    throw error;
  }
};

export const addPccItem = async (pccItemData) => {
  try {
    const pccItemsRef = getSubcollection('pccItems');
    const docRef = await addDoc(pccItemsRef, {
      ...pccItemData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding PCC item:', error);
    throw error;
  }
};

export const updatePccItem = async (pccItemId, pccItemData) => {
  try {
    const pccItemRef = doc(getSubcollection('pccItems'), pccItemId);
    await updateDoc(pccItemRef, {
      ...pccItemData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating PCC item:', error);
    throw error;
  }
};

export const deletePccItem = async (pccItemId) => {
  try {
    const pccItemRef = doc(getSubcollection('pccItems'), pccItemId);
    await deleteDoc(pccItemRef);
  } catch (error) {
    console.error('Error deleting PCC item:', error);
    throw error;
  }
};

// Roles and Status constants operations
export const getRoles = async () => {
  try {
    const rolesRef = getSubcollection('roles');
    const snapshot = await getDocs(rolesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting roles:', error);
    throw error;
  }
};

export const getStatuses = async () => {
  try {
    const statusesRef = getSubcollection('statuses');
    const snapshot = await getDocs(statusesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting statuses:', error);
    throw error;
  }
};

// Bulk operations for initial data import
export const importMockData = async (mockData) => {
  try {
    await initializeRootDocument();
    
    // Import users
    if (mockData.users) {
      for (const user of mockData.users) {
        await setDoc(doc(getSubcollection('users'), user.id), user);
      }
    }
    
    // Import projects
    if (mockData.projects) {
      for (const project of mockData.projects) {
        await setDoc(doc(getSubcollection('projects'), project.id), project);
      }
    }
    
    // Import PCRs
    if (mockData.pcrs) {
      for (const pcr of mockData.pcrs) {
        await setDoc(doc(getSubcollection('pcrs'), pcr.id), pcr);
      }
    }
    
    // Import PCCs
    if (mockData.pccs) {
      for (const pcc of mockData.pccs) {
        await setDoc(doc(getSubcollection('pccs'), pcc.id), pcc);
      }
    }
    
    // Import PCC Items
    if (mockData.pccItems) {
      for (const pccItem of mockData.pccItems) {
        await setDoc(doc(getSubcollection('pccItems'), pccItem.id), pccItem);
      }
    }
    
    // Import roles
    if (mockData.roles) {
      for (const [key, value] of Object.entries(mockData.roles)) {
        await setDoc(doc(getSubcollection('roles'), key), { name: key, value });
      }
    }
    
    // Import PCR statuses
    if (mockData.pcrStatuses) {
      for (const [key, value] of Object.entries(mockData.pcrStatuses)) {
        await setDoc(doc(getSubcollection('statuses'), `pcr_${key}`), { 
          type: 'PCR', 
          name: key, 
          value 
        });
      }
    }
    
    // Import PCC statuses
    if (mockData.pccStatuses) {
      for (const [key, value] of Object.entries(mockData.pccStatuses)) {
        await setDoc(doc(getSubcollection('statuses'), `pcc_${key}`), { 
          type: 'PCC', 
          name: key, 
          value 
        });
      }
    }
    
    console.log('Mock data imported successfully');
  } catch (error) {
    console.error('Error importing mock data:', error);
    throw error;
  }
};
