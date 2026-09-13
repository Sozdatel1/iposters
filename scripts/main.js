const holidays = {


  

};

function checkHoliday() {
  const today = new Date();
  const month = today.getMonth() + 1; // Месяцы с 1
  const day = today.getDate();

  const dateKey = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const holidayName = holidays[dateKey];
  const displayDiv = document.getElementById('holiday');

  if (displayDiv) {
    if (holidayName) {
      displayDiv.innerHTML = `<h2>Сегодня отмечают праздник : ${holidayName}</h2>`;
    } else {
      displayDiv.innerHTML = `<h2>Сегодня обычный день.</h2>`;
    }
  }
}

// Запускаем при загрузке страницы
window.onload = checkHoliday;




document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('menuToggle');
  const menu = document.getElementById('headerNav');
  const body = document.body;

  /**
  * 1. ГЛАВНОЕ МЕНЮ (БУРГЕР)
  * Реализует логику toggleNav: открытие полноэкранного меню
  * и блокировку прокрутки сайта.
  */
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.classList.toggle('is-active');

      // Блокировка скролла body (как в оригинальном коде Добродела)
      if (isOpen) {
        body.classList.add('menu-open');
        body.style.overflow = 'hidden';
      } else {
        body.classList.remove('menu-open');
        body.style.overflow = '';
      }
    });
  }

  /**
  * 2. ПОДМЕНЮ (РАЗДЕЛЫ, РАЗРАБОТЧИК)
  * Открывает вложенные списки при клике на всю область пункта.
  */
  const dropdownWrappers = document.querySelectorAll('.dropdown-link-wrapper');

  dropdownWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      // Предотвращаем переход по ссылке #, чтобы сработало только раскрытие
      e.preventDefault();

      const parent = wrapper.closest('.dropdown');

      if (parent) {
        // Закрываем другие открытые подменю для экономии места на экране
        document.querySelectorAll('.dropdown').forEach(item => {
          if (item !== parent) {
            item.classList.remove('is-expanded');
          }
        });

        // Переключаем состояние текущего подменю
        parent.classList.toggle('is-expanded');
      }
    });
  });

  /**
  * 3. АВТО-ЗАКРЫТИЕ ПРИ ПЕРЕХОДЕ
  * Если кликнули на конечную ссылку (внутри подменю или обычную),
  * закрываем полноэкранное меню.
  */
  const navLinks = document.querySelectorAll('.dropdown-menu a');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Если у ссылки нет подменю (это конечная страница)
      if (!link.closest('.dropdown-link-wrapper')) {
        menu.classList.remove('is-open');
        if (burger) burger.classList.remove('is-active');
        body.classList.remove('menu-open');
        body.style.overflow = '';
      }
    });
  });
});

function updateVacationCountdown() {
  // Укажите дату начала каникул: Год, Месяц (0-11), Число, Часы, Минуты
  const vacationDate = new Date(2026, 11, 25, 0, 0); // 6 месяц
  const now = new Date();
  const diff = vacationDate - now;

  const timerElement = document.getElementById('vacation-timer');
  if (!timerElement) return;
  if (diff > 0) {
    // Расчет единиц времени
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    // Формируем строку с правильными окончаниями
    const dText = days + " " + getNoun(days, 'день', 'дня', 'дней');
    const hText = hours + " " + getNoun(hours, 'час', 'часа', 'часов');
    const mText = minutes + " " + getNoun(minutes, 'минута', 'минуты', 'минут');

    timerElement.innerHTML = `До зимних каникул: <span>${dText}, ${hText}, ${mText}</span>`;
  } else {
    timerElement.innerText = "Каникулы уже идут!";
  }
}

// Функция для склонения слов
function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

setInterval(updateVacationCountdown, 1000);
updateVacationCountdown();


function updateHoliday() {
  const monthElement = document.getElementById('leaf-month');
  const dayElement = document.getElementById('leaf-day');
  const holidayElement = document.getElementById('holiday-text'); // Если он остался для текста

  const now = new Date();

  // 1. Выводим число
  if (dayElement) {
    dayElement.innerText = now.getDate();
  }

  // 2. Выводим месяц буквами и делаем его ЗАГЛАВНЫМИ
  if (monthElement) {
    const monthName = now.toLocaleString('ru-RU', { month: 'long' });
    monthElement.innerText = monthName.toUpperCase(); // "ФЕВРАЛЬ"
  }

  // 3. Логика праздников (твой предыдущий код)
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const key = `${day}-${month}`;

  const specialHolidays = {
    "1-1": "Новый год! 🎄",
    "7-1": "Рождество 🌟",
    "23-2": "День защитника Отечества 🛡️",
    "8-3": "Международный женский день 💐",
    "12-4": "День космонавтики 🚀",
    "1-5": "Праздник Весны и Труда 🌱",
    "9-5": "День Победы 🎖️",
    "13-9": "День программиста (256-й день) 💻",
    "31-12": "Новый год уже близко! 🥂",
    "01-01": "Новый год",
  "01-07": "Православное Рождество",
  "02-01": "Лунный Новый год",
  // дата меняется
  "02-14": "День святого Валентина",
  "02-16": "День свободного дыхания",
  "02-23": "День защитника Отечества",
  /* Россия */
  "03-08": "Международный женский день",
  "03-21": "Международный день лесов",
  "03-22": "Всемирный день воды",
  "03-24": "Всемирный день борьбы с туберкулёзом",
  "04-01": "День смеха",
  "04-07": "Всемирный день здоровья",
  "04-22": "День Земли",
  "04-23": "Всемирный день книжных магазинов",
  "04-22": "Пасха",
  "05-01": "Праздник труда",
  "05-03": "День свободы прессы",
  "05-09": "День Победы",
  "05-18": "День рождения главного разработчика",
  "05-15": "Международный день семьи",
  "06-01": "День защиты детей",
  "06-05": "Международный день охраны окружающей среды",
  "06-12": "День России",
  "07-01": "День Канады",
  "07-11": "Международный день народонаселения",
  "07-18": "Международный день ЮНЕСКО",
  "08-12": "Международный день молодежи",
  "09-01": "День знаний",
  "09-21": "Международный день мира",
  "10-01": "День пожилых людей",
  "10-04": "День учителя",
  "10-10": "Всемирный день психического здоровья",
  "10-16": "Международный день окружающей среды",
  "11-01": "День всеобщего тестирования ",
  "11-20": "Международный день действий за отказ от смертной казни",
  "12-10": "Международный день прав человека",
  "12-12": "День Конституции России",
  "06-21": "Летнее солнцестояние"

  };

  if (holidayElement) {
    if (specialHolidays[key]) {
      holidayElement.innerText = specialHolidays[key];
    } else {
      const dailyStatuses = [
        "День планирования 🧘‍♂️", "Понедельник 📝", "Вторник 🚀",
        "Среда 🌍", "Четверг 💻", "Пятница ⚡️", "Суббота 📚"
      ];
      holidayElement.innerText = dailyStatuses[now.getDay()];
    }
  }
}

updateHoliday()
function openFilt() {
    // Находим наш мобильный блок фильтров по классу
    const mobileFilter = document.querySelector('.filt');
    
    // Мгновенно переключаем класс 'active' (если его нет - добавит, если есть - удалит)
    mobileFilter.classList.toggle('active');
}
window.openFilt = openFilt