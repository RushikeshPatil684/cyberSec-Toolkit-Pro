import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';

const ReportContext = createContext();

export function useReports() {
  return useContext(ReportContext);
}

// Backward compatibility helper
export function useReport() {
  return useContext(ReportContext);
}

export function ReportProvider({ children }) {
  const { currentUser } = useAuth() || {};
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const userReportQuery = useMemo(() => {
    if (!currentUser?.uid || !db) return null;
    return query(
      collection(db, 'reports'), 
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
  }, [currentUser]);

  useEffect(() => {
    if (!userReportQuery) {
      setReports([]);
      setLoadingReports(false);
      return undefined;
    }

    setLoadingReports(true);
    console.log('[ReportContext] Setting up onSnapshot subscription for reports');
    
    const unsubscribe = onSnapshot(
      userReportQuery,
      (snapshot) => {
        console.log('[ReportContext] onSnapshot ->', snapshot.docs.length, 'reports');
        const data = snapshot.docs
          .map((docSnap) => {
            const raw = docSnap.data();
            
            // Handle createdAt: convert Firestore Timestamp to JS Date, with fallbacks
            let createdAt = null;
            if (raw.createdAt) {
              // Firestore Timestamp object
              if (raw.createdAt.toDate && typeof raw.createdAt.toDate === 'function') {
                createdAt = raw.createdAt.toDate();
              }
              // Legacy format with seconds
              else if (raw.createdAt.seconds) {
                createdAt = new Date(raw.createdAt.seconds * 1000);
              }
              // Already a Date object
              else if (raw.createdAt instanceof Date) {
                createdAt = raw.createdAt;
              }
            }
            
            // Fallback to document creation time if createdAt missing
            if (!createdAt) {
              if (docSnap._readTime?.toDate) {
                createdAt = docSnap._readTime.toDate();
                console.warn(`[ReportContext] report ${docSnap.id} missing createdAt — fallback used (readTime)`);
              } else {
                createdAt = new Date();
                console.warn(`[ReportContext] report ${docSnap.id} missing createdAt — fallback used (now)`);
              }
            }
            
            return {
              id: docSnap.id,
              ...raw,
              createdAt,
            };
          })
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        console.log('[ReportContext] Reports updated, count:', data.length);
        setReports(data);
        setLoadingReports(false);
      },
      (error) => {
        console.error('[ReportContext] onSnapshot error', error);
        console.error('[ReportContext] Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        // Check for missing index error and extract Firebase Console link if present
        let indexLink = null;
        if (error.message && typeof error.message === 'string') {
          // Firebase SDK often includes a direct link in the error message
          const linkMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
          if (linkMatch) {
            indexLink = linkMatch[0];
          }
        }
        
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          const indexUrl = indexLink || `https://console.firebase.google.com/project/${process.env.REACT_APP_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'}/firestore/indexes`;
          console.error('[ReportContext] ⚠️ Missing Firestore Composite Index');
          console.error('[ReportContext] Collection: reports');
          console.error('[ReportContext] Required index fields:');
          console.error('  - userId (Ascending)');
          console.error('  - createdAt (Descending)');
          console.error(`[ReportContext] Create index at: ${indexUrl}`);
          if (indexLink) {
            console.error('[ReportContext] Direct link from Firebase SDK:', indexLink);
          }
          toast.error('Firestore index missing — check console for one-click link to create it.', { autoClose: 10000 });
        } else {
          toast.error('Unable to sync reports from Firestore');
        }
        
        setLoadingReports(false);
        
        // Dev-only fallback: poll every 5s if snapshot fails
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ReportContext] Snapshot failed, polling fallback active (dev-only). Create required index in Firebase Console to restore real-time updates.');
          const pollInterval = setInterval(async () => {
            try {
              console.log('[ReportContext] poll -> fetching reports...');
              const snapshot = await getDocs(userReportQuery);
              const data = snapshot.docs.map((docSnap) => {
                const raw = docSnap.data();
                // Handle createdAt with same logic as onSnapshot
                let createdAt = null;
                if (raw.createdAt) {
                  if (raw.createdAt.toDate && typeof raw.createdAt.toDate === 'function') {
                    createdAt = raw.createdAt.toDate();
                  } else if (raw.createdAt.seconds) {
                    createdAt = new Date(raw.createdAt.seconds * 1000);
                  } else if (raw.createdAt instanceof Date) {
                    createdAt = raw.createdAt;
                  }
                }
                if (!createdAt) {
                  if (docSnap._readTime?.toDate) {
                    createdAt = docSnap._readTime.toDate();
                  } else {
                    createdAt = new Date();
                  }
                }
                return {
                  id: docSnap.id,
                  ...raw,
                  createdAt,
                };
              }).sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
              });
              console.log('[ReportContext] poll ->', data.length, 'reports');
              setReports(data);
            } catch (pollError) {
              console.error('[ReportContext] Polling error:', pollError);
            }
          }, 5000);
          
          // Cleanup polling on unmount
          return () => {
            console.log('[ReportContext] Cleaning up polling fallback');
            clearInterval(pollInterval);
          };
        }
      }
    );

    return () => unsubscribe();
  }, [userReportQuery]);

  const saveReport = useCallback(
    async ({ tool, result, input }) => {
      // Enhanced logging with input field for better traceability
      console.log('[ReportContext] saveReport called', { 
        tool, 
        hasResult: !!result, 
        hasInput: !!input,
        userId: currentUser?.uid 
      });
      
      if (!currentUser?.uid || !db) {
        console.warn('[ReportContext] saveReport aborted - missing user or db');
        toast.info('Log in to store reports securely.');
        return null;
      }

      if (!tool || typeof result === 'undefined' || result === null) {
        console.error('[ReportContext] saveReport aborted - missing tool or result', { tool, result });
        toast.error('Missing report data');
        return null;
      }

      try {
        // Always use serverTimestamp for createdAt to ensure proper indexing and ordering
        const payload = {
          userId: currentUser.uid,
          tool,
          result,
          ...(input && { input }), // Include input if provided for traceability
          createdAt: serverTimestamp(),
        };
        
        console.log('[ReportContext] Saving report to Firestore...', { 
          tool, 
          userId: currentUser.uid,
          hasInput: !!input 
        });
        
        // Atomic write: Firestore first, then UI updates via onSnapshot
        const docRef = await addDoc(collection(db, 'reports'), payload);
        console.log('[ReportContext] Saved to Firestore:', docRef.id);
        
        // Note: onSnapshot will automatically update UI, no need to manually update state
        toast.success('Report saved');
        return docRef.id;
      } catch (error) {
        console.error('[ReportContext] Save failed:', error);
        console.error('[ReportContext] Error code:', error.code);
        console.error('[ReportContext] Error message:', error.message);
        console.error('[ReportContext] Error stack:', error.stack);
        toast.error('Failed to save report to Firestore: ' + (error.message || 'Unknown error'));
        return null;
      }
    },
    [currentUser]
  );

  const deleteReport = useCallback(async (reportId) => {
    if (!reportId || !db) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast.success('Report deleted');
    } catch (error) {
      console.error('[ReportContext] deleteReport error', error);
      toast.error('Unable to delete report');
    }
  }, []);

  const value = {
    reports,
    loadingReports,
    saveReport,
    deleteReport,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}