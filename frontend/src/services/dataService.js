import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "./firebase";

const SUMMARIES_COLLECTION = "summaries";

export const saveSummary = async (userId, summaryData) => {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, SUMMARIES_COLLECTION), {
      userId,
      ...summaryData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving summary:", error);
    throw error;
  }
};

export const getUserSummaries = async (userId) => {
  if (!db) {
    console.error("Firestore is not initialized. Check your Firebase configuration.");
    return [];
  }
  try {
    const q = query(
      collection(db, SUMMARIES_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort locally by createdAt desc to avoid composite index requirement
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching summaries:", error);
    throw error;
  }
};

export const deleteSummary = async (summaryId) => {
  if (!db) return;
  try {
    const docRef = doc(db, SUMMARIES_COLLECTION, summaryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting summary:", error);
    throw error;
  }
};
