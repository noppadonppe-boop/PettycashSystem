import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const ROOT_COLLECTION = 'cmg-petty-cash-management';
const ROOT_DOC = 'root';

export function FirebaseImporter() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const importToFirebase = async () => {
    setImporting(true);
    setError(null);
    setSuccess(false);
    setStatus('เริ่มการนำเข้าข้อมูล...');

    try {
      // Initialize Firebase
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

      // Helper function
      const getSubcollection = (subcollectionName) => {
        return collection(db, ROOT_COLLECTION, ROOT_DOC, subcollectionName);
      };

      setStatus('สร้าง root document...');
      // Create root document
      const rootDocRef = doc(db, ROOT_COLLECTION, ROOT_DOC);
      await setDoc(rootDocRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        description: 'Root document for CMG Petty Cash Management System'
      });

      setStatus('นำเข้าผู้ใช้งาน...');
      // Import users
      for (const user of USERS) {
        await setDoc(doc(getSubcollection('users'), user.id), user);
      }

      setStatus('นำเข้าโครงการ...');
      // Import projects
      for (const project of initialProjects) {
        await setDoc(doc(getSubcollection('projects'), project.id), project);
      }

      setStatus('✅ นำเข้าข้อมูลสำเร็จ!');
      setSuccess(true);
      
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
      setStatus('❌ เกิดข้อผิดพลาด');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🔥 Firebase Import</h3>
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
        นำเข้าข้อมูลทดสอบไป Firebase
      </p>
      
      <button 
        onClick={importToFirebase}
        disabled={importing || success}
        style={{
          background: success ? '#10B981' : importing ? '#ccc' : '#3B82F6',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: importing || success ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '10px',
          fontSize: '14px'
        }}
      >
        {success ? '✅ นำเข้าสำเร็จ' : importing ? '⏳ กำลังนำเข้า...' : '🚀 นำเข้าข้อมูล'}
      </button>
      
      {status && (
        <div style={{ 
          padding: '10px', 
          background: success ? '#D1FAE5' : error ? '#FEE2E2' : '#F3F4F6', 
          color: success ? '#065F46' : error ? '#991B1B' : '#374151',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          {status}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#FEE2E2', 
          color: '#991B1B',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          ข้อผิดพลาด: {error}
        </div>
      )}
      
      <div style={{ fontSize: '11px', color: '#6B7280' }}>
        <strong>โครงสร้าง:</strong><br/>
        📁 cmg-petty-cash-management/<br/>
        &nbsp;&nbsp;📄 root/<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 users/ (9)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 projects/ (3)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pcrs/ (5)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pccs/ (5)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pccItems/ (14)
      </div>
    </div>
  );
}
