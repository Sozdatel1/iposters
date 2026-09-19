

import { supabase } from './render.js'; // или путь к файлу, где лежит конфиг Supabase

// --------------------------------------------------

// ФАЙЛ В КОТОРОМ ЛОГИКА ЛАЙКОВ И ТОП 3 СТАТЕЙ











// СНАЧАЛА МЫ ПОСЫЛАЕМ ДАННЫЕ НА СЕРВЕР РЕНДЕР, 
// ОН ПОСЫЛЕТ ИХ В РЕПО ГИТХАБ С ПОМОЩЬЮ ТОКЕНА ГИТХАБ, 
// А ПОТОМ МЫ ЗАПРАШИВАЕМ ДАННЫЕ ИЗ ФАЙЛА

// ------------------------------------------------------------
window.openCreateModal = async function () {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
   const ak = user.user_metadata?.display_name || user.user_metadata?.name || user.email.split('@')[0] || 'Аноним';
    await Swal.fire({
        title: `Напишите статью, ${ak}!`,
        // Вставляем твою верстку прямо сюда
        width: '1000px',
        html: `
        <div class="glass-card admin-zone" style="height: auto; border: none; box-shadow: none; background: transparent; padding: 0;">
            <input type="text" id="postImage" placeholder="Ссылка на картинку статьи (URL)..." style="width: 100%; margin-bottom: 10px;">
            <input type="text" id="postTitle" placeholder="Заголовок статьи..." style="width: 100%; margin-bottom: 10px;">
            <div class="toolbar" style="margin-bottom: 10px; display: flex; gap: 5px;">

    <!-- Кнопка жирности -->
    <button type="button" id="btn-bold"  onclick="window.formatDoc('bold')" style="padding: 5px 10px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Ж</button>
    
    <!-- Выбор размера текста -->
    <select id="select-size" onchange="window.formatDoc('fontSize', this.value)" style="padding: 5px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">
        <option value="2">Маленький</option> <!-- Было 3 -->
    <option value="4">Обычный / Средний</option> <!-- Стандартный размер твоего сайта -->
    <option value="5">Большой</option> <!-- Заметно крупнее -->
    <option value="7">Огромный</option> <!-- Реальный заголовок, сразу видно разницу -->
    </select>
     <button type="button" onclick="document.getElementById('fileInput').click()" style="padding: 5px 10px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">📎 Фото</button>
    
    <!-- Скрытый инпут, который откроет выбор файлов на компе/телефоне -->
    <input type="file" id="fileInput" accept="image/*" style="display: none;" multiple>
</div>

<!-- Смарт-поле ввода (замена textarea) -->
<div id="postInput" contenteditable="true" placeholder="Текст статьи..." style="
    width: 100%; 
    min-height: 300px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    padding: 10px; 
    text-align: left; 
    color: black;
    background: white; 
    overflow-y: auto;
    white-space: pre-wrap;
"></div>
          
        
        </div>
        `,
        didOpen: () => {
            const input = document.getElementById('postInput');
            const boldBtn = document.getElementById('btn-bold');
            const sizeSelect = document.getElementById('select-size');
            const fileInput = document.getElementById('fileInput');
            // 1. Сначала вставляем текст (для окна редактирования)
            if (typeof oldText !== 'undefined' && input) {
                input.innerHTML = oldText;
            }

            if (input) {
                // 🔥 ЖЕСТКИЙ АВТОФОКУС: ставим курсор в самый конец текста
                input.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(input);
                range.collapse(false); // false означает поставить курсор в конец текста
                sel.removeAllRanges();
                sel.addRange(range);
                if (fileInput) {
                    fileInput.addEventListener('change', (event) => {
                        // Вызываем функцию и передаем файлы напрямую из события браузера!
                        window.uploadFile(event.target.files);
                    });
                }

                const checkState = () => {
                    // Подсветка кнопки Ж
                    if (boldBtn) {
                        const isBold = document.queryCommandState('bold');
                        boldBtn.style.background = isBold ? '#41cfff' : '#e0e0e0';
                        boldBtn.style.color = isBold ? 'white' : 'black';
                    }

                    // Переключение окошка размера за курсором
                    if (sizeSelect) {
                        let currentSize = document.queryCommandValue('fontSize');
                        // Если тегов нет, держим базовую 4-ку (Обычный)
                        if (!input.innerHTML.includes('font-size') && !input.innerHTML.includes('size=') && (currentSize == 4 || !currentSize)) {
                            currentSize = "4";
                        }
                        if (currentSize) {
                            sizeSelect.value = currentSize;
                        }
                    }
                };

                input.addEventListener('keyup', checkState);
                input.addEventListener('mouseup', checkState);

                // Даем браузеру 50мс отобразить модалку и ровно считываем стили
                setTimeout(() => {
                    checkState();
                }, 50);
            }
        },



        showConfirmButton: true,
        confirmButtonText: 'Опубликовать',
        confirmButtonColor: '#41cfff',
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        focusConfirm: false,
        // Собираем данные перед тем как вызвать твою функцию
        preConfirm: () => {
            const title = document.getElementById('postTitle').value.trim();
            const image = document.getElementById('postImage').value.trim();

            // 1. Для проверки берем ЧИСТЫЙ ТЕКСТ без HTML-тегов и пробелов
            const checkText = document.getElementById('postInput').innerText.trim();

            // 2. Честная проверка: если букв нет — стопим отправку
            if (!title || !checkText) {
                Swal.showValidationMessage('Заголовок и текст обязательны!');
                return false;
            }

            // 3. Если всё ок — забираем со всеми тегами жирности и размеров!
            const htmlText = document.getElementById('postInput').innerHTML;

            return { title, text: htmlText, image };
        }

    }).then((result) => {
        if (result.isConfirmed) {
            // Когда нажали "Опубликовать", вызываем твою функцию
            // Передаем туда данные из полей
            window.publishPost(result.value);
        }
    });
};

