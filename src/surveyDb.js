const WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL || '';
const LOCAL_STORAGE_KEY = 'medison_metric_blind_test_participants';

export const isGoogleSheetsEnabled = Boolean(WEB_APP_URL);

function normalizeEvaluatorId(evaluatorId) {
  return String(evaluatorId || '').trim().replace(/\s+/g, '_').toLowerCase();
}

function makeEvaluatorKey(evaluatorId) {
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
  const current = index >= 0 ? items[index] : {
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
  window.dispatchEvent(new Event('medison-local-storage-update'));
  return nextItem;
}

function mergeParticipantsFromRows(rows) {
  const byKey = new Map();
  rows.forEach((row) => {
    const evaluatorId = row.evaluatorId || '';
    if (!evaluatorId) return;
    const evaluatorKey = row.evaluatorKey || makeEvaluatorKey(evaluatorId);
    if (!byKey.has(evaluatorKey)) {
      byKey.set(evaluatorKey, {
        evaluatorId,
        evaluatorKey,
        answers: {},
        completed: false,
      });
    }
    const participant = byKey.get(evaluatorKey);
    if (row.type === 'complete') {
      participant.completed = true;
      participant.completedAt = row.timestamp || null;
      return;
    }
    if (!row.questionId || !row.candidateId || !row.metricId) return;
    const score = Number(row.score);
    if (!Number.isFinite(score)) return;
    participant.answers[row.questionId] = {
      ...(participant.answers[row.questionId] || {}),
      [row.candidateId]: {
        ...((participant.answers[row.questionId] || {})[row.candidateId] || {}),
        [row.metricId]: score,
      },
    };
  });
  return Array.from(byKey.values());
}

function jsonpFetchParticipants() {
  return new Promise((resolve, reject) => {
    const callbackName = `__medisonSheetsCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheets 응답 시간이 초과되었습니다.'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      if (!payload?.ok) {
        reject(new Error(payload?.error || 'Google Sheets 데이터를 읽지 못했습니다.'));
        return;
      }
      resolve(mergeParticipantsFromRows(payload.rows || []));
    };

    const sep = WEB_APP_URL.includes('?') ? '&' : '?';
    script.src = `${WEB_APP_URL}${sep}callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Google Sheets Apps Script URL을 불러오지 못했습니다.'));
    };
    document.body.appendChild(script);
  });
}

async function postToSheets(payload) {
  if (!isGoogleSheetsEnabled) return;
  const form = new URLSearchParams();
  form.set('payload', JSON.stringify(payload));
  await fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: form.toString(),
  });
}

export async function loadOrCreateParticipant(evaluatorId) {
  const evaluatorKey = makeEvaluatorKey(evaluatorId);
  if (!evaluatorKey) throw new Error('evaluatorId is required');

  const local = upsertLocalParticipant(evaluatorId, (current) => ({
    ...current,
    evaluatorId,
    evaluatorKey,
    updatedAt: new Date().toISOString(),
  }));

  if (isGoogleSheetsEnabled) {
    await postToSheets({
      type: 'participant',
      evaluatorId,
      evaluatorKey,
      timestamp: new Date().toISOString(),
    });
  }

  return local;
}

export async function saveMetricScore(payload) {
  const { evaluatorId, questionId, candidateId, metricId, score } = payload;
  if (!evaluatorId || !questionId || !candidateId || !metricId) {
    throw new Error('Missing score fields');
  }

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

  if (isGoogleSheetsEnabled) {
    await postToSheets({
      type: 'score',
      timestamp: new Date().toISOString(),
      ...payload,
      evaluatorKey: makeEvaluatorKey(evaluatorId),
    });
  }
}

export async function markParticipantComplete(evaluatorId) {
  if (!evaluatorId) return;
  upsertLocalParticipant(evaluatorId, (current) => ({
    ...current,
    completed: true,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  if (isGoogleSheetsEnabled) {
    await postToSheets({
      type: 'complete',
      evaluatorId,
      evaluatorKey: makeEvaluatorKey(evaluatorId),
      timestamp: new Date().toISOString(),
    });
  }
}

export function subscribeParticipants(callback) {
  if (!isGoogleSheetsEnabled) {
    const emit = () => callback(readLocalParticipants());
    emit();
    window.addEventListener('medison-local-storage-update', emit);
    window.addEventListener('storage', emit);
    return () => {
      window.removeEventListener('medison-local-storage-update', emit);
      window.removeEventListener('storage', emit);
    };
  }

  let stopped = false;
  let intervalId = null;

  const poll = async () => {
    try {
      const items = await jsonpFetchParticipants();
      if (!stopped) callback(items);
    } catch (error) {
      console.warn(error);
      if (!stopped) callback(readLocalParticipants());
    }
  };

  poll();
  intervalId = window.setInterval(poll, 5000);
  return () => {
    stopped = true;
    if (intervalId) window.clearInterval(intervalId);
  };
}
