import { renderFilteredPosts } from './posts.js';




// ФУНКЦИЯ КОТОРАЯ СОДЕРЖИТ СЛОВА ПО КОТОРЫМ РАСПРЕДЕЛЯЮТСЯ СТАТЬИ ПО ТЭГАМ

export function getAutoCategory(title, text = '') {
    const source = (title + ' ' + text).toLowerCase().trim();
    if (!source) return 'Инфо';

    const keywordsMap = {
        'Интернет': ['интерн', 'брауз', 'веб', 'сайт', 'веб страница', 'мессен'],
        'Технологии': ['технологии', 'сервер', 'робот', 'прогрес', 'искуственный интеллект', 'язык'],
        'Природа': ['капибар', 'животн', 'кот', 'пес', 'лес', 'природ', 'море', 'птиц', 'эко', 'океан', 'орнитол', 'амадин', 'гульд', 'самка', 'муравь', 'яйц', 'матк', 'джунгли', 'насеком'],
        // 'Жи+': ['школ', 'жизнь', 'день', 'учеба', 'хобби', 'отдых', 'мысли', 'совет', 'урок'],
        'Еда': ['гот', 'пригот', 'ед', 'печен', 'рецепт', 'кухня', 'пицца', 'бургер', 'вкусн', 'завтрак']
        // 'Нейро': ['нейро', 'ai', 'ии', 'gpt', 'бот', 'чат', 'midjourney', 'генерация']
    };

    // 3. ПОИСК: Проверяем супер-строку по всем ключевым словам
    for (let category in keywordsMap) {
        if (keywordsMap[category].some(word => source.includes(word))) {
            return category;
        }
    }

    return 'Инфо';
}

// -------------------------------------------------------------------------
// ФУНКЦИЯ ДЛЯ ГЛАВНОЙ, ОНА ПОКАЗЫВАЕТ ПЛАШКИ СО ВРЕМЕНЕМ ДЛЯ ЧТЕНИЯ РЯДОМ С КАРТОЧКАМИ 

// ВЕСЬ СЕКРЕТ В ТОМ ЧТО ОНА ВЫЗЫЫВАЕТСЯ В ФАЙЛЕ RENDER.JS В ФУНКЦИИ  renderFilteredPosts И ТАМ ОНА ВЫЗЫВАЕТСЯ С УСЛОВИЕМ post.text ЧТОБЫ ФУНКЦЯ ЧИТАЛА ТЕКСТ ИЗ АЙДИ ПОСТ ТЕКСТ КОТОРЫЙ ПРИСЫЛАЕТ СЕРВЕР

// ОНА БЕРЕТ ТЕКСТ КОТОРЫЙ НАДО ПОСЧИТАТЬ ИЗ УСЛОВИЯ POST.TEXT 
// В ВЫЗОВЕ ЕЕИ ЧИТАЕТ ТЕКСТ ИЗ ПЕРЕМЕННОЙ ПОСТ ТЕКС КОТОРУЮ ПРИСЛАЛ СЕРВЕР

// -----------------------------------------------------------------------------

export function calculateReadingTimeForCard(text) {
    if (!text) return "0 мин.";

    // Считаем слова
    const wordsCount = text.trim().split(/\s+/).length;
    const wpm = 180; // слов в минуту
    const minutes = Math.ceil(wordsCount / wpm);

    // Склонение (бонус!)
    let suffix = 'мин.';
    if (minutes === 1) suffix = 'мин.';
    if (minutes >= 2 && minutes <= 4) suffix = 'мин.';

    return `${minutes} ${suffix}`;
}


// ФУНКЦИЯ КОТОРАЯ С САМОГО НАЧАЛА ОТОБРАЖАЕТ ТОЛЬКО 8 КАРТОЧЕК И КОГДА НАЖИМАЕМ КНОПКУ ПОКАЗАТЬ ЕШЕ ОНА ПРОГОНАЯЕТ КАРТОЧКИ ЧЕРЕЗ ФИЛЬТР ТЭГА, ЧТОБЫ НЕ ОТКРЫТЬ ЕЩЕ 8 КАРТОЧЕК ДРУГОГО ФИЛЬТРА И ОТКРЫВАЕТ ЕЩЕ 8 КАРТОЧЕК С ТАКИМ ЖЕ ФИЛЬТРОМ