window.openEditModal = async function (id) {
    // 1. ВМЕСТО ЗАПРОСА В БАЗУ — забираем данные прямо из DOM (с экрана)
    const oldTitle = document.querySelector(`#post-card-${id} h1`)?.innerText || '';
    const oldText = document.getElementById(`text-${id}`)?.innerHTML || '';
    const oldImage = document.querySelector(`#post-card-${id} img`)?.src || '';

    // 2. Получаем ник для заголовка
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user; 
    // const ak = session?.user?.email.split('@')[0] || 'Автор';
const ak = user.user_metadata?.display_name || user.user_metadata?.name || user.email.split('@')[0] || 'Аноним';
    // 3. Открываем твой стеклянный интерфейс
    const { value: formValues } = await Swal.fire({
        title: `Отредактируйте статью, ${ak}`,
        width: '1000px',
        background: '#ffffff',
        html: `
            <div class="glass-card admin-zone" style="height: auto; border: none; box-shadow: none; background: transparent; padding: 0;">
                <input type="text" id="postImage" placeholder="Ссылка на картинку статьи (URL)..." value="${oldImage || ''}" style="width: 100%; margin-bottom: 10px;">
                <input type="text" id="postTitle" placeholder="Заголовок статьи..." value="${oldTitle}"  style="width: 100%; margin-bottom: 10px;">
                
                <!-- ПАНЕЛЬ ИНСТРУМЕНТОВ -->
                <div class="toolbar" style="margin-bottom: 10px; display: flex; gap: 5px; text-align: left;">
                    <button type="button" id="btn-bold" onclick="window.formatDoc('bold')" style="padding: 6px 12px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s;">Ж</button>
                    
                    <!-- ПОМЕНЯЛИ ШКАЛУ НА 2, 4, 5, 7 И ДОБАВИЛИ id="select-size" -->
                    <select id="select-size" onchange="window.formatDoc('fontSize', this.value)" style="padding: 6px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">
                        <option value="2">Маленький</option>
                        <option value="4">Обычный</option>
                        <option value="5">Большой</option>
                        <option value="7">Огромный</option>
                    </select>
                     <button type="button" onclick="document.getElementById('fileInput').click()" style="padding: 5px 10px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">📎 Фото</button>
    
    <!-- Скрытый инпут, который откроет выбор файлов на компе/телефоне -->
    <input type="file" id="fileInput" accept="image/*" style="display: none;" multiple>
                </div>

                <!-- УМНОЕ ПОЛЕ ВВОДА -->
                <div id="postInput" contenteditable="true" placeholder="Текст статьи..." style="
                    width: 100%; 
                    min-height: 400px; 
                    border: 1px solid #ccc; 
                    border-radius: 4px; 
                    padding: 10px; 
                    text-align: left; 
                    background: white; 
                    color: black;
                    overflow-y: auto;
                    white-space: pre-wrap;
                "></div>
            </div>
        `,
        didOpen: () => {
            const input = document.getElementById('postInput');
            const boldBtn = document.getElementById('btn-bold');
            const sizeSelect = document.getElementById('select-size');

            if (typeof oldText !== 'undefined' && input) {
                // .trim() уберет все скрытые табы и переносы строк, которые прилетели из верстки HTML
                input.innerHTML = oldText.trim();
            }
            if (input) {
                // 🔥 ЖЕСТКИЙ АВТОФОКУС: ставим курсор в самый конец текста
                input.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(input);
                range.collapse(false); // false означает поставить курсор в конец текста
                sel.removeAllRanges();
                sel.addRange(range);
                if (fileInput) {
                    fileInput.addEventListener('change', (event) => {
                        // Вызываем функцию и передаем файлы напрямую из события браузера!
                        window.uploadFile(event.target.files);
                    });
                }
                const checkState = () => {
                    // Подсветка кнопки Ж
                    if (boldBtn) {
                        const isBold = document.queryCommandState('bold');
                        boldBtn.style.background = isBold ? '#41cfff' : '#e0e0e0';
                        boldBtn.style.color = isBold ? 'white' : 'black';
                    }

                    // Переключение окошка размера за курсором
                    if (sizeSelect) {
                        let currentSize = document.queryCommandValue('fontSize');
                        // Если тегов нет, держим базовую 4-ку (Обычный)
                        if (!input.innerHTML.includes('font-size') && !input.innerHTML.includes('size=') && (currentSize == 4 || !currentSize)) {
                            currentSize = "4";
                        }
                        if (currentSize) {
                            sizeSelect.value = currentSize;
                        }
                    }
                };

                input.addEventListener('keyup', checkState);
                input.addEventListener('mouseup', checkState);

                // Даем браузеру 50мс отобразить модалку и ровно считываем стили
                setTimeout(() => {
                    checkState();
                }, 50);
            }
        },

        showCancelButton: true,
        confirmButtonText: 'Сохранить изменения',
        confirmButtonColor: '#41cfff',
        cancelButtonText: 'Отмена',
        preConfirm: () => {
            const title = document.getElementById('postTitle').value.trim();
            const checkText = document.getElementById('postInput').innerText.trim();

            if (!title || !checkText) {
                Swal.showValidationMessage('Заголовок и текст обязательны!');
                return false;
            }

            return {
                image: document.getElementById('postImage').value.trim(),
                title: title,
                text: document.getElementById('postInput').innerHTML // Забираем HTML-код изменений
            }
        }
    });

    // 4. Если нажали "Сохранить" — пушим в базу без зависаний
    if (formValues) {
        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Обновлено!',
            timer: 1000,
            showConfirmButton: false
        });

        const cardTitle = document.querySelector(`#post-card-${id} h1`);
        const cardText = document.getElementById(`text-${id}`);
        const cardImg = document.querySelector(`#post-card-${id} img`);

        if (cardTitle) cardTitle.innerText = formValues.title;
        if (cardText) cardText.innerHTML = formValues.text; // Меняем на innerHTML, чтобы стили сразу применились в ленте!
        if (cardImg && formValues.image) {
            cardImg.src = formValues.image;
            cardImg.style.display = 'block';
        }

        supabase
            .from('articles')
            .update({
                title: formValues.title,
                text: formValues.text,
                image: formValues.image
            })
            .eq('id', id)
            .then(({ error }) => {
                if (error) {
                    console.error("Ошибка сохранения в базу данных:", error.message);
                }
            });
    }
};
// ФУНКЦИЯ КОТОРАЯ СОЗДАЕТ ТОП 3 САМЫХ ЛУЧШИХ СТАТЬИ НА ГЛАВНОЙ

