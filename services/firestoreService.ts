
import { db, isMockMode } from "../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, onSnapshot, setDoc, writeBatch } from "firebase/firestore";

export interface TodoItem {
  id?: string;
  text: string;
  author: string;
  isCompleted: boolean;
  createdAt: any;
}

const COLLECTION_NAME = "todos";

// --- MOCK SYSTEM FOR OFFLINE MODE ---
const listeners: Record<string, Set<(data: any[]) => void>> = {};

const getLocalData = (key: string): any[] => {
  try {
    const item = localStorage.getItem(`gm_mock_${key}`);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = (key: string, data: any[]) => {
  localStorage.setItem(`gm_mock_${key}`, JSON.stringify(data));
  notifyListeners(key, data);
};

const notifyListeners = (key: string, data: any[]) => {
  if (listeners[key]) {
    listeners[key].forEach(cb => cb(data));
  }
};

// --- CRUD Operations ---

export const addTodo = async (text: string, author: string) => {
  if (isMockMode || !db) {
    const todos = getLocalData(COLLECTION_NAME);
    const newTodo = {
      id: `mock-todo-${Date.now()}`,
      text,
      author,
      isCompleted: false,
      createdAt: { seconds: Date.now() / 1000 }
    };
    setLocalData(COLLECTION_NAME, [newTodo, ...todos]);
    return;
  }

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
  if (isMockMode || !db) {
    return getLocalData(COLLECTION_NAME) as TodoItem[];
  }

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
  if (isMockMode || !db) {
    const todos = getLocalData(COLLECTION_NAME);
    const updated = todos.map((t: any) => t.id === id ? { ...t, ...updates } : t);
    setLocalData(COLLECTION_NAME, updated);
    return;
  }

  try {
    const todoRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(todoRef, updates);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteTodo = async (id: string) => {
  if (isMockMode || !db) {
    const todos = getLocalData(COLLECTION_NAME);
    const filtered = todos.filter((t: any) => t.id !== id);
    setLocalData(COLLECTION_NAME, filtered);
    return;
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

// --- Generic Sync Logic ---

// 1. Subscribe (Real-time Sync)
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  if (isMockMode || !db) {
    // Register listener
    if (!listeners[collectionName]) listeners[collectionName] = new Set();
    listeners[collectionName].add(callback);
    
    // Initial call
    const current = getLocalData(collectionName);
    callback(current);

    // Return unsubscribe function
    return () => {
      if (listeners[collectionName]) listeners[collectionName].delete(callback);
    };
  }

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
  if (isMockMode || !db) {
    const items = getLocalData(collectionName);
    const existingIndex = items.findIndex((i: any) => i.id === data.id);
    
    let newItems;
    if (existingIndex >= 0) {
        newItems = [...items];
        newItems[existingIndex] = { ...newItems[existingIndex], ...data };
    } else {
        // Ensure ID
        const newItem = { ...data, id: data.id || `mock-${collectionName}-${Date.now()}` };
        newItems = [...items, newItem];
    }
    setLocalData(collectionName, newItems);
    return;
  }

  try {
    if (data.id && !data.id.startsWith('temp-')) {
       await setDoc(doc(db, collectionName, data.id), data, { merge: true });
    } else {
       const { id, ...rest } = data; 
       await addDoc(collection(db, collectionName), rest);
    }
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
};

// 3. Update
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  if (isMockMode || !db) {
    const items = getLocalData(collectionName);
    const updated = items.map((i: any) => i.id === id ? { ...i, ...data } : i);
    setLocalData(collectionName, updated);
    return;
  }

  try {
    await updateDoc(doc(db, collectionName, id), data);
  } catch (error) {
    console.error(`Error updating ${collectionName}/${id}:`, error);
    throw error;
  }
};

// 4. Delete
export const deleteDocument = async (collectionName: string, id: string) => {
  if (isMockMode || !db) {
    const items = getLocalData(collectionName);
    const filtered = items.filter((i: any) => i.id !== id);
    setLocalData(collectionName, filtered);
    return;
  }

  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting ${collectionName}/${id}:`, error);
    throw error;
  }
};

// 5. Seed (Initial Data Upload)
export const seedCollection = async (collectionName: string, dataArray: any[]) => {
  if (isMockMode || !db) {
    // Only seed if empty
    const current = getLocalData(collectionName);
    if (current.length === 0) {
        setLocalData(collectionName, dataArray);
        console.log(`[Mock] Seeded ${collectionName}`);
    }
    return;
  }

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