export function loadMore() {
    const start = window.displayedCount;
    window.displayedCount += 8; // Прибавляем 8
    const end = window.displayedCount;
    // Чтобы кнопка работала с учетом фильтра, нам нужно знать, какой тег сейчас выбран
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentTag = activeBtn ? activeBtn.innerText.replace('#', '') : 'Все';

    // Фильтруем данные заново и рисуем новую порцию
    const filtered = (currentTag === 'Все')
        ? allPostsData
        : allPostsData.filter(post => getAutoCategory(post.title) === currentTag);
    window.currentFilteredCount = filtered.length;
    const nextChunk = filtered.slice(start, end);
    renderFilteredPosts(nextChunk, true);
}
window.loadMore = loadMore;


// ФУНКЦИЯ КОТОРАЯ СОРТИРУЕТ СТАТЬИ ПО ТЭГАМ КОГДА КЛИКАЮТ НА ФИЛЬТР ОПРЕДЕЛЕННОГО ТЭГА ТО ОТОБРАЖАЮТСЯ СТАТЬИ С ЭТИМ ТЭГОМ


function filterByTag(tag, button) {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Сделает прокрутку плавной и кайфовой
    });
    // 1. Сбрасываем счетчик, чтобы снова видеть первые 8 постов
    displayedCount = 8;


    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Очищаем пришедший тег от решетки (на всякий случай)
    const target = tag.replace('#', '').trim();

    // 3. Логика выбора: передаем И заголовок, И текст
    const filtered = (target === 'Все')
        ? allPostsData
        : allPostsData.filter(post => {
            // ВАЖНО: передаем два аргумента в getAutoCategory
            const category = getAutoCategory(post.title, post.text).trim();
            return category === target;
        });

    // 4. Отрисовываем результат (false - чтобы стереть старое и нарисовать новое)
    renderFilteredPosts(filtered, false);
}
window.filterByTag = filterByTag;


let loaderInterval = null;

window.renderLoader = {
    start: function () {
        const container = document.getElementById('render-loader-container');
        const bar = document.getElementById('render-loader-bar');

        const percentText = document.getElementById('loader-percent');

        if (!container) return;

        container.style.display = 'block'; // Показываем прогресс-бар

        let currentPercent = 0;
        let timeLeft = 50; // Сколько секунд всего надо ждать

        // Очищаем старый интервал, если он вдруг был запущен
        clearInterval(loaderInterval);

        // Запускаем тик каждые 500 миллисекунд (полсекунды)
        loaderInterval = setInterval(() => {
            currentPercent += 1; // Увеличиваем на 1%

            // Каждые два тика (1 секунда) уменьшаем оставшееся время
            if (currentPercent % 2 === 0 && timeLeft > 0) {
                timeLeft -= 1;
            }

            // Обновляем данные на экране
            bar.style.width = `${currentPercent}%`;
            percentText.innerText = currentPercent;


            // Если доползли до 100%, останавливаем счетчик
            if (currentPercent >= 100) {
                clearInterval(loaderInterval);
                // timerText.innerText = "0";
            }
        }, 500); // 500мс = полсекунды
    },

    stop: function () {
        clearInterval(loaderInterval); // Останавливаем таймер
        const container = document.getElementById('render-loader-container');
        if (container) {
            container.style.display = 'none'; // Полностью прячем блок загрузки
        }
    }
};

window.formatDoc = function (cmd, value = null) {
    document.execCommand(cmd, false, value);

    // Возвращаем фокус на поле
    const input = document.getElementById('postInput');
    input.focus();

    // ПРОВЕРКА: Нажата ли кнопка "Ж" прямо сейчас?
    const isBold = document.queryCommandState('bold');
    const boldBtn = document.getElementById('btn-bold');

    if (boldBtn) {
        // Если жирный включен — красим в твой фирменный голубой, если нет — возвращаем серый
        boldBtn.style.background = isBold ? '#41cfff' : '#e0e0e0';
        boldBtn.style.color = isBold ? 'white' : 'black';
    }


};
