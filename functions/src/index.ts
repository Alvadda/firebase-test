import { session } from './index'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
admin.initializeApp()
const db = admin.firestore()

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true })
  response.send('Hello from Firebase!')
})

export const session = functions.firestore.document('users/{documentId}/session/{documentId}').onCreate((snapshot, context) => {
  console.log(snapshot.data())
  return Promise.resolve()
})

export const schadueldFunc = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const users = await db.collection('users').get()

  users.forEach(async (doc) => {
    const userSessions = await db.collection(`users/${doc.id}/sessions`).where('activ', '==', true).where('end', '==', '').get()
    const maxSessionsDuration = doc.data().maxSessionsDuration

    userSessions.forEach(async (doc) => {
      const sessionDoc = doc.data()
      // prüfen ob Start länger her ist als die max sessions Duration die vom User angegeben ist
      if (sessionDoc.start > maxSessionsDuration) {
        doc.ref.update({
          activ: false,
          invalid: true,
        })
      }
    })
  })
})
