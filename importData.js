import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock data
const USERS = [
  { id: 'u1', name: 'Robert Chen', role: 'MD', avatar: 'RC' },
  { id: 'u2', name: 'Sarah Williams', role: 'GM', avatar: 'SW' },
  { id: 'u3', name: 'James Tran', role: 'PM', avatar: 'JT' },
  { id: 'u4', name: 'Lisa Nguyen', role: 'PM', avatar: 'LN' },
  { id: 'u5', name: 'David Park', role: 'AccountPay', avatar: 'DP' },
  { id: 'u6', name: 'Maria Santos', role: 'SiteAdmin', avatar: 'MS' },
  { id: 'u7', name: 'Kevin Lam', role: 'SiteAdmin', avatar: 'KL' },
  { id: 'u8', name: 'Tom Bradley', role: 'CM', avatar: 'TB' },
  { id: 'u9', name: 'Anna Vo', role: 'CM', avatar: 'AV' },
];

const ROLES = {
  MD: 'MD',
  GM: 'GM',
  PM: 'PM',
  AccountPay: 'AccountPay',
  SiteAdmin: 'SiteAdmin',
  CM: 'CM',
};

const PCR_STATUS = {
  PENDING_GM: 'Pending GM',
  GM_REJECTED: 'GM Rejected',
  APPROVED: 'Approved',
  ACKNOWLEDGED: 'Acknowledged by AP',
  CLOSURE_REQUESTED: 'Closure Requested',
  CLOSURE_CONFIRMED: 'Closure Confirmed by AP',
  CLOSED: 'Closed',
};

const PCC_STATUS = {
  PENDING_PM: 'Pending PM',
  PENDING_AP: 'Pending AP',
  AP_REJECTED: 'AP Rejected',
  PENDING_GM: 'Pending GM',
  GM_REJECTED: 'GM Rejected',
  APPROVED: 'Approved',
};

const initialProjects = [
  {
    id: 'PRJ-2026-J-001',
    name: 'Sunrise Tower Complex',
    location: 'Ho Chi Minh City, District 1',
    pmId: 'u3',
    cmId: 'u8',
    startDate: '2026-01-15',
    finishDate: '2027-06-30',
    note: 'Mixed-use high-rise development, 42 floors.',
    createdBy: 'u2',
    createdAt: '2026-01-10',
  },
  {
    id: 'PRJ-2026-J-002',
    name: 'Harbor Bridge Renovation',
    location: 'Da Nang, Son Tra District',
    pmId: 'u4',
    cmId: 'u9',
    startDate: '2026-02-01',
    finishDate: '2026-12-31',
    note: 'Structural reinforcement and aesthetic upgrades.',
    createdBy: 'u2',
    createdAt: '2026-01-28',
  },
  {
    id: 'PRJ-2026-J-003',
    name: 'Green Valley Industrial Park',
    location: 'Binh Duong Province',
    pmId: 'u3',
    cmId: 'u9',
    startDate: '2026-03-01',
    finishDate: '2027-12-31',
    note: 'Phase 1 of 3-phase industrial development.',
    createdBy: 'u1',
    createdAt: '2026-02-20',
  },
];

