import { initializeApp } from 'firebase/app'
import { firebaseConfig } from './firebase.config'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  orderBy,
  onSnapshot,
  Timestamp,
  CollectionReference,
  DocumentData,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { Project } from './App'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 41234)
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

const googleProvider = new GoogleAuthProvider()

const getProjects = async (projectCollection: CollectionReference<DocumentData>) => {
  if (!projectCollection) return []
  const querySnapshot = await getDocs(projectCollection)
  const projects: Project[] = []
  querySnapshot.forEach((doc) => {
    const project = doc.data()
    projects.push({
      id: doc.id,
      name: project.name,
      rate: project.rate,
    })
  })
  return projects
}

export { db, auth, googleProvider, getProjects }