export function renderTrending(posts) {
    const trendingList = document.getElementById('trending-list');
    if (!trendingList) return;

    // Сортируем по лайкам и берем первые 3
    const topPosts = [...posts]
        .sort((a, b) => (b.real_likes || 0) - (a.real_likes || 0))
        .slice(0, 3);

    trendingList.innerHTML = topPosts.map((post, index) => `
        <button onclick="window.scrollToPost('${post.id}')" class="trending-item">
            <div class="trending-info">
                <span class="trending-title">${index === 0 ? '👑 ' : ''}${post.title}</span>
            
                <div class="stat">
                <span class="trending-likes">❤️ ${post.real_likes || 0}</span>
                
<span style="margin: 5px auto">💬 ${post.commentCount}</span>

<span style="margin: 5px auto">👁️ ${post.viewCount || 0}</span>
</div>
            </div>
        </button>
    `).join('');
}
window.scrollToPost = function (postId) {
    const element = document.getElementById(`post-card-${postId}`);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth', // Плавный скролл
            block: 'start'      // Карточка встанет вверху экрана
        });

        // Маленький спецэффект: подсветим карточку, чтобы юзер её не потерял
        element.style.boxShadow = "0 0 30px rgba(65, 207, 255, 0.6)";
        setTimeout(() => element.style.boxShadow = "none", 2000);
    }
};

// window.isClean = function (text) {
//     if (!text) return true;

//     // 1. ЖЕСТКИЕ КОРНИ (Ищем везде)
//     const heavyRoots = ['хуй', 'хуя', 'хуе', 'пизд', 'еба', 'бля'];

