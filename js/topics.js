// ===== РЕЕСТР ТЕМ =====
// Добавляй новые темы сюда после загрузки JSON-файла в папку data/

const TOPICS = {
  oge: [
    { id: 'kinematics',    name: 'Кинематика. Равномерное движение',         taskCount: 13 },
    { id: 'acceleration',  name: 'Кинематика. Равноускоренное движение',     taskCount: 9 },
    { id: 'freefall',      name: 'Кинематика. Свободное падение',            taskCount: 12 },
    { id: 'dynamics',      name: 'Динамика. Масса и плотность вещества',     taskCount: 10 },
    { id: 'circular',      name: 'Кинематика. Движение по окружности',       taskCount: 13 },
    { id: 'newton',        name: 'Динамика. Законы Ньютона',                 taskCount: 13 },
    { id: 'friction',      name: 'Динамика. Сила трения',                    taskCount: 5  },
    { id: 'deformation',   name: 'Динамика. Деформация. Закон Гука',          taskCount: 9  },
    { id: 'momentum',      name: 'Динамика. Закон сохранения импульса',       taskCount: 11 },
    { id: 'work',          name: 'Работа и мощность',                         taskCount: 12 },
    { id: 'energy',        name: 'Кинетическая и потенциальная энергия',      taskCount: 9  },
    { id: 'mechenergy',    name: 'Закон сохранения механической энергии',     taskCount: 12 },
    { id: 'mechanisms',    name: 'Простые механизмы. Рычаг и блок',           taskCount: 13 },
    { id: 'pressure',      name: 'Давление. Закон Паскаля. Архимедова сила',  taskCount: 10 },
    { id: 'archimedes',    name: 'Закон Архимеда. Плавание тел',               taskCount: 11 },
    { id: 'oscillations',  name: 'Механические колебания, волны и звук',        taskCount: 10 },
    { id: 'mkt',           name: 'МКТ. Строение вещества',                      taskCount: 10 },
    { id: 'heat',          name: 'Тепловые явления. Виды теплопередачи',         taskCount: 10 },
    { id: 'heat_quantity', name: 'Количество теплоты. Удельная теплоёмкость',    taskCount: 13 },
    { id: 'heat_balance',  name: 'Уравнение теплового баланса',                  taskCount: 7  },
    { id: 'evaporation',   name: 'Испарение. Конденсация. Влажность',            taskCount: 9  },
    { id: 'melting',       name: 'Плавление и кристаллизация',                   taskCount: 10 },
    { id: 'heat_engine',   name: 'КПД тепловых двигателей. Сгорание топлива',    taskCount: 6  },
    { id: 'charges',       name: 'Электризация. Электрические заряды. Закон Кулона', taskCount: 13 },
    { id: 'current',       name: 'Сила тока. Напряжение. Сопротивление',             taskCount: 25 },
    { id: 'ohm',           name: 'Закон Ома. Последовательное и параллельное соединение', taskCount: 27 },
    { id: 'joule',         name: 'Работа и мощность тока. Закон Джоуля-Ленца',           taskCount: 20 },
    { id: 'magnetic',      name: 'Магнитное поле. Электромагнитная индукция',            taskCount: 17 },
    { id: 'optics',        name: 'Электромагнитные волны. Оптика',                        taskCount: 28 },
    { id: 'quantum',       name: 'Квантовые явления. Строение атома',                     taskCount: 30 },
  ],
  ege: []
};
