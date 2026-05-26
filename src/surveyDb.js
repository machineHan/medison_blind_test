import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase";

export const SURVEY_ID = "medison-metric-2026-v1";

const LOCAL_KEY = `${SURVEY_ID}:participants`;

export function makeEvaluatorKey(evaluatorId) {
  return encodeURIComponent(String(evaluatorId || "anonymous").trim().replace(/\s+/g, "_").toLowerCase());
}

function participantCollectionRef() {
  return collection(db, "surveys", SURVEY_ID, "participants");
}

function participantDocRef(evaluatorKey) {
  return doc(db, "surveys", SURVEY_ID, "participants", evaluatorKey);
}

function readLocalParticipants() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalParticipants(participants) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(participants));
  window.dispatchEvent(new Event("medison-local-participants-updated"));
}

function nowIso() {
  return new Date().toISOString();
}

export async function loadOrCreateParticipant(evaluatorId) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);

  if (isFirebaseEnabled) {
    const ref = participantDocRef(evaluatorKey);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      return { evaluatorKey, ...snapshot.data() };
    }

    const participant = {
      evaluatorId,
      evaluatorKey,
      answers: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
    };

    await setDoc(ref, participant);
    return { ...participant, createdAt: null, updatedAt: null };
  }

  const participants = readLocalParticipants();
  const existing = participants.find((item) => item.evaluatorKey === evaluatorKey);

  if (existing) return existing;

  const participant = {
    evaluatorId,
    evaluatorKey,
    answers: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
  };

  writeLocalParticipants([...participants, participant]);
  return participant;
}

export async function saveMetricScore({ evaluatorId, questionId, candidateId, metricId, score }) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);

  if (isFirebaseEnabled) {
    const ref = participantDocRef(evaluatorKey);
    await setDoc(
      ref,
      {
        evaluatorId,
        evaluatorKey,
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
    return;
  }

  const participants = readLocalParticipants();
  const index = participants.findIndex((item) => item.evaluatorKey === evaluatorKey);

  const participant =
    index >= 0
      ? participants[index]
      : {
          evaluatorId,
          evaluatorKey,
          answers: {},
          createdAt: nowIso(),
          completedAt: null,
        };

  participant.answers = participant.answers || {};
  participant.answers[questionId] = participant.answers[questionId] || {};
  participant.answers[questionId][candidateId] = participant.answers[questionId][candidateId] || {};
  participant.answers[questionId][candidateId][metricId] = score;
  participant.updatedAt = nowIso();

  if (index >= 0) participants[index] = participant;
  else participants.push(participant);

  writeLocalParticipants(participants);
}

export async function markParticipantComplete(evaluatorId) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);

  if (isFirebaseEnabled) {
    await updateDoc(participantDocRef(evaluatorKey), {
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const participants = readLocalParticipants();
  const index = participants.findIndex((item) => item.evaluatorKey === evaluatorKey);
  if (index >= 0) {
    participants[index].completedAt = nowIso();
    participants[index].updatedAt = nowIso();
    writeLocalParticipants(participants);
  }
}

export function subscribeParticipants(callback) {
  if (isFirebaseEnabled) {
    return onSnapshot(participantCollectionRef(), (snapshot) => {
      const participants = snapshot.docs.map((item) => ({
        evaluatorKey: item.id,
        ...item.data(),
      }));
      callback(participants);
    });
  }

  const emit = () => callback(readLocalParticipants());
  emit();

  window.addEventListener("medison-local-participants-updated", emit);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("medison-local-participants-updated", emit);
    window.removeEventListener("storage", emit);
  };
}

export async function deleteParticipant(evaluatorKey) {
  if (isFirebaseEnabled) {
    await deleteDoc(participantDocRef(evaluatorKey));
    return;
  }

  const participants = readLocalParticipants().filter((item) => item.evaluatorKey !== evaluatorKey);
  writeLocalParticipants(participants);
}
