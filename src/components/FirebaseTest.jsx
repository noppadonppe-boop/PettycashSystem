import { useState } from 'react';
import { 
  USERS, 
  ROLES, 
  PCR_STATUS, 
  PCC_STATUS, 
  initialProjects, 
  initialPcrs, 
  initialPccs, 
  initialPccItems 
} from '../data/mockData.js';
import { importMockData } from '../services/firebaseService.js';

export function FirebaseTest() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setStatus('Starting import...');

    try {
      const mockData = {
        users: USERS,
        roles: ROLES,
        pcrStatuses: PCR_STATUS,
        pccStatuses: PCC_STATUS,
        projects: initialProjects,
        pcrs: initialPcrs,
        pccs: initialPccs,
        pccItems: initialPccItems
      };

      setStatus('Importing data to Firebase...');
      await importMockData(mockData);
      
      setStatus('✅ Import completed successfully!');
      console.log('Firebase import completed');
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
      setStatus('❌ Import failed');
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
      <h3>🔥 Firebase Import</h3>
      <p>Import mock data to Firebase</p>
      
      <button 
        onClick={handleImport}
        disabled={importing}
        style={{
          background: importing ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: importing ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '10px'
        }}
      >
        {importing ? '⏳ Importing...' : '🚀 Import Data'}
      </button>
      
      {status && (
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          {status}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <strong>Structure:</strong><br/>
        📁 cmg-petty-cash-management/<br/>
        &nbsp;&nbsp;📄 root/<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 users/ ({USERS.length})<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 projects/ ({initialProjects.length})<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pcrs/ ({initialPcrs.length})<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pccs/ ({initialPccs.length})<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;📁 pccItems/ ({initialPccItems.length})
      </div>
    </div>
  );
}
