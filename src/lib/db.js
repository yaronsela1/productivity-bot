import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Simple function to save or update user data
export async function saveUser(email, data) {
  try {
    await setDoc(doc(db, 'users', email), data, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

// Simple function to get user data
export async function getUserData(email) {
  try {
    const docSnap = await getDoc(doc(db, 'users', email));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}