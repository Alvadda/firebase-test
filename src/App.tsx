import { initializeApp } from 'firebase/app'
import { firebaseConfig } from './firebase.config'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'
import { getFirestore, collection, doc, getDoc, setDoc, query, where, getDocs, addDoc, updateDoc, orderBy } from 'firebase/firestore'

import './style/style.scss'
import { useEffect, useState } from 'react'
import moment from 'moment'

interface Session {
  start: Date
  end?: Date
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const projectsCollectionRef = collection(db, 'users/0NCo1I2Nfzin7pxBYV2z/projects')
const sessionCollectionRef = collection(db, 'users/0NCo1I2Nfzin7pxBYV2z/session')

const provider = new GoogleAuthProvider()

moment.locale('de')

export const App = () => {
  const [user, setUser] = useState<User | null>()
  const [error, setError] = useState()
  const [sessions, setSessions] = useState<Session[]>([])
  console.log(sessions)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return
      console.log(user)

      const testUserDoc = await getDoc(doc(db, 'users', '0NCo1I2Nfzin7pxBYV2z'))
      console.log('Test User', testUserDoc.data())

      const userDocRef = doc(db, 'users', user?.uid)
      const userDoc = await getDoc(userDocRef)
      userDoc.exists
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
      setUser(user)
    })
    return unsubscribe
  }, [])

  const fsTimestampToDate = (fsTimestamp: any) => {
    return new Date(fsTimestamp.seconds * 1000)
  }

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getProjects = async () => {
    const querySnapshot = await getDocs(projectsCollectionRef)
    querySnapshot.forEach((doc) => {
      console.log(doc.id, ' => ', doc.data())
    })
  }

  const addProjects = async () => {
    try {
      await addDoc(projectsCollectionRef, {
        name: 'added project',
        rate: 25.5,
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  const addSession = async () => {
    try {
      const newDoc = await addDoc(sessionCollectionRef, {
        activ: true,
        start: new Date(),
      })
      console.log('New Session addet', newDoc.id)
    } catch (error) {
      console.log('error', error)
    }
  }

  const trackTime = async () => {
    const q = query(sessionCollectionRef, where('activ', '==', true))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.size === 1) {
      const activSessionDoc = querySnapshot.docs[0].ref
      await updateDoc(activSessionDoc, {
        end: new Date(),
        activ: false,
      })
    }
    if (querySnapshot.size === 0) {
      await addSession()
    }
  }

  const showSession = async () => {
    // const querySnapshot = await getDocs(sessionCollectionRef)
    const querySnapshot = await getDocs(query(sessionCollectionRef, orderBy('start', 'desc')))
    const newSessions: Session[] = []
    querySnapshot.forEach((doc) => {
      const session = doc.data()
      if (!session.activ) {
        const s = {
          start: fsTimestampToDate(session.start),
          end: fsTimestampToDate(session.end),
        }
        newSessions.push(s)
      }
      if (session.activ) {
        const s = {
          start: fsTimestampToDate(session.start),
        }
        newSessions.unshift(s)
      }
    })
    setSessions([...newSessions])
  }
  return (
    <>
      <h1>React TypeScript Template</h1>
      {user && (
        <div>
          <p>User: {user.displayName}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => auth.signOut()}>Sign Out</button>
          <button onClick={() => getProjects()}>Get Projects</button>
          <button onClick={() => addProjects()}>Add Projects</button>
          <button onClick={() => trackTime()}>Track Time</button>
          <button onClick={() => showSession()}>Show Session</button>
          <p>Sessions</p>
          <ul>
            {sessions.map((session) => (
              <li key={session.start.toISOString()}>
                From: <span>{moment(session.start).format('DD.MM.YY : h:mm:ss')} </span>
                To: <span>{session?.end && moment(session.end).format('DD.MM.YY : h:mm:ss')}</span>
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
