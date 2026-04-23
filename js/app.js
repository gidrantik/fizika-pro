// ===== УПРАВЛЕНИЕ СЕССИЕЙ =====

function getStudentName() {
  return localStorage.getItem('studentName') || '';
}

// Постоянный идентификатор устройства. Привязывает имя к конкретному браузеру,
// чтобы с одного устройства нельзя было писать результаты от чужого имени.
function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
           (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)).toString(16));
    localStorage.setItem('deviceId', id);
  }
  return id;
}

function startSession() {
  const input = document.getElementById('student-name');
  const raw = input.value.trim();
  // Ограничение длины, совпадающее с проверкой на сервере (2..40)
  const name = raw.slice(0, 40);
  if (name.length < 2) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  localStorage.setItem('studentName', name);
  getDeviceId(); // инициализируем device_id при первом входе
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

  // Хедер + защита от анонимного доступа — только на topic.html
  // (на index.html #name-screen есть, и там редирект создавал бы цикл)
  const isTopicPage = !document.getElementById('name-screen');
  if (isTopicPage) {
    const badge = document.getElementById('header-name');
    const name  = getStudentName();
    if (!name) {
      window.location.href = 'index.html';
      return;
    }
    if (badge) badge.textContent = name;
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
