// ===== ЗАГРУЗКА ТЕМЫ =====

let currentTopic = null;

async function loadTopic() {
  const params = new URLSearchParams(window.location.search);
  const exam   = params.get('exam');
  const topicId = params.get('topic');

  if (!exam || !topicId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`data/${topicId}.json`);
    if (!res.ok) throw new Error('not found');
    currentTopic = await res.json();
  } catch {
    document.querySelector('.topic-page').innerHTML =
      '<p style="padding:60px 24px;color:var(--text-muted)">Тема не найдена. <a href="index.html">← Вернуться</a></p>';
    return;
  }

  renderTopic(exam, currentTopic);
}

// Определяет подсказку в поле ввода:
// multiChoice  → "Например: 35"
// табличный код → "Например: 43"
// числовой ответ → "Введи число..."
function getAnswerPlaceholder(task) {
  if (task.multiChoice) return 'Например: 35';
  const ans = String(task.answer);
  if (/^[1-4]{2}$/.test(ans)) return `Например: ${ans}`;
  return 'Введи число...';
}

function renderTopic(exam, data) {
  // Хлебные крошки
  document.getElementById('breadcrumb-exam').textContent  = exam.toUpperCase();
  document.getElementById('breadcrumb-topic').textContent = data.title;
  document.title = `Физика без боли — ${data.title}`;

  // Заголовок
  document.getElementById('topic-title').textContent = data.title;

  // Теория
  document.getElementById('theory-content').innerHTML = data.theory;

  // Формулы
  if (data.formulas && data.formulas.length > 0) {
    const sec  = document.getElementById('formulas-section');
    const list = document.getElementById('formulas-list');
    sec.classList.remove('hidden');
    list.innerHTML = data.formulas.map(f => `
      <div class="formula-item">
        <div class="formula-expr">${f.expr}</div>
        <div class="formula-desc">${f.desc}</div>
      </div>
    `).join('');
  }

  // Задачи
  const tasksList = document.getElementById('tasks-list');
  tasksList.innerHTML = data.tasks.map((task, i) => {
    const placeholder = getAnswerPlaceholder(task);
    const inputmode   = task.multiChoice ? 'text' : 'decimal';
    const imgFallback = `onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<p class=\\"img-missing\\">⚠️ Изображение недоступно</p>')"`;
    const img  = task.image
      ? `<img class="task-image" src="${task.image}" alt="Рисунок к задаче ${i + 1}" ${imgFallback}>`
      : '';
    const imgs = task.images
      ? task.images.map((src, n) => `<img class="task-image" src="${src}" alt="Рисунок ${n + 1} к задаче ${i + 1}" ${imgFallback}>`).join('')
      : '';
    return `
    <div class="task-item" id="task-${i}">
      <div class="task-header">
        <div class="task-num" id="num-${i}">${i + 1}</div>
        <div class="task-label">Задача ${i + 1}</div>
      </div>
      <div class="task-text">${task.text}</div>
      ${img}${imgs}
      <div class="task-answer-row">
        <span class="answer-label">Ответ:</span>
        <input
          class="answer-input"
          id="answer-${i}"
          type="text"
          inputmode="${inputmode}"
          placeholder="${placeholder}"
          autocomplete="off"
        >
      </div>
      <div class="task-feedback" id="feedback-${i}"></div>
    </div>`;
  }).join('');
}

// ===== ПРОВЕРКА ОТВЕТОВ =====

function normalizeAnswer(raw) {
  return raw.trim().replace(',', '.');
}

function answersMatch(userRaw, correct, unordered = false) {
  const user = normalizeAnswer(userRaw);
  const ref  = String(correct).trim().replace(',', '.');

  // Точное совпадение строк
  if (user === ref) return true;

  // Числовое совпадение (3.0 vs 3)
  const uNum = parseFloat(user);
  const rNum = parseFloat(ref);
  if (!isNaN(uNum) && !isNaN(rNum) && uNum === rNum) return true;

  // Две цифры в любом порядке — только для multiChoice задач
  // (задачи на соответствие требуют строгого порядка!)
  if (unordered) {
    const uClean = user.replace(/\s/g, '');
    const rClean = ref.replace(/\s/g, '');
    if (/^\d{2}$/.test(uClean) && /^\d{2}$/.test(rClean)) {
      return uClean.split('').sort().join('') === rClean.split('').sort().join('');
    }
  }

  return false;
}

