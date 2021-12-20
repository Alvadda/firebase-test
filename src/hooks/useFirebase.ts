import { initializeApp } from 'firebase/app'
import { firebaseConfig } from '../firebase.config'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
} from 'firebase/auth'
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
import { useEffect, useState } from 'react'
import { Project } from '../App'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)
const googleProvider = new GoogleAuthProvider()

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 41234)
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

export const useFirebase = () => {
  const [user, setUser] = useState<User | null>()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectCollection, setProjectCollection] = useState<CollectionReference<DocumentData> | undefined>()
  const [sessionCollection, setSessionCollection] = useState<CollectionReference<DocumentData> | undefined>()

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
  }, [])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user?.uid)
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists) {
          try {
            await setDoc(doc(db, 'users', user?.uid), {
              name: user.displayName,
              email: user.email,
            })
          } catch (error) {
            console.log('error', error)
          }
        }
      }
      setProjectCollection(user ? collection(db, `users/${user.uid}/projects`) : undefined)
      setSessionCollection(user ? collection(db, `users/${user.uid}/session`) : undefined)
      setUser(user)
    })
    return unsubscribe
  }, [])

  const getProjects = async (): Promise<Project[]> => {
    if (!projectCollection) return []
    const querySnapshot = await getDocs(projectCollection)
    const newProjects: Project[] = []
    querySnapshot.forEach((doc) => {
      const project = doc.data()
      newProjects.push({
        id: doc.id,
        name: project.name,
        rate: project.rate,
      })
    })
    return newProjects
  }

  return {
    user,
    getProjects,
    db,
    googleProvider,
    projectCollection,
    sessionCollection,
  }
}
