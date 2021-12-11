import { initializeApp } from 'firebase/app'
import { firebaseConfig } from './firebase.config'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const userCollectionRef = collection(db, 'users')

const provider = new GoogleAuthProvider()

import './style/style.scss'
import { useEffect, useState } from 'react'

export const App = () => {
  const [user, setUser] = useState<User | null>()
  const [error, setError] = useState()
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return
      console.log(user)

      const userDocRef = doc(db, 'users', user?.uid)
      const userDoc = await getDoc(userDocRef)

      console.log('userDoc', userDoc.data())
      if (!userDoc.data()) {
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

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      setError(error.message)
    }
  }
  return (
    <>
      <h1>React TypeScript Template</h1>
      {user && (
        <div>
          <p>User: {user.displayName}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => auth.signOut()}>Sign Out</button>
        </div>
      )}
      {!user && <button onClick={() => signInWithGoogle()}>Login</button>}
      {error && <p>Error: {error}</p>}
    </>
  )
}