const initialPcrs = [
  {
    id: 'PCR-J-001-0001',
    projectId: 'PRJ-2026-J-001',
    date: '2026-01-20',
    amount: 5000,
    dueDate: '2026-03-20',
    reason: 'Initial petty cash fund for site operations, materials procurement and miscellaneous expenses.',
    status: PCR_STATUS.ACKNOWLEDGED,
    rejectNote: '',
    createdBy: 'u3',
    approvedBy: 'u2',
    approvedAt: '2026-01-22',
    acknowledgedBy: 'u5',
    acknowledgedAt: '2026-01-23',
    closureRequestedBy: null,
    closureRequestedAt: null,
    closureNote: '',
    closureConfirmedBy: null,
    closureConfirmedAt: null,
    closureConfirmNote: '',
    closedBy: null,
    closedAt: null,
  },
  {
    id: 'PCR-J-001-0002',
    projectId: 'PRJ-2026-J-001',
    date: '2026-02-15',
    amount: 3000,
    dueDate: '2026-04-15',
    reason: 'Top-up fund: previous fund nearly exhausted. Required for ongoing labor and material costs.',
    status: PCR_STATUS.PENDING_GM,
    rejectNote: '',
    createdBy: 'u3',
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
  },
  {
    id: 'PCR-J-002-0001',
    projectId: 'PRJ-2026-J-002',
    date: '2026-02-05',
    amount: 4500,
    dueDate: '2026-04-05',
    reason: 'Bridge renovation initial petty cash for safety equipment and daily operations.',
    status: PCR_STATUS.ACKNOWLEDGED,
    rejectNote: '',
    createdBy: 'u4',
    approvedBy: 'u2',
    approvedAt: '2026-02-07',
    acknowledgedBy: 'u5',
    acknowledgedAt: '2026-02-08',
    closureRequestedBy: null,
    closureRequestedAt: null,
    closureNote: '',
    closureConfirmedBy: null,
    closureConfirmedAt: null,
    closureConfirmNote: '',
    closedBy: null,
    closedAt: null,
  },
  {
    id: 'PCR-J-002-0002',
    projectId: 'PRJ-2026-J-002',
    date: '2026-01-18',
    amount: 2000,
    dueDate: '2025-12-31',
    reason: 'Emergency fund for unexpected repairs during initial survey phase.',
    status: PCR_STATUS.GM_REJECTED,
    rejectNote: 'Amount exceeds monthly budget limit. Please resubmit with breakdown.',
    createdBy: 'u4',
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
  },
  {
    id: 'PCR-J-003-0001',
    projectId: 'PRJ-2026-J-003',
    date: '2026-03-05',
    amount: 8000,
    dueDate: '2026-05-05',
    reason: 'Industrial park Phase 1 petty cash: site clearing, utilities setup, labor.',
    status: PCR_STATUS.APPROVED,
    rejectNote: '',
    createdBy: 'u3',
    approvedBy: 'u1',
    approvedAt: '2026-03-07',
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
  },
];

const initialPccs = [
  {
    id: 'PCR-J-001-0001-PCC-001',
    pcrId: 'PCR-J-001-0001',
    projectId: 'PRJ-2026-J-001',
    requester: 'u6',
    date: '2026-01-25',
    totalAmount: 850,
    status: PCC_STATUS.APPROVED,
    rejectNote: '',
    createdBy: 'u6',
    verifiedByPM: 'u3',
    verifiedByPMAt: '2026-01-26',
    verifiedByAP: 'u5',
    verifiedByAPAt: '2026-01-27',
    approvedByGM: 'u2',
    approvedByGMAt: '2026-01-28',
  },
  {
    id: 'PCR-J-001-0001-PCC-002',
    pcrId: 'PCR-J-001-0001',
    projectId: 'PRJ-2026-J-001',
    requester: 'u6',
    date: '2026-02-03',
    totalAmount: 1200,
    status: PCC_STATUS.APPROVED,
    rejectNote: '',
    createdBy: 'u6',
    verifiedByPM: 'u3',
    verifiedByPMAt: '2026-02-04',
    verifiedByAP: 'u5',
    verifiedByAPAt: '2026-02-05',
    approvedByGM: 'u2',
    approvedByGMAt: '2026-02-06',
  },
  {
    id: 'PCR-J-001-0001-PCC-003',
    pcrId: 'PCR-J-001-0001',
    projectId: 'PRJ-2026-J-001',
    requester: 'u6',
    date: '2026-02-10',
    totalAmount: 600,
    status: PCC_STATUS.PENDING_AP,
    rejectNote: '',
    createdBy: 'u6',
    verifiedByPM: 'u3',
    verifiedByPMAt: '2026-02-11',
    verifiedByAP: null,
    verifiedByAPAt: null,
    approvedByGM: null,
    approvedByGMAt: null,
  },
  {
    id: 'PCR-J-002-0001-PCC-001',
    pcrId: 'PCR-J-002-0001',
    projectId: 'PRJ-2026-J-002',
    requester: 'u7',
    date: '2026-02-12',
    totalAmount: 1750,
    status: PCC_STATUS.PENDING_GM,
    rejectNote: '',
    createdBy: 'u7',
    verifiedByPM: 'u4',
    verifiedByPMAt: '2026-02-13',
    verifiedByAP: 'u5',
    verifiedByAPAt: '2026-02-14',
    approvedByGM: null,
    approvedByGMAt: null,
  },
  {
    id: 'PCR-J-002-0001-PCC-002',
    pcrId: 'PCR-J-002-0001',
    projectId: 'PRJ-2026-J-002',
    requester: 'u7',
    date: '2026-02-20',
    totalAmount: 980,
    status: PCC_STATUS.PENDING_PM,
    rejectNote: '',
    createdBy: 'u7',
    verifiedByPM: null,
    verifiedByPMAt: null,
    verifiedByAP: null,
    verifiedByAPAt: null,
    approvedByGM: null,
    approvedByGMAt: null,
  },
];

