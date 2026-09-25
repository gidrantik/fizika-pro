// Results stay on this device until Supabase confirms receipt.
const PENDING_RESULT_PREFIX = 'pendingResult:v1:';
let resultFlushPromise = null;
let resultSyncError = false;
let resultSyncSucceeded = false;
let resultStoreError = false;

function newResultId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, digit => {
    const value = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    return (digit === 'x' ? value : (value & 3) | 8).toString(16);
  });
}

function pendingResults() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PENDING_RESULT_PREFIX)) continue;
    const payload = JSON.parse(localStorage.getItem(key));
    if (!payload || payload.id !== key.slice(PENDING_RESULT_PREFIX.length)) {
      throw new Error('Повреждена локальная очередь результатов');
    }
    results.push({ key, payload });
  }
  return results;
}

function updateResultSyncStatus() {
  let count;
  try {
    count = pendingResults().length;
  } catch (error) {
    console.warn('[Статистика] не удалось прочитать очередь:', error);
    count = null;
  }

  let message = '';
  if (resultStoreError) message = 'Новый результат не удалось сохранить. Не закрывай страницу.';
  else if (count === null) message = 'Не удалось прочитать сохранённые результаты на этом устройстве.';
  else if (count > 0 && resultSyncError) message = `Не удалось отправить результаты (${count}). Они сохранены на этом устройстве.`;
  else if (count > 0) message = `Ожидают отправки: ${count}`;
  else if (resultSyncError) message = 'Не удалось сохранить результат на этом устройстве. Не закрывай страницу.';
  else if (resultSyncSucceeded) message = 'Результаты отправлены преподавателю.';

  document.querySelectorAll('[data-sync-notice]').forEach(notice => {
    notice.classList.toggle('hidden', !message);
    notice.querySelector('[data-sync-status]').textContent = message;
    notice.querySelector('[data-sync-retry]').classList.toggle('hidden', !count);
  });
}

function queueResult(record) {
  try {
    const payload = {
      id: record.id,
      student_name: record.student,
      device_id: getDeviceId(),
      exam: record.exam,
      topic_id: record.topic,
      topic_name: record.topicName,
      correct: record.correct,
      total: record.total,
      pct: record.pct,
      details: record.details
    };
    localStorage.setItem(PENDING_RESULT_PREFIX + payload.id, JSON.stringify(payload));
  } catch (error) {
    console.error('[Статистика] результат не сохранён:', error);
    resultStoreError = true;
    updateResultSyncStatus();
    return false;
  }

  resultStoreError = false;
  resultSyncError = false;
  resultSyncSucceeded = false;
  updateResultSyncStatus();
  void flushPendingResults();
  return true;
}

async function sendQueuedResult(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/results?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      console.warn('[Статистика] сервер отклонил результат:', response.status);
    }
    return response.ok;
  } finally {
    clearTimeout(timeout);
  }
}

function flushPendingResults() {
  if (resultFlushPromise) return resultFlushPromise;
  resultFlushPromise = Promise.resolve().then(async () => {
    try {
      const processed = new Set();
      while (true) {
        const next = pendingResults().find(entry => !processed.has(entry.key));
        if (!next) break;
        processed.add(next.key);

        if (!await sendQueuedResult(next.payload)) {
          resultSyncError = true;
          break;
        }

        localStorage.removeItem(next.key);
        resultSyncError = false;
        resultSyncSucceeded = true;
        updateResultSyncStatus();
      }
    } catch (error) {
      console.warn('[Статистика] отправка отложена:', error);
      resultSyncError = true;
    }
  }).finally(() => {
    resultFlushPromise = null;
    updateResultSyncStatus();
  });
  return resultFlushPromise;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-sync-retry]').forEach(button => {
    button.addEventListener('click', () => void flushPendingResults());
  });
  updateResultSyncStatus();
  void flushPendingResults();
});
window.addEventListener('online', () => void flushPendingResults());
