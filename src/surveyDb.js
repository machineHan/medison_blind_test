import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from './firebase';

export const SURVEY_ID = 'medison-metric-blind-test-v1';
const LOCAL_STORAGE_KEY = `survey:${SURVEY_ID}:participants`;

function normalizeEvaluatorId(evaluatorId) {
  return String(evaluatorId || '').trim().replace(/\s+/g, '_').toLowerCase();
}

function evaluatorKey(evaluatorId) {
  return encodeURIComponent(normalizeEvaluatorId(evaluatorId));
}

function nowIso() {
  return new Date().toISOString();
}

function readLocalParticipants() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalParticipants(items) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

function upsertLocalParticipant(participant) {
  const items = readLocalParticipants();
  const idx = items.findIndex((item) => item.evaluatorKey === participant.evaluatorKey);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...participant };
  } else {
    items.push(participant);
  }
  writeLocalParticipants(items);
  window.dispatchEvent(new Event('medison-local-participants-changed'));
  return participant;
}

function participantsCollectionRef() {
  return collection(db, 'surveys', SURVEY_ID, 'participants');
}

function participantDocRef(evaluatorId) {
  return doc(db, 'surveys', SURVEY_ID, 'participants', evaluatorKey(evaluatorId));
}

export async function loadOrCreateParticipant(evaluatorId) {
  const cleanId = String(evaluatorId || '').trim();
  const key = evaluatorKey(cleanId);

  if (!cleanId) {
    throw new Error('Evaluator ID is required.');
  }

  if (!isFirebaseEnabled) {
    const items = readLocalParticipants();
    const existing = items.find((item) => item.evaluatorKey === key);
    if (existing) return existing;

    const participant = {
      evaluatorId: cleanId,
      evaluatorKey: key,
      answers: {},
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return upsertLocalParticipant(participant);
  }

  const ref = participantDocRef(cleanId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { evaluatorKey: key, ...snap.data() };
  }

  const participant = {
    evaluatorId: cleanId,
    evaluatorKey: key,
    answers: {},
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, participant);
  return { ...participant, createdAt: null, updatedAt: null };
}

export async function saveMetricScore({ evaluatorId, questionId, candidateId, metricId, score }) {
  const cleanId = String(evaluatorId || '').trim();
  const key = evaluatorKey(cleanId);

  if (!isFirebaseEnabled) {
    const items = readLocalParticipants();
    const existing = items.find((item) => item.evaluatorKey === key) || {
      evaluatorId: cleanId,
      evaluatorKey: key,
      answers: {},
      completedAt: null,
      createdAt: nowIso(),
    };

    const next = {
      ...existing,
      answers: {
        ...(existing.answers || {}),
        [questionId]: {
          ...((existing.answers || {})[questionId] || {}),
          [candidateId]: {
            ...(((existing.answers || {})[questionId] || {})[candidateId] || {}),
            [metricId]: score,
          },
        },
      },
      updatedAt: nowIso(),
    };
    upsertLocalParticipant(next);
    return;
  }

  await updateDoc(participantDocRef(cleanId), {
    [`answers.${questionId}.${candidateId}.${metricId}`]: score,
    updatedAt: serverTimestamp(),
  });
}

export async function markParticipantComplete(evaluatorId) {
  const cleanId = String(evaluatorId || '').trim();
  const key = evaluatorKey(cleanId);

  if (!isFirebaseEnabled) {
    const items = readLocalParticipants();
    const existing = items.find((item) => item.evaluatorKey === key);
    if (existing) {
      upsertLocalParticipant({ ...existing, completedAt: nowIso(), updatedAt: nowIso() });
    }
    return;
  }

  await updateDoc(participantDocRef(cleanId), {
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeParticipants(callback) {
  if (!isFirebaseEnabled) {
    const emit = () => callback(readLocalParticipants());
    emit();
    window.addEventListener('medison-local-participants-changed', emit);
    window.addEventListener('storage', emit);
    return () => {
      window.removeEventListener('medison-local-participants-changed', emit);
      window.removeEventListener('storage', emit);
    };
  }

  return onSnapshot(participantsCollectionRef(), (snapshot) => {
    const items = snapshot.docs.map((item) => ({ evaluatorKey: item.id, ...item.data() }));
    callback(items);
  });
}

export async function deleteParticipant(evaluatorIdOrKey) {
  const key = evaluatorKey(evaluatorIdOrKey);

  if (!isFirebaseEnabled) {
    const items = readLocalParticipants().filter((item) => item.evaluatorKey !== key);
    writeLocalParticipants(items);
    window.dispatchEvent(new Event('medison-local-participants-changed'));
    return;
  }

  await deleteDoc(doc(db, 'surveys', SURVEY_ID, 'participants', key));
}