const initialPccItems = [
  { id: 'ITEM-001', pccId: 'PCR-J-001-0001-PCC-001', description: 'Cement bags (20 units)', amount: 320, reason: 'Foundation work' },
  { id: 'ITEM-002', pccId: 'PCR-J-001-0001-PCC-001', description: 'Safety helmets (10 units)', amount: 200, reason: 'Worker safety compliance' },
  { id: 'ITEM-003', pccId: 'PCR-J-001-0001-PCC-001', description: 'Site lunch allowance', amount: 180, reason: 'Overtime crew meals' },
  { id: 'ITEM-004', pccId: 'PCR-J-001-0001-PCC-001', description: 'Transport fuel', amount: 150, reason: 'Materials delivery' },
  { id: 'ITEM-005', pccId: 'PCR-J-001-0001-PCC-002', description: 'Rebar steel 12mm (50kg)', amount: 650, reason: 'Column reinforcement' },
  { id: 'ITEM-006', pccId: 'PCR-J-001-0001-PCC-002', description: 'Electrical conduit pipes', amount: 280, reason: 'Wiring rough-in' },
  { id: 'ITEM-007', pccId: 'PCR-J-001-0001-PCC-002', description: 'Miscellaneous hardware', amount: 270, reason: 'General repairs' },
  { id: 'ITEM-008', pccId: 'PCR-J-001-0001-PCC-003', description: 'Paint primer (10L)', amount: 180, reason: 'Surface preparation' },
  { id: 'ITEM-009', pccId: 'PCR-J-001-0001-PCC-003', description: 'Scaffolding rental', amount: 420, reason: 'Upper floor access' },
  { id: 'ITEM-010', pccId: 'PCR-J-002-0001-PCC-001', description: 'Concrete mix bags', amount: 900, reason: 'Bridge deck repair' },
  { id: 'ITEM-011', pccId: 'PCR-J-002-0001-PCC-001', description: 'Survey equipment rental', amount: 500, reason: 'Structural assessment' },
  { id: 'ITEM-012', pccId: 'PCR-J-002-0001-PCC-001', description: 'Safety barriers', amount: 350, reason: 'Traffic management' },
  { id: 'ITEM-013', pccId: 'PCR-J-002-0001-PCC-002', description: 'Steel bolts and fasteners', amount: 480, reason: 'Truss connection' },
  { id: 'ITEM-014', pccId: 'PCR-J-002-0001-PCC-002', description: 'Waterproof membrane', amount: 500, reason: 'Bridge deck waterproofing' },
];