//     // 2. ОБЫЧНЫЕ ОСКОРБЛЕНИЯ (Ищем только как отдельные слова!)
//     const badWords = ['дебил', 'дибил', 'пидор', 'лох', 'чмо', 'ублюдок', 'сука'];

//     const lowerText = text.toLowerCase();

//     // Проверка 1: Склейка (для мата)
//     const compressed = lowerText.replace(/[^а-яёa-z]/g, '');

//     // Исключение для латыни Hydrochoerus (чтобы не путать с "хуе")
//     if (compressed.includes('hydrochoer')) {
//         // Пропускаем проверку тяжелых корней для этого научного термена
//     } else {
//         if (heavyRoots.some(root => compressed.includes(root))) return false;
//     }

//     // Проверка 2: По словам (чтобы "лохматой" и "присущих" прошли)
//     const words = lowerText.replace(/[^а-яёa-z\s]/g, ' ').split(/\s+/);

//     const hasBadWord = words.some(word => {
//         // Проверяем, не является ли всё слово целиком оскорблением
//         return badWords.includes(word);
//     });

//     if (hasBadWord) return false;

//     return true;
// };

function formatTime(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000); // Разница в секундах

    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин. назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' час. назад';
    if (diff < 259200) return Math.floor(diff / 86400) + ' дн. назад';

    // Если очень старый пост, просто пишем дату
    return past.toLocaleDateString();
}
window.formatTime = formatTime
function runSearch(el) {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Делает прокрутку плавной
    });
    // Исправлено: берем или переданный элемент (this), или активный инпут
    const input = el || document.activeElement;
    const grid = document.getElementById('dynamic-cards');
    const loadMoreContainer = document.getElementById('load-more-container');
    const result = document.getElementById('result');
    const filters = document.getElementById('tag'); // или твой ID фильтров
    const my_stat = document.getElementById('my-stat')
    const prof = document.getElementById('prof')
    const stats = document.getElementById('stats')
    if (!input || !grid) return;


    const term = input.value.toLowerCase().trim();
    console.log("🔍 Ищем на iPosters:", term);
    if (filters) {
        filters.style.display = term === "" ? "block" : "none";
    }
    if (!window.allPostsData) {
        console.error("Данные еще не загружены в window.allPostsData");
        return;
    }

    const filtered = window.allPostsData.filter(post =>
        (post.title && post.title.toLowerCase().includes(term)) ||
        (post.text && post.text.toLowerCase().includes(term))
    );

    console.log("✅ Найдено статей:", filtered.length);

    grid.innerHTML = '';

    if (window.renderFilteredPosts) {
        window.renderFilteredPosts(filtered, true);

        if (loadMoreContainer) {
            loadMoreContainer.style.display = term === "" ? "block" : "none";
        }
        // Обновляем заголовок, если он есть
        if (result) {
            result.innerHTML = term === "" ? "Мои посты" : `Результаты поиска для "${term}":`;
        }
        if (stats) {
            stats.innerHTML = term === "" ? "" : `Результаты поиска для "${term}":`;
        }

    }

    if (filtered.length === 0 && term !== "") {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #00d4ff;">
                <span style="font-size: 40px;">🛸</span>
                <p style="margin-top: 15px; text-shadow: 0 0 10px #00d4ff;">Космос пуст. По запросу "${term}" ничего не найдено.</p>
            </div>
        `;
    }
}
// Присваиваем функцию без скобок, чтобы она не запускалась сама
window.runSearch = runSearch;


document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('searchToggle');
    const mobileBox = document.getElementById('mobileSearchBox');

    if (toggleBtn && mobileBox) {
        toggleBtn.onclick = function (e) {
            e.stopPropagation();
            // Проверяем через стиль: если скрыт — показываем
            const isHidden = mobileBox.style.display === 'none';
            mobileBox.style.display = isHidden ? 'block' : 'none';

            if (isHidden) {
                const inp = mobileBox.querySelector('input');
                if (inp) inp.focus();
            }
        };
    }

    // Закрываем мобильный поиск, если кликнули мимо
    document.addEventListener('click', (e) => {
        if (mobileBox && !mobileBox.contains(e.target) && e.target.id !== 'searchToggle') {
            mobileBox.style.display = 'none';
        }
    });
});


window.uploadFile = async function (files) {
    if (!files || files.length === 0) return;
    


    const inputField = document.getElementById('postInput');
    Swal.showLoading(); // Включаем красивый лоадер SweetAlert
    const imageUrls = [];
    // Упаковываем файл в специальный формат для отправки по сети


         // 🔥 НАДО СТРОГО ТАК (Метод .pop() забирает из массива СТРОГО чистую base64 строку без префикса!):
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',').pop()); // <-- ДОБАВИЛИ .pop() НА КОНЦЕ!
        reader.onerror = error => reject(error);
    })
    try {
        for (let i = 0; i < files.length; i++) {
              const currentFile = files[i];
            const base64Data = await toBase64(currentFile);

            // Штурмуем твой собственный бэкенд на Рендере (Тут CORS и 50-мегабайтные лимиты в идеале!)
            const response = await fetch('https://pro-info-api.onrender.com/api/upload-image', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ imageBase64: base64Data })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error("Детали ошибки твоего сервера Express:", errData);
                throw new Error(`Ошибка на файле №${i + 1}`);
            }

            const result = await response.json();
            
            // Твой сервер возвращает готовую прокси-ссылку в поле result.url
            if (result && result.url) {
                imageUrls.push(result.url); // Ссылка на твой собственный image-proxy встает в массив карусели!
            } else {
                throw new Error('Ошибка парсинга ответа бэкенда');
            }
        }

        if (imageUrls.length === 0) throw new Error("Массив картинок пуст");

        // ВЕРНУЛИ ФОКУС НА ТЕКСТ ПЕРЕД ВСТАВКОЙ
        if (inputField) inputField.focus();
        // 🔍 УМНАЯ ПРОВЕРКА НА СВЯЗКУ ПОДРЯД
        const selection = window.getSelection();
        let targetNode = null;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Ищем элемент, который стоит прямо перед курсором
            targetNode = range.startContainer.childNodes[range.startOffset - 1] || range.startContainer.previousSibling || range.startContainer.parentNode?.lastElementChild;
        }

        // Проверяем, является ли предыдущий элемент одиночной картинкой или уже существующей каруселью
        const isPrevImg = targetNode && targetNode.tagName === 'IMG';
        const isPrevCarousel = targetNode && targetNode.classList?.contains('post-carousel');

        if (isPrevImg || isPrevCarousel || imageUrls.length > 1) {
            // --- СОБИРАЕМ ВСЕ ССЫЛКИ В ОДНУ КАРУСЕЛЬ ---
            let allUrls = [];

            if (isPrevImg) {
                allUrls.push(targetNode.src); // Забираем ссылку из старой одиночной картинки
                targetNode.remove(); // Удаляем саму старую картинку с экрана
            } else if (isPrevCarousel) {
                // Забираем все старые ссылки из существующей карусели
                const oldImages = targetNode.querySelectorAll('.carousel-track img');
                oldImages.forEach(img => allUrls.push(img.src));
                targetNode.remove(); // Удаляем старую карусель, чтобы заменить её на расширенную
            }

            // Добавляем к старым ссылкам наши новые только что загруженные картинки
            allUrls = allUrls.concat(imageUrls);

            // Генерируем новый HTML карусели
            const carouselId = `carousel-${Date.now()}`;
            let carouselHtml = `<div id="${carouselId}" class="post-carousel" style="position: relative; width: 100%; height: 350px !important; margin: 15px 0; overflow: hidden; border-radius: 8px; background: black; "><div class="carousel-track" style="display: flex; align-items: center; transition: transform 0.4s ease; width: 100%; height: 100%;">`;

            allUrls.forEach(url => {
                carouselHtml += `<img src="${url}" style="width: 100%; height: 100%; object-fit: contain; background: #1a1a1a00; flex-shrink: 0;">`;
            });

            carouselHtml += `
                </div>
                <button type="button" onclick="window.moveCarousel('${carouselId}', -1)" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background: rgb(0, 0, 0); color: white; border: none; padding: 15px; border-radius: 50px; cursor: pointer; z-index: 10;"><img src="/img/arrow_left_alt_30dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"></button>
                <button type="button" onclick="window.moveCarousel('${carouselId}', 1)" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: rgb(0, 0, 0); color: white; border: none; padding: 15px; border-radius: 50px; cursor: pointer; z-index: 10;"><img src="/img/arrow_right_alt_30dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"></button>
            </div>
            
            `;

            document.execCommand('insertHTML', false, carouselHtml);
        } else {
            // --- ОБЫЧНАЯ ОДИНОЧНАЯ ВСТАВКА (если рядом ничего не было) ---
            document.execCommand('insertImage', false, imageUrls[0]);
        }

        Swal.hideLoading();
    } catch (err) {
        console.error("Ошибка загрузки файла", err.message);
        Swal.fire("Ошибка сети", "Не удалось загрузить картинку. Попробуй другой файл.", "error");
    }
};
window.moveCarousel = function (carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const images = track.querySelectorAll('img');

    // Храним текущий индекс слайда прямо в атрибуте HTML-элемента
    let currentIndex = parseInt(carousel.getAttribute('data-index') || '0');

    // Меняем индекс
    currentIndex += direction;

    // Зацикливаем слайдер (если ушли за границы)
    if (currentIndex >= images.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = images.length - 1;

    // Запоминаем новый индекс
    carousel.setAttribute('data-index', currentIndex);

    // Сдвигаем трек на нужный процент (каждая фотка занимает 100% ширины)
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
};


window.checkUrlHash = function () {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#post-')) return;

    const postId = hash.replace('#post-', '');

    // 🔥 ДОБАВИЛИ ТАЙМЕР ОЖИДАНИЯ: скрипт будет караулить пост в HTML, пока база данных его не отрисует!
    const checkInterval = setInterval(() => {
        const targetPost = document.getElementById(`post-card-${postId}`);
        const container = document.getElementById(`container-${postId}`);

        // Как только карточка поста родилась в HTML — запускаем скролл и раскрытие!
        if (targetPost) {
            clearInterval(checkInterval); // Выключаем таймер, цель поймана!



            // 2. Ждем 500мс (время полной CSS-анимации), пока пост раскроется до конца
            setTimeout(() => {
                targetPost.scrollIntoView({

                    block: 'center'     // Отцентрует раскрытый пост на экране!
                });
            }, 500);
        }
    }, 100); // Проверяем экран каждые 100мс

    // Страховка: если через 5 секунд пост так и не прилетел из базы, отключаем таймер
    setTimeout(() => clearInterval(checkInterval), 5000);
};

// Запускаем проверку хэша СРАЗУ при чтении скрипта браузером
window.checkUrlHash();


// Если хэш изменился прямо во время работы сайта — мгновенно летим к новому посту!
window.addEventListener('hashchange', window.checkUrlHash);
// 🔥 ФИНАЛЬНЫЙ СТАРТЕР: Запускаем проверку хэша при ПЕРВОЙ загрузке сайта
window.addEventListener('load', () => {
    // Даем браузеру 300 миллисекунд, чтобы догрузить все посты и карусели
    setTimeout(() => {
        window.checkUrlHash();
    }, 300);
});

// 🔥 Перепиши начало функции прямо так, чтобы она мгновенно регистрировалась в браузере
window.sharePost = async function (postId) {
    const postUrl = `${window.location.origin}/#post-${postId}`;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // 🔥 ВОТ ТУТ ДОБАВИЛИ ПРОВЕРКУ: НАЛИЧИЕ SHARE *И* СЕНСОРНЫЙ ЭКРАН!
    if (navigator.share && isTouchDevice) {
        try {
            await navigator.share({
                title: 'Посмотри этот post на iPosters!',
                url: postUrl
            });
        } catch (err) { console.log('Отмена отправки'); }
    } else {
        try {
            await navigator.clipboard.writeText(postUrl);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Ссылка на пост скопирована!',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            Swal.fire('Ошибка', 'Не удалось скопировать ссылку', 'error');
        }
    }
};

