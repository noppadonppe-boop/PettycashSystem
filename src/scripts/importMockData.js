import { importMockData } from '../services/firebaseService.js';
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

const runImport = async () => {
  try {
    console.log('Starting mock data import to Firebase...');
    
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
    
    await importMockData(mockData);
    
    console.log('✅ Mock data import completed successfully!');
    console.log('Database structure created:');
    console.log('📁 cmg-petty-cash-management/');
    console.log('  📄 root/');
    console.log('    📁 users/ (' + USERS.length + ' documents)');
    console.log('    📁 projects/ (' + initialProjects.length + ' documents)');
    console.log('    📁 pcrs/ (' + initialPcrs.length + ' documents)');
    console.log('    📁 pccs/ (' + initialPccs.length + ' documents)');
    console.log('    📁 pccItems/ (' + initialPccItems.length + ' documents)');
    console.log('    📁 roles/ (' + Object.keys(ROLES).length + ' documents)');
    console.log('    📁 statuses/ (' + (Object.keys(PCR_STATUS).length + Object.keys(PCC_STATUS).length) + ' documents)');
    
  } catch (error) {
    console.error('❌ Error importing mock data:', error);
    process.exit(1);
  }
};

// Run the import if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runImport();
}

export { runImport };
