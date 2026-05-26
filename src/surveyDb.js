import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase";

const SURVEY_ID = "medison-metric-blind-test-v1";
const LOCAL_STORAGE_KEY = "medison_metric_blind_test_participants";

function normalizeEvaluatorId(evaluatorId) {
  return String(evaluatorId || "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
}

export function makeEvaluatorKey(evaluatorId) {
  return encodeURIComponent(normalizeEvaluatorId(evaluatorId));
}

function readLocalParticipants() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalParticipants(items) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

function upsertLocalParticipant(evaluatorId, updater) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);
  const items = readLocalParticipants();
  const index = items.findIndex((item) => item.evaluatorKey === evaluatorKey);
  const current =
    index >= 0
      ? items[index]
      : {
          evaluatorId,
          evaluatorKey,
          answers: {},
          completed: false,
          createdAt: new Date().toISOString(),
        };

  const nextItem = updater(current);

  if (index >= 0) items[index] = nextItem;
  else items.push(nextItem);

  writeLocalParticipants(items);
  window.dispatchEvent(new Event("medison-local-storage-update"));
  return nextItem;
}

function participantRef(evaluatorId) {
  return doc(db, "surveys", SURVEY_ID, "participants", makeEvaluatorKey(evaluatorId));
}

function participantsCollectionRef() {
  return collection(db, "surveys", SURVEY_ID, "participants");
}

export async function loadOrCreateParticipant(evaluatorId) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);
  if (!evaluatorKey) throw new Error("evaluatorId is required");

  if (!isFirebaseEnabled) {
    return upsertLocalParticipant(evaluatorId, (current) => ({
      ...current,
      evaluatorId,
      evaluatorKey,
      updatedAt: new Date().toISOString(),
    }));
  }

  const ref = participantRef(evaluatorId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return {
      evaluatorKey,
      ...snap.data(),
    };
  }

  const participant = {
    evaluatorId,
    evaluatorKey,
    answers: {},
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, participant);

  return {
    ...participant,
    createdAt: null,
    updatedAt: null,
  };
}

export async function saveMetricScore({ evaluatorId, questionId, candidateId, metricId, score }) {
  if (!evaluatorId || !questionId || !candidateId || !metricId) {
    throw new Error("Missing score fields");
  }

  if (!isFirebaseEnabled) {
    upsertLocalParticipant(evaluatorId, (current) => ({
      ...current,
      answers: {
        ...(current.answers || {}),
        [questionId]: {
          ...((current.answers || {})[questionId] || {}),
          [candidateId]: {
            ...(((current.answers || {})[questionId] || {})[candidateId] || {}),
            [metricId]: score,
          },
        },
      },
      updatedAt: new Date().toISOString(),
    }));
    return;
  }

  await setDoc(
    participantRef(evaluatorId),
    {
      evaluatorId,
      evaluatorKey: makeEvaluatorKey(evaluatorId),
      answers: {
        [questionId]: {
          [candidateId]: {
            [metricId]: score,
          },
        },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function markParticipantComplete(evaluatorId) {
  if (!evaluatorId) return;

  if (!isFirebaseEnabled) {
    upsertLocalParticipant(evaluatorId, (current) => ({
      ...current,
      completed: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return;
  }

  await updateDoc(participantRef(evaluatorId), {
    completed: true,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeParticipants(callback) {
  if (!isFirebaseEnabled) {
    const emit = () => callback(readLocalParticipants());
    emit();
    window.addEventListener("medison-local-storage-update", emit);
    window.addEventListener("storage", emit);
    return () => {
      window.removeEventListener("medison-local-storage-update", emit);
      window.removeEventListener("storage", emit);
    };
  }

  return onSnapshot(participantsCollectionRef(), (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({
      evaluatorKey: docSnap.id,
      ...docSnap.data(),
    }));
    callback(items);
  });
}