// Database structure: cmg-petty-cash-management > root > subcollections
const ROOT_COLLECTION = 'cmg-petty-cash-management';
const ROOT_DOC = 'root';

const getSubcollection = (subcollectionName) => {
  return collection(db, ROOT_COLLECTION, ROOT_DOC, subcollectionName);
};

const importData = async () => {
  try {
    console.log('🔥 Starting Firebase data import...');
    
    // Initialize root document
    console.log('📄 Creating root document...');
    const rootDocRef = doc(db, ROOT_COLLECTION, ROOT_DOC);
    await setDoc(rootDocRef, {
      initialized: true,
      createdAt: new Date().toISOString(),
      description: 'Root document for CMG Petty Cash Management System'
    });
    
    // Import users
    console.log('👥 Importing users...');
    for (const user of USERS) {
      await setDoc(doc(getSubcollection('users'), user.id), user);
    }
    console.log(`✅ Imported ${USERS.length} users`);
    
    // Import projects
    console.log('🏗️ Importing projects...');
    for (const project of initialProjects) {
      await setDoc(doc(getSubcollection('projects'), project.id), project);
    }
    console.log(`✅ Imported ${initialProjects.length} projects`);
    
    // Import PCRs
    console.log('📋 Importing PCRs...');
    for (const pcr of initialPcrs) {
      await setDoc(doc(getSubcollection('pcrs'), pcr.id), pcr);
    }
    console.log(`✅ Imported ${initialPcrs.length} PCRs`);
    
    // Import PCCs
    console.log('💰 Importing PCCs...');
    for (const pcc of initialPccs) {
      await setDoc(doc(getSubcollection('pccs'), pcc.id), pcc);
    }
    console.log(`✅ Imported ${initialPccs.length} PCCs`);
    
    // Import PCC Items
    console.log('📦 Importing PCC items...');
    for (const pccItem of initialPccItems) {
      await setDoc(doc(getSubcollection('pccItems'), pccItem.id), pccItem);
    }
    console.log(`✅ Imported ${initialPccItems.length} PCC items`);
    
    // Import roles
    console.log('🔐 Importing roles...');
    for (const [key, value] of Object.entries(ROLES)) {
      await setDoc(doc(getSubcollection('roles'), key), { name: key, value });
    }
    console.log(`✅ Imported ${Object.keys(ROLES).length} roles`);
    
    // Import PCR statuses
    console.log('📊 Importing PCR statuses...');
    for (const [key, value] of Object.entries(PCR_STATUS)) {
      await setDoc(doc(getSubcollection('statuses'), `pcr_${key}`), { 
        type: 'PCR', 
        name: key, 
        value 
      });
    }
    console.log(`✅ Imported ${Object.keys(PCR_STATUS).length} PCR statuses`);
    
    // Import PCC statuses
    console.log('📊 Importing PCC statuses...');
    for (const [key, value] of Object.entries(PCC_STATUS)) {
      await setDoc(doc(getSubcollection('statuses'), `pcc_${key}`), { 
        type: 'PCC', 
        name: key, 
        value 
      });
    }
    console.log(`✅ Imported ${Object.keys(PCC_STATUS).length} PCC statuses`);
    
    console.log('\n🎉 Import completed successfully!');
    console.log('\n📁 Database structure created:');
    console.log('   cmg-petty-cash-management/');
    console.log('     📄 root/');
    console.log(`       📁 users/ (${USERS.length} documents)`);
    console.log(`       📁 projects/ (${initialProjects.length} documents)`);
    console.log(`       📁 pcrs/ (${initialPcrs.length} documents)`);
    console.log(`       📁 pccs/ (${initialPccs.length} documents)`);
    console.log(`       📁 pccItems/ (${initialPccItems.length} documents)`);
    console.log(`       📁 roles/ (${Object.keys(ROLES).length} documents)`);
    console.log(`       📁 statuses/ (${Object.keys(PCR_STATUS).length + Object.keys(PCC_STATUS).length} documents)`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

importData();
