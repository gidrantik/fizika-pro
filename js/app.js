// ===== УПРАВЛЕНИЕ СЕССИЕЙ =====

function getStudentName() {
  return localStorage.getItem('studentName') || '';
}

function startSession() {
  const input = document.getElementById('student-name');
  const name = input.value.trim();
  if (!name) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  localStorage.setItem('studentName', name);
  showDashboard();
}

function showDashboard() {
  const name = getStudentName();
  document.getElementById('name-screen').classList.remove('active');
  document.getElementById('dashboard-screen').classList.add('active');
  const badge = document.getElementById('header-name');
  if (badge) badge.textContent = name;
}

function logout() {
  localStorage.removeItem('studentName');
  window.location.href = 'index.html';
}

// Нажатие Enter в поле имени
document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('student-name');
  if (nameInput) {
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') startSession();
    });
  }

  // Если имя уже есть — сразу дашборд
  if (getStudentName()) {
    showDashboard();
  }

  // Хедер на topic.html
  const badge = document.getElementById('header-name');
  if (badge && getStudentName()) {
    badge.textContent = getStudentName();
  }
});

// ===== НАВИГАЦИЯ ПО ТЕМАМ (dashboard) =====

function showTopics(exam) {
  const section = document.getElementById('topics-section');
  const title   = document.getElementById('topics-title');
  const list    = document.getElementById('topics-list');

  title.textContent = exam === 'oge' ? 'ОГЭ — Темы' : 'ЕГЭ — Темы';
  section.classList.remove('hidden');

  const topics = TOPICS[exam] || [];
  list.innerHTML = '';

  if (topics.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);padding:20px 0">Темы пока не добавлены</p>';
    return;
  }

  topics.forEach((topic, i) => {
    const a = document.createElement('a');
    a.className = 'topic-item';
    a.href = `topic.html?exam=${exam}&topic=${topic.id}`;
    a.innerHTML = `
      <div class="topic-item-left">
        <div class="topic-num">${i + 1}</div>
        <div>
          <div class="topic-name">${topic.name}</div>
          <div class="topic-meta">${topic.taskCount} задач</div>
        </div>
      </div>
      <div class="topic-arrow">›</div>
    `;
    list.appendChild(a);
  });
}

function hideTopic() {
  document.getElementById('topics-section').classList.add('hidden');
}