function checkAnswers() {
  if (!currentTopic) return;

  let correct = 0;
  const results = [];

  currentTopic.tasks.forEach((task, i) => {
    const input    = document.getElementById(`answer-${i}`);
    const taskEl   = document.getElementById(`task-${i}`);
    const numEl    = document.getElementById(`num-${i}`);
    const feedback = document.getElementById(`feedback-${i}`);
    const userVal  = input.value;

    input.disabled = true;

    const isCorrect = answersMatch(userVal, task.answer, !!task.multiChoice);
    results.push({ taskId: i + 1, correct: isCorrect, userAnswer: userVal });

    if (isCorrect) {
      correct++;
      taskEl.classList.add('correct');
      numEl.classList.add('correct');
      feedback.innerHTML = `<div class="feedback-correct">✓ Верно!</div>`;
    } else {
      taskEl.classList.add('wrong');
      numEl.classList.add('wrong');
      feedback.innerHTML = `
        <div class="feedback-wrong">
          ✗ Неверно. Твой ответ: <strong>${userVal || '—'}</strong> —
          правильный: <span class="correct-answer">${task.answer}</span>
        </div>
        ${task.hint ? `<div class="feedback-hint">💡 ${task.hint}</div>` : ''}
      `;
    }
  });

  const total = currentTopic.tasks.length;
  showResult(correct, total);

  // Переключаем кнопки
  document.getElementById('submit-btn').classList.add('hidden');
  document.getElementById('reset-btn').classList.remove('hidden');

  // Прокрутка к результату
  document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

  // Сохраняем в localStorage и отправляем статистику
  saveResult(correct, total, results);
}

// ===== РЕЗУЛЬТАТ =====

function showResult(correct, total) {
  const pct  = Math.round((correct / total) * 100);
  const section = document.getElementById('result-section');
  section.classList.remove('hidden');

  document.getElementById('result-score').textContent = `${correct} / ${total}`;

  let message = '';
  if (pct === 100)      message = '🏆 Отлично! Всё верно!';
  else if (pct >= 80)   message = '👍 Хороший результат!';
  else if (pct >= 60)   message = '📚 Неплохо, но есть над чем поработать';
  else                  message = '💪 Нужно повторить тему';

  document.getElementById('result-message').textContent  = message;
  document.getElementById('result-breakdown').textContent =
    `${pct}% — ${correct} правильных из ${total}`;
}

// ===== СБРОС =====

function resetQuiz() {
  currentTopic.tasks.forEach((_, i) => {
    const input    = document.getElementById(`answer-${i}`);
    const taskEl   = document.getElementById(`task-${i}`);
    const numEl    = document.getElementById(`num-${i}`);
    const feedback = document.getElementById(`feedback-${i}`);

    input.value    = '';
    input.disabled = false;
    taskEl.classList.remove('correct', 'wrong');
    numEl.classList.remove('correct', 'wrong');
    feedback.innerHTML = '';
  });

  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('submit-btn').classList.remove('hidden');
  document.getElementById('reset-btn').classList.add('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ЛОКАЛЬНОЕ СОХРАНЕНИЕ СТАТИСТИКИ =====

function saveResult(correct, total, results) {
  const params  = new URLSearchParams(window.location.search);
  const exam    = params.get('exam');
  const topicId = params.get('topic');
  const name    = localStorage.getItem('studentName') || 'Аноним';

  const record = {
    student:   name,
    exam:      exam,
    topic:     topicId,
    topicName: currentTopic.title,
    correct:   correct,
    total:     total,
    pct:       Math.round((correct / total) * 100),
    date:      new Date().toISOString(),
    details:   results
  };

  // История в localStorage
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  history.unshift(record);
  if (history.length > 200) history.pop();
  localStorage.setItem('history', JSON.stringify(history));

  sendToSupabase(record);

  console.log('[Результат сохранён]', record);
}

// ===== ОТПРАВКА В SUPABASE =====

async function sendToSupabase(record) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        student_name: record.student,
        exam:         record.exam,
        topic_id:     record.topic,
        topic_name:   record.topicName,
        correct:      record.correct,
        total:        record.total,
        pct:          record.pct,
        details:      record.details
      })
    });
    console.log('[Supabase] результат отправлен');
  } catch (e) {
    console.warn('[Supabase] ошибка отправки:', e);
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', loadTopic);
