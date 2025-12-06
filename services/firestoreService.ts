
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, onSnapshot, setDoc, writeBatch } from "firebase/firestore";

export interface TodoItem {
  id?: string;
  text: string;
  author: string;
  isCompleted: boolean;
  createdAt: any;
}

const COLLECTION_NAME = "todos";

// --- Existing Todos Logic (Kept for compatibility) ---
export const addTodo = async (text: string, author: string) => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      text,
      author,
      isCompleted: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getAllTodos = async (): Promise<TodoItem[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TodoItem[];
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

export const updateTodo = async (id: string, updates: Partial<TodoItem>) => {
  try {
    const todoRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(todoRef, updates);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteTodo = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

// --- New Generic Sync Logic ---

// 1. Subscribe (Real-time Sync)
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  // Default query, can be enhanced to support ordering if needed
  const q = query(collection(db, collectionName));
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
};

// 2. Save (Add or Overwrite if ID exists)
export const saveDocument = async (collectionName: string, data: any) => {
  try {
    if (data.id && !data.id.startsWith('temp-')) {
       // If ID exists and is valid, use setDoc (merge: true for safety)
       await setDoc(doc(db, collectionName, data.id), data, { merge: true });
    } else {
       // If no ID or temp ID, add as new doc
       const { id, ...rest } = data; // remove temp id
       await addDoc(collection(db, collectionName), rest);
    }
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
};

// 3. Update
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    await updateDoc(doc(db, collectionName, id), data);
  } catch (error) {
    console.error(`Error updating ${collectionName}/${id}:`, error);
    throw error;
  }
};

// 4. Delete
export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting ${collectionName}/${id}:`, error);
    throw error;
  }
};

// 5. Seed (Initial Data Upload)
export const seedCollection = async (collectionName: string, dataArray: any[]) => {
  try {
    const batch = writeBatch(db);
    dataArray.forEach(data => {
      const docRef = data.id ? doc(db, collectionName, data.id) : doc(collection(db, collectionName));
      batch.set(docRef, data);
    });
    await batch.commit();
    console.log(`Seeded ${collectionName} with ${dataArray.length} items.`);
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
  }
};
