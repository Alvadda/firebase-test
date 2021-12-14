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
} from 'firebase/firestore'

import './style/style.scss'
import { useEffect, useState } from 'react'
import moment from 'moment'

interface Session {
  id: string
  start: Date
  end?: Date
}

interface Project {
  id: string
  name: string
  rate: number
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 41234)
}

const provider = new GoogleAuthProvider()

moment.locale('de')

export const App = () => {
  const [user, setUser] = useState<User | null>()
  const [error, setError] = useState()
  const [sessions, setSessions] = useState<Session[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectCollection, setProjectCollection] = useState<CollectionReference<DocumentData> | undefined>()
  const [sessionCollection, setSessionCollection] = useState<CollectionReference<DocumentData> | undefined>()

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

  useEffect(() => {
    if (!sessionCollection) return

    const q = query(sessionCollection, orderBy('start', 'desc'))
    // const q = query(sessionCollectionRef, orderBy('start', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newSessions: Session[] = []
      querySnapshot.forEach((doc) => {
        const session = doc.data()
        if (!session.activ) {
          const s = {
            id: doc.id,
            start: fsTimestampToDate(session.start),
            end: fsTimestampToDate(session.end),
          }
          newSessions.push(s)
        }
        if (session.activ) {
          const s = {
            id: doc.id,
            start: fsTimestampToDate(session.start),
          }
          newSessions.unshift(s)
        }
      })
      setSessions([...newSessions])
    })

    return unsubscribe
  }, [user, sessionCollection])

  useEffect(() => {
    const getProjects = async () => {
      if (!projectCollection) return
      const querySnapshot = await getDocs(projectCollection)
      // const querySnapshot = await getDocs(projectsCollectionRef)
      const newProjects: Project[] = []
      querySnapshot.forEach((doc) => {
        const project = doc.data()
        newProjects.push({
          id: doc.id,
          name: project.name,
          rate: project.rate,
        })
      })
      setProjects([...newProjects])
    }
    console.log('getProjects')

    if (user) {
      getProjects()
    }
  }, [user, projectCollection])

  const fsTimestampToDate = (fsTimestamp: Timestamp) => {
    return new Date(fsTimestamp.seconds * 1000)
  }

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const addProjects = async () => {
    if (!projectCollection) return

    try {
      await addDoc(projectCollection, {
        name: 'added project',
        rate: 25.5,
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  const addSession = async (sessionCollection: CollectionReference<DocumentData>) => {
    try {
      const newDoc = await addDoc(sessionCollection, {
        activ: true,
        start: new Date(),
      })
      console.log('New Session addet', newDoc.id)
    } catch (error) {
      console.log('error', error)
    }
  }

  const trackTime = async () => {
    if (!sessionCollection) return

    const q = query(sessionCollection, where('activ', '==', true))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.size === 1) {
      const activSessionDoc = querySnapshot.docs[0].ref
      await updateDoc(activSessionDoc, {
        end: new Date(),
        activ: false,
      })
    }
    if (querySnapshot.size === 0) {
      await addSession(sessionCollection)
    }
  }

  return (
    <>
      <h1>Time Tracking</h1>
      {user && (
        <div>
          <p>User: {user.displayName}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => auth.signOut()}>Sign Out</button>
          <button onClick={() => addProjects()}>Add Projects</button>
          <button onClick={() => trackTime()}>Track Time</button>
          <p>Sessions</p>
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                From: <span>{moment(session.start).format('DD.MM.YY : h:mm:ss')} </span>
                To: <span>{session?.end && moment(session.end).format('DD.MM.YY : h:mm:ss')}</span>
              </li>
            ))}
          </ul>
          <p>Projects</p>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                Name: <span>{project.name} - </span>
                Rate: <span>{project.rate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!user && <button onClick={() => signInWithGoogle()}>Login</button>}
      {error && <p>Error: {error}</p>}
    </>
  )
}
