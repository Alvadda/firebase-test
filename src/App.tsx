import { initializeApp } from 'firebase/app'
import { firebaseConfig } from './firebase.config'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'

const app = initializeApp(firebaseConfig)
console.log(firebaseConfig)

const auth = getAuth()
const provider = new GoogleAuthProvider()

import './style/style.scss'
import { useEffect, useState } from 'react'

export const App = () => {
  const [user, setUser] = useState<User | null>()
  const [error, setError] = useState()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
