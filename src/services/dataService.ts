import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../config';
import { JournalEntry, Group } from '../types';
import { STORAGE_KEYS } from '../constants';

const STORAGE_KEY = STORAGE_KEYS.ENTRIES;

// Helper to get local entries
const getLocalEntries = async (): Promise<JournalEntry[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local entries:', error);
    return [];
  }
};

// Helper to save local entries
const saveLocalEntries = async (entries: JournalEntry[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving local entries:', error);
  }
};

const buildEntryFingerprint = (entry: Pick<JournalEntry, 'createdAt' | 'type' | 'content' | 'mediaUrl'>): string => {
  const content = (entry.content || '').trim();
  const media = entry.mediaUrl || '';
  return `${entry.createdAt}|${entry.type}|${content}|${media}`;
};

const sortByNewest = (entries: JournalEntry[]): JournalEntry[] =>
  [...entries].sort((a, b) => b.createdAt - a.createdAt);

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadMedia = async (uri: string): Promise<string> => {
  // Nếu là URL từ xa (http/https) hoặc không có uri thì trả về luôn
  if (!uri || uri.startsWith('http')) return uri;

  try {
    const formData = new FormData();
    
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    let type = 'image/jpeg';
    if (ext === 'mp4' || ext === 'mov') type = 'video/mp4';
    else if (ext === 'm4a' || ext === 'wav' || ext === 'mp3') type = 'audio/mpeg';

    // @ts-ignore - FormData trong React Native nhận object có uri
    formData.append('file', {
      uri,
      type,
      name: `upload.${ext}`,
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    console.error('Cloudinary error:', data);
    return uri;
  } catch (error) {
    console.error('Error uploading media to Cloudinary:', error);
    return uri;
  }
};

const fetchRemoteEntries = async (userId: string): Promise<JournalEntry[]> => {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  const remoteEntries: JournalEntry[] = [];
  querySnapshot.forEach((snapshot) => {
    remoteEntries.push({ id: snapshot.id, ...snapshot.data() } as JournalEntry);
  });
  return remoteEntries;
};

const mergeEntries = (remoteEntries: JournalEntry[], localEntries: JournalEntry[]): JournalEntry[] => {
  const remoteFingerprints = new Set(remoteEntries.map(buildEntryFingerprint));
  const merged = [...remoteEntries];
  localEntries.forEach((entry) => {
    const fingerprint = buildEntryFingerprint(entry);
    if (!remoteFingerprints.has(fingerprint)) {
      merged.push(entry);
    }
  });
  return sortByNewest(merged);
};

export const getEntries = async (
  userId?: string | null,
  pageSize: number = 20,
  lastVisibleDoc: any = null
): Promise<{ entries: JournalEntry[]; lastDoc: any; hasMore: boolean }> => {
  const localEntries = await getLocalEntries();
  
  // Neu khong co userId (Guest mode)
  if (!userId) {
    const sorted = sortByNewest(localEntries);
    // Gia lap phan trang cho local
    const startIdx = lastVisibleDoc ? (typeof lastVisibleDoc === 'number' ? lastVisibleDoc : 0) : 0;
    const paginated = sorted.slice(startIdx, startIdx + pageSize);
    return {
      entries: paginated,
      lastDoc: startIdx + pageSize >= sorted.length ? null : startIdx + pageSize,
      hasMore: startIdx + pageSize < sorted.length
    };
  }

  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    let q = query(entriesRef, orderBy('createdAt', 'desc'), limit(pageSize));
    
    if (lastVisibleDoc) {
      q = query(entriesRef, orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
    }

    const querySnapshot = await getDocs(q);
    const remoteEntries: JournalEntry[] = [];
    querySnapshot.forEach((snapshot) => {
      remoteEntries.push({ id: snapshot.id, ...snapshot.data() } as JournalEntry);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Luu local cache chi cho trang dau tien de tranh lam phinh AsyncStorage
    if (!lastVisibleDoc) {
      const merged = mergeEntries(remoteEntries, localEntries);
      await saveLocalEntries(merged);
    }

    return {
      entries: remoteEntries,
      lastDoc: lastDoc || null,
      hasMore: querySnapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Error fetching entries:', error);
    // Fallback sang local
    const sorted = sortByNewest(localEntries);
    return { entries: sorted.slice(0, pageSize), lastDoc: null, hasMore: false };
  }
};

const replaceLocalEntryId = async (localId: string, newId: string): Promise<void> => {
  const currentEntries = await getLocalEntries();
  const updatedEntries = currentEntries.map((entry) =>
    entry.id === localId ? { ...entry, id: newId } : entry
  );
  await saveLocalEntries(updatedEntries);
};

export const saveEntry = async (
  userId: string | null | undefined,
  entry: Omit<JournalEntry, 'id'>
): Promise<JournalEntry> => {
  const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const localEntry: JournalEntry = { ...entry, id: localId };

  const currentEntries = await getLocalEntries();
  await saveLocalEntries([localEntry, ...currentEntries]);

  if (!userId) {
    return localEntry;
  }

  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const docRef = await addDoc(entriesRef, { ...entry, userId });
    const cloudEntry: JournalEntry = { ...entry, id: docRef.id, userId };
    await replaceLocalEntryId(localId, docRef.id);
    return cloudEntry;
  } catch (error) {
    console.error('Error saving entry to cloud:', error);
    return localEntry;
  }
};

export const deleteEntry = async (userId: string | null | undefined, entryId: string): Promise<void> => {
  try {
    // 1. Delete from Firestore if user is logged in
    if (userId) {
      await deleteDoc(doc(db, 'users', userId, 'entries', entryId));
    }

    // 2. Update Local Cache (always)
    const currentEntries = await getLocalEntries();
    const updatedEntries = currentEntries.filter(e => e.id !== entryId);
    await saveLocalEntries(updatedEntries);

  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

export const syncLocalEntriesToCloud = async (userId: string): Promise<{ synced: number; skipped: number }> => {
  const localEntries = await getLocalEntries();
  if (localEntries.length === 0) {
    return { synced: 0, skipped: 0 };
  }

  const remoteEntries = await fetchRemoteEntries(userId);
  const remoteFingerprints = new Set(remoteEntries.map(buildEntryFingerprint));

  let synced = 0;
  let skipped = 0;
  const newlySynced: JournalEntry[] = [];

  for (const entry of localEntries) {
    const fingerprint = buildEntryFingerprint(entry);
    if (remoteFingerprints.has(fingerprint)) {
      skipped += 1;
      continue;
    }

    const { id: _localId, ...payload } = entry;
    
    // Upload media if local
    if (payload.mediaUrl) {
      payload.localUri = payload.mediaUrl; // Luu lai link local
      payload.mediaUrl = await uploadMedia(payload.mediaUrl);
    }

    const docRef = await addDoc(collection(db, 'users', userId, 'entries'), {
      ...payload,
      userId
    });
    newlySynced.push({ ...payload, id: docRef.id, userId } as JournalEntry);
    synced += 1;
  }

  const merged = mergeEntries([...remoteEntries, ...newlySynced], []);
  await saveLocalEntries(merged);

  return { synced, skipped };
};

export const clearAllData = async (userId?: string | null): Promise<void> => {
  try {
    // 1. Xóa dữ liệu cục bộ (Local)
    await AsyncStorage.removeItem(STORAGE_KEY);
    
    // 2. Xóa dữ liệu trên Cloud (Firestore) nếu người dùng đã đăng nhập
    if (userId) {
      const entriesRef = collection(db, 'users', userId, 'entries');
      const snapshot = await getDocs(entriesRef);
      
      const promises = snapshot.docs.map(docSnap => 
        deleteDoc(doc(db, 'users', userId, 'entries', docSnap.id))
      );
      
      await Promise.all(promises);
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// ==========================================
// USER SERVICES
// ==========================================

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('name', '==', username.trim()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const updateUserProfile = async (userId: string, data: { name?: string; avatar?: string }): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  let finalData = { ...data };
  
  if (data.avatar) {
    const remoteUrl = await uploadMedia(data.avatar);
    finalData.avatar = remoteUrl;
  }
  
  await updateDoc(userRef, finalData);
};

// ==========================================
// GROUP SERVICES
// ==========================================

export const createGroup = async (name: string, description: string, userId: string): Promise<Group> => {
  const currentGroups = await getUserGroups(userId);
  if (currentGroups.length >= 3) {
    throw new Error('Bạn đã đạt giới hạn tối đa 3 nhóm.');
  }

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const groupData = {
    name: joinCode, // Tên mặc định là mã Join Code
    description,
    members: [userId],
    admins: [userId],
    createdBy: userId,
    createdAt: Date.now(),
    joinCode
  };
  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return { id: docRef.id, ...groupData } as Group;
};

export const joinGroup = async (joinCode: string, userId: string): Promise<Group | null> => {
  const currentGroups = await getUserGroups(userId);
  if (currentGroups.length >= 3) {
    throw new Error('Bạn đã đạt giới hạn tối đa 3 nhóm.');
  }

  const q = query(collection(db, 'groups'), where('joinCode', '==', joinCode.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data() as Group;
  
  if (!groupData.members.includes(userId)) {
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      members: arrayUnion(userId)
    });
    groupData.members.push(userId);
  }
  
  return { ...groupData, id: groupDoc.id };
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(userId),
    admins: arrayRemove(userId)
  });
};

export const setLocalGroupName = async (groupId: string, userId: string, newName: string): Promise<void> => {
  try {
    const key = `local_group_names_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    const names = stored ? JSON.parse(stored) : {};
    names[groupId] = newName;
    await AsyncStorage.setItem(key, JSON.stringify(names));
  } catch (error) {
    console.error('Error saving local group name:', error);
  }
};

const getLocalGroupNames = async (userId: string): Promise<Record<string, string>> => {
  try {
    const key = `local_group_names_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  if (!userId) return [];
  const q = query(collection(db, 'groups'), where('members', 'array-contains', userId));
  const snapshot = await getDocs(q);
  
  const localNames = await getLocalGroupNames(userId);
  const groups: Group[] = [];
  
  snapshot.forEach(docSnap => {
    const data = docSnap.data() as Group;
    const id = docSnap.id;
    groups.push({ 
      ...data, 
      id, 
      localName: localNames[id] || undefined 
    });
  });
  return groups;
};

export const getGroupEntries = async (groupId: string): Promise<JournalEntry[]> => {
  const entriesRef = collection(db, 'groups', groupId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  snapshot.forEach(docSnap => {
    entries.push({ id: docSnap.id, ...docSnap.data() } as JournalEntry);
  });
  return entries;
};

export const deleteGroupEntry = async (groupId: string, entryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'groups', groupId, 'entries', entryId));
  } catch (error) {
    console.error('Error deleting group entry:', error);
    throw error;
  }
};

export const saveEntryToDestinations = async (
  destinations: string[], 
  entry: Omit<JournalEntry, 'id'>,
  userId: string | null
): Promise<void> => {
  // If not logged in, just save locally
  if (!userId) {
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localEntry: JournalEntry = { ...entry, id: localId };
    const currentEntries = await getLocalEntries();
    await saveLocalEntries([localEntry, ...currentEntries]);
    return;
  }

  // Upload media if exists
  let finalEntry = { ...entry };
  if (entry.mediaUrl) {
    // Giữ lại đường dẫn local gốc
    finalEntry.localUri = entry.mediaUrl;
    
    // Upload lên cloud để lấy link dự phòng và chia sẻ
    const remoteUrl = await uploadMedia(entry.mediaUrl);
    finalEntry.mediaUrl = remoteUrl;
  }

  const promises = [];

  // Save to personal diary
  if (destinations.includes('personal')) {
    promises.push(saveEntry(userId, finalEntry));
  }

  // Save to groups
  const groupDestinations = destinations.filter(d => d !== 'personal');
  for (const groupId of groupDestinations) {
    const groupEntryRef = collection(db, 'groups', groupId, 'entries');
    promises.push(addDoc(groupEntryRef, { ...finalEntry, userId, groupId }));
  }

  await Promise.all(promises);
};

export const setDefaultDestinations = async (userId: string, destinations: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`default_dests_${userId}`, JSON.stringify(destinations));
  } catch (error) {
    console.error('Error saving default destinations:', error);
  }
};

export const getDefaultDestinations = async (userId: string): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(`default_dests_${userId}`);
    return stored ? JSON.parse(stored) : ['personal'];
  } catch (error) {
    console.error('Error getting default destinations:', error);
    return ['personal'];
  }
};