// =========================================================================
// 🦫 ИНТЕРФЕЙС ЦЕНТРАЛЬНОГО ПУЛЬТА УПРАВЛЕНИЯ (СТАТЬИ + КОММЕНТЫ)
// =========================================================================

window.currentUnapprovedCache = []; // Кэш комментариев

window.checkAdminProfile = async function () {
    const panel = document.getElementById('admin-moderation-panel');
    const articlesList = document.getElementById('admin-articles-queue-list');
    const commentsList = document.getElementById('admin-posts-queue');
    const globalBadge = document.getElementById('global-mod-badge');
    const artBadge = document.getElementById('articles-badge-count');
    const commBadge = document.getElementById('comments-badge-count');

    if (!panel || !articlesList || !commentsList) return;

    // 1. Получаем токен сессии
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

        // 🔥 СУВЕРЕННЫЙ ЖЕСТКИЙ ФАЙРВОЛ: Считываем имя из метаданных базы данных
    const currentAdminName = session.user.user_metadata?.display_name || session.user.user_metadata?.name || session.user.email.split('@')[0] || 'Аноним';

    // 🔥 ФИКС СИНИОРА: Убрали .toLowerCase()! Врубили точное регистрозависимое совпадение!
    // Теперь пустит ТОЛЬКО маленькую "kapibara". Любые большие буквы вызовут блок панели!
    if (currentAdminName !== 'kapibara') {
        panel.style.display = 'none';
        return;
    }

    // Открываем пульт админа! Проверка пройдена символ в символ!
    panel.style.display = 'block';


    try {
        // 2. ВЫСОКОНАГРУЖЕННЫЙ ПАРАЛЛЕЛЬНЫЙ ЗАПРОС К ДВУМ КАНТУРАМ КАРАНТИНА
        const [resPosts, resComments] = await Promise.all([
            fetch('https://pro-info-api.onrender.com/api/admin/unapproved-posts', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
            fetch('https://pro-info-api.onrender.com/api/admin/unapproved', { headers: { 'Authorization': `Bearer ${session.access_token}` } })
        ]);

        const unapprovedPosts = await resPosts.json();
        window.currentUnapprovedCache = await resComments.json();

        // Общий счетчик нарушителей для главного баджа
        const totalAlerts = (unapprovedPosts?.length || 0) + (window.currentUnapprovedCache?.length || 0);
        if (totalAlerts > 0) {
            globalBadge.style.display = 'inline-block';
            globalBadge.innerText = totalAlerts;
        } else {
            globalBadge.style.display = 'none';
        }

        // =========================================================================
        // РЕНДЕР КОНТУРА №1: СТАТЬИ (АРТИКЛЫ)
        // =========================================================================
        if (!unapprovedPosts || unapprovedPosts.length === 0) {
            artBadge.style.display = 'none';
            articlesList.innerHTML = '<p style="color: #28a745; font-size: 14px; font-weight: bold; margin: 0;">🏆 Нет новых статей на проверку. Вёрстка чиста!</p>';
        } else {
            artBadge.style.display = 'inline-block';
            artBadge.innerText = unapprovedPosts.length;

            articlesList.innerHTML = unapprovedPosts.map(p => `
                <div style="background: #fafafa; border: 1px solid rgba(0,0,0,0.06); padding: 15px; border-radius: 6px; margin-bottom: 12px; position: relative;">
                    <b style="color: #333; font-size: 14px;">👤 ${p.generatedName}</b>
                    <h5 style="margin: 0 0 6px 0; font-size: 16px; color: #222; font-weight: bold;">📄 ${p.title}</h5>
                    
                    <!-- Если у статьи есть картинка - рендерим её микро-превью -->
                    ${p.image ? `<img src="${p.image}" style="max-width: 120px; max-height: 80px; border-radius: 4px; margin-bottom: 8px; display: block; border: 1px solid #eee;">` : ''}
                    
                    <p style="margin: 0 0 12px 0; color: #444; font-size: 15px; line-height: 1.4; max-height: 100px; overflow: hidden; text-overflow: ellipsis;">${p.text || p.content || ''}</p>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.executePostAction('approve', '${p.id}')" style="background: #41cfff; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s;" onmouseover="this.style.background='#007bff'" onmouseout="this.style.background='#41cfff'">Одобрить статью 👍</button>
                        <button onclick="window.executePostAction('delete', '${p.id}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s;" onmouseover="this.style.background='#cc0000'" onmouseout="this.style.background='#ff4d4d'">Удалить 🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        // =========================================================================
        // РЕНДЕР КОНТУРА №2: КОММЕНТАРИИ (Группировка по постам-аккордеонам)
        // =========================================================================
        if (!window.currentUnapprovedCache || window.currentUnapprovedCache.length === 0) {
            commBadge.style.display = 'none';
            commentsList.innerHTML = '<p style="color: #28a745; font-size: 14px; font-weight: bold; margin: 0;">🏆 Нет новых комментариев на проверку.</p>';
            return;
        }

        commBadge.style.display = 'inline-block';
        commBadge.innerText = window.currentUnapprovedCache.length;

        const uniquePostsMap = {};
        window.currentUnapprovedCache.forEach(c => {
            if (!uniquePostsMap[c.post_id]) {
                uniquePostsMap[c.post_id] = {
                    id: c.post_id,
                    title: c.post_title || `Статья ID: ${c.post_id.slice(0, 8)}...`,
                    count: 0
                };
            }
            uniquePostsMap[c.post_id].count++;
        });

        commentsList.innerHTML = Object.values(uniquePostsMap).map(p => `
            <div onclick="window.openModModal('${p.id}', '${p.title}')" 
                 style="background: #fafafa; border: 1px solid rgba(0,0,0,0.06); padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;"
                 onmouseover="this.style.borderColor='#41cfff'; this.style.background='#fcfcfc';" onmouseout="this.style.borderColor='rgba(0,0,0,0.06)'; this.style.background='#fafafa';">
                <span style="font-size: 15px; font-weight: bold; color: #222;">📄 ${p.title}</span>
                <span style="background: #41cfff; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 12px;">${p.count} коммент.</span>
            </div>
        `).join('');

    } catch (err) {
        console.error("Сбой пульта управления Капибары:", err);
    }
};

// 3. УПРАВЛЕНИЕ СТАТЬЯМИ (ОДОБРЕНИЕ / УДАЛЕНИЕ)
window.executePostAction = async function (action, postId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        if (action === 'approve') {
            const response = await fetch(`https://pro-info-api.onrender.com/api/posts/approve/${postId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!response.ok) throw new Error("Ошибка сервера при аппруве статьи");
            Swal.fire("Статья выпущена! 📄👍", "Пост официально задеплоен на главную страницу сайта!", "success");
        } else if (action === 'delete') {
            const { error } = await supabase.from('articles').delete().eq('id', postId);
            if (error) throw error;
            Swal.fire("Уничтожено! 🗑️", "Статья навсегда стерта из базы данных Supabase.", "success");
        }

        window.checkAdminProfile(); // Мгновенный ререндер интерфейса
    } catch (err) {
        Swal.fire("Ошибка действия над статьей", err.message, "error");
    }
};

// 4. ОТКРЫТИЕ МОДАЛКИ С КОММЕНТАМИ К КОНКРЕТНОМУ ПОСТУ
window.openModModal = function (postId, postTitle) {
    const modal = document.getElementById('mod-comment-modal');
    const modalTitle = document.getElementById('modal-post-title');
    const stream = document.getElementById('modal-comments-stream');
    if (!modal || !stream) return;

    modalTitle.innerText = `Модерация комментов: ${postTitle}`;
    const postComments = window.currentUnapprovedCache.filter(c => c.post_id === postId);

    if (postComments.length === 0) {
        window.closeModModal();
        window.checkAdminProfile();
        return;
    }

    stream.innerHTML = postComments.map(c => `
        <div style="background: #fcfcfc; border: 1px solid #ececec; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <b style="color: #333; font-size: 14px;">👤 ${c.user_name}</b>
                <small style="color: #999; font-size: 11px;">${new Date(c.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <p style="margin: 0 0 12px 0; color: #222; font-size: 16px; line-height: 1.4;">${c.content || c.text}</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.executeAdminAction('approve', '${c.id}', '${postId}', '${postTitle}')" style="background: #41cfff; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;">Одобрить 👍</button>
                <button onclick="window.executeAdminAction('delete', '${c.id}', '${postId}', '${postTitle}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;">Удалить 🗑️</button>
            </div>
        </div>
    `).join('');
    modal.style.display = 'flex';
};

window.closeModModal = function () {
    const modal = document.getElementById('mod-comment-modal');
    if (modal) modal.style.display = 'none';
};

// =========================================================================
// 5. ДЕЙСТВИЯ НАД КОММЕНТАМИ ВНУТРИ МОДАЛКИ (ОДОБРЕНИЕ / УДАЛЕНИЕ)
// =========================================================================
window.executeAdminAction = async function (action, commentId, postId, postTitle) {
    // 1. Вытаскиваем токен сессии Капибары
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        let response;
        if (action === 'approve') {
            // 🔥 ЖЕСТКИЙ ФИКС: Точно прописали /api/ перед comments/approve!
            // Передаем токен Bearer в заголовках Headers для верификации на сервере Express
            response = await fetch(`https://pro-info-api.onrender.com/api/comments/approve/${commentId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` 
                }
            });
            
            // Если бэкенд выплюнул ошибку (например, ты вошел не под Капибарой)
            if (response.status === 403) throw new Error("У вас нет прав админа Капибары! 🛑");
            if (!response.ok) throw new Error("Ошибка сервера при одобрении");
            
        } else if (action === 'delete') {
            // Уничтожаем коммент напрямую через клиент Supabase
            // Ядерный каскад на уровне базы автоматически сотрет все ответы на него!
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;
        }

        // 2. РЕАКТИВНЫЙ АПДЕЙТ ИНТЕРФЕЙСА БЕЗ МОРГАНИЯ ЭКРАНА
        // На лету вырезаем отработанный комментарий из локального кэша фронтенда
        window.currentUnapprovedCache = window.currentUnapprovedCache.filter(c => c.id != commentId);
        
        // Перерисовываем модальное окно для этого поста, чтобы список обновился мгновенно!
        window.openModModal(postId, postTitle);
        
    } catch (err) {
        Swal.fire("Ошибка действия над комментарием", err.message, "error");
    }
};
// Вставляй этот бронебойный триггер в самый-самый конец файла staty.js:
document.addEventListener("DOMContentLoaded", () => {
    // Проверяем, что глобальный объект supabase уже точно инициализирован в памяти!
    if (window.supabase && typeof window.checkAdminProfile === "function") {
        window.checkAdminProfile();
    } else {
        // Страховка: если render.js еще грузится, даем микро-таймаут в 100 миллисекунд
        setTimeout(() => {
            if (typeof window.checkAdminProfile === "function") window.checkAdminProfile();
        }, 100);
    }
});
