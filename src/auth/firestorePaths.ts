import { collection, doc } from 'firebase/firestore';
import { APP_NAME, ROOT_DOC, db } from '../firebase/firebase';

export function rootDocRef() {
  return doc(db, APP_NAME, ROOT_DOC);
}

export function usersColRef() {
  return collection(db, APP_NAME, ROOT_DOC, 'users');
}

export function userDocRef(uid: string) {
  return doc(db, APP_NAME, ROOT_DOC, 'users', uid);
}

export function appMetaDocRef(docId = 'config') {
  return doc(db, APP_NAME, ROOT_DOC, 'appMeta', docId);
}

export function activityLogsColRef() {
  return collection(db, APP_NAME, ROOT_DOC, 'activityLogs');
}

