import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DataProvider as MockDataProvider, useData as useMockData } from './DataContext';
import { DataProvider as FirebaseDataProvider, useData as useFirebaseData } from './FirebaseDataContext';

const HybridContext = createContext(null);

// Component that tries Firebase first, falls back to mock data
function HybridDataProvider({ children }) {
  const [useFirebase, setUseFirebase] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);

  return (
    <HybridContext.Provider value={{ useFirebase, setUseFirebase, firebaseError, setFirebaseError }}>
      {useFirebase ? (
        <FirebaseDataProvider>
          <FirebaseWrapper>{children}</FirebaseWrapper>
        </FirebaseDataProvider>
      ) : (
        <MockDataProvider>
          <MockWrapper>{children}</MockWrapper>
        </MockDataProvider>
      )}
    </HybridContext.Provider>
  );
}

function FirebaseWrapper({ children }) {
  const data = useFirebaseData();
  const { setUseFirebase, setFirebaseError } = useContext(HybridContext);

  useEffect(() => {
    if (data.error) {
      console.warn('Firebase error detected, falling back to mock data:', data.error);
      setFirebaseError(data.error);
      setUseFirebase(false);
    }
  }, [data.error, setUseFirebase, setFirebaseError]);

  // Show Firebase loading state
  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">กำลังเชื่อมต่อ Firebase...</p>
          <p className="text-sm text-slate-400">Connecting to Firebase...</p>
          <button 
            onClick={() => setUseFirebase(false)}
            className="mt-4 px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            ใช้ข้อมูลทดสอบ / Use Mock Data
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function MockWrapper({ children }) {
  const { firebaseError } = useContext(HybridContext);
  
  return (
    <>
      {firebaseError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>กำลังใช้ข้อมูลทดสอบ / Using Mock Data</strong><br/>
                Firebase connection failed: {firebaseError}
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

export { HybridDataProvider as DataProvider };

// Export the appropriate hook based on current context
export function useData() {
  const hybridContext = useContext(HybridContext);
  
  if (!hybridContext) {
    throw new Error('useData must be used within HybridDataProvider');
  }

  // This will be called within either Firebase or Mock context
  try {
    if (hybridContext.useFirebase) {
      return useFirebaseData();
    } else {
      return useMockData();
    }
  } catch (error) {
    // Fallback to mock data if there's any error
    console.warn('Error in data context, falling back to mock data:', error);
    return useMockData();
  }
}
