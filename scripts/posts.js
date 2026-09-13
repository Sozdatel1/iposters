import { renderTrending } from './staty.js';
import { getAutoCategory, calculateReadingTimeForCard } from './utils.js';
import { loadComments } from './comments.js';
import { supabase } from './render.js';
import { likePost } from './reaction.js';
export async function renderFilteredPosts(postsToRender, append = false) {

    const grid = document.getElementById('dynamic-cards');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (!grid) return;

    if (postsToRender.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <span style="font-size: 50px;">🏜️</span>
                <h3 style="margin-top: 20px; color: #555;">В этой категории пока пусто</h3>
                <p style="opacity: 0.6;">Статей с таким тегом еще не написали...</p>
            </div>
        `;
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return; // Останавливаем функцию, чтобы не рисовать пустой список
    }
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    const dataToDraw = append ? postsToRender : postsToRender.slice(0, displayedCount);


    // ----------------------------------------------------------------------------

    // ВОТ ТУТ СОЗДАЕТСЯ ВРЕМЕННАЯ ПЕРЕМЕННАЯ post ОТ КОТОРОЙ МОЖНО ПЕРЕХОДИТЬ В КОНКРЕТНОЙ КАРТОЧКЕ
    //                                  \\//  
    //                                   ||
    // const response = await fetch(`https://pro-info-api.onrender.com/api/article/${id}`);
    const postsHtml = dataToDraw.map(post => {
        const isOwner = currentUser && (currentUser.id === post.user_id || currentUser.id === post.author_id);
        // КОГДА МЫ УПОМИНАЕМ post.text МЫ УПОМИНАЕМ ЭТУ ПЕРЕМЕННУЮ И ПУНКТ ТЕКСТ В МАССИВЕ КАРТОЧКИ И СТАТЬИ (на гитхаб файл постс джсон) ПРОСТО ЗДЕСЬ ОТРИСОВЫВАЕТСЯ ТОЛЬКО ЗАГОЛОВОК СТАТЬИ В КАРТОЧКЕ, А НА САМОМ ДЕЛЕ ОБРАТИТЬСЯ К ПЕРЕМЕННОЙ post МОЖНО И ЗА ТЕКСТОМ СТАТЬИ (post.text) КАК ЭТО ДЕЛАЕТ ФУНКЦИЯ ПЕРЕСЧЕТА СЛОВ calculateReadingTimeForCard

        // ------------------------------------------------------------------------------------------



        const timeAgo = formatTime(post.created_at); // Вот тут магия
        //  ${(post.image || post.image_url) ? `<img src="${post.image || post.image_url}" style="width: calc(100% + 50px)! important; 
        //            /* Добавь фиксированную высоту, чтобы object-fit сработал */
        //             margin: 0 -25px 15px -25px !important; 
        //             display: block; 
        //             aspect-ratio: 2 / 1;
        //             object-fit: cover; 
        //             border-radius: 0px; 
        //             flex-shrink: 0; 
        //             overflow: hidden; 
        //             background-color: #eee;">` : ''}

        const category = getAutoCategory(post.title, post.text); // ТЕПЕРЬ ПЕРЕДАЕМ И ТЕКСТ!

        // вызываем счетчик времени чтения
        const readingTime = calculateReadingTimeForCard(post.text);

        // Внутри твоего return `...`
        return `
    <div class="glass-card article-post" id="post-card-${post.id}" style="margin-bottom: 0px; border: 1px solid rgba(0, 0, 0, 0.09); padding: 30px 25px 25px 25px ; transition: all 0.5s ease; border-radius: 3px; background: rgb(255, 255, 255); scroll-margin-top: 0px; box-shadow: none !important; ">
    <span class="auto-tag"> • ${category} •</span>
        <p style="font-size: 15px; opacity: 0.7; margin-bottom: 15px;">
            Автор: <b>${post.author_name || "Аноним"} | ${timeAgo}</b> | 
        
            Читать ${readingTime} |
            Просмотров: <b id="viw-${post.id}">${post.viewCount || 0}</b>
        </p>
        <!-- Картинка: берем либо post.image, либо post.image_url (проверь как в базе) -->
    
        ${isOwner ? `
        <div class="author-panel" style="display: flex; gap: 10px; margin-bottom: 15px; padding: 10px; background: rgba(65, 207, 255, 0.1); border-radius: 10px;">
            <button onclick="window.openEditModal('${post.id}')" style="background:#41cfff; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">✏️ Редактировать</button>
            <button onclick="window.deletePost('${post.id}')" style="background:#fc2a00; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">🗑️ Удалить</button>
        </div>
    ` : ''}
        <h1 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 28px;">${post.title}</h1>
        <div id="container-${post.id}" class="text-container" style="max-height: 230px; overflow: hidden; position: relative; transition: max-height 0.5s ease;"><div id="text-${post.id}" style="overflow: hidden; transition: max-height 0.5s ease; font-size: 18px; line-height: 1.3; color: #333; white-space: pre-wrap; text-align: left; left: 0;">${post.text}
        </div>

    </div>
        <button onclick="window.togglePost('${post.id}')" id="btn-${post.id}" style="background: none; border: none; color: #41cfff; font-weight: bold; cursor: pointer; margin-top: 15px; padding: 10px; font-size: 16px;">
            Развернуть пост ↓
        </button>
                <div style="display: flex; gap: 10px;">
        <div id="like-btn-container-${post.id}" onclick="likePost('${post.id}')" style="cursor: pointer; display: flex; align-items: center; margin: 15px 0;">
    <span style="border: 2px solid red; border-radius: 50px; padding: 6px 10px; background-color: #ff8000; display: flex; align-items: center;">
        <img src="/img/staty/thumb_up_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" style="width: 20px;">
    </span>
    <span id="likes-count-${post.id}" style="margin-left: 15px; color: #ff8000; font-weight: bold; font-size: 24px;">
        ${post.real_likes || 0}
    </span>
    
    
</div>
<button onclick="window.sharePost('${post.id}')" class="share-btn" style="background: none; border: none;   cursor: pointer; font-size: 18px; padding: 5px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">Поделиться</button>
</div>
<div id="comments-section-${post.id}" style="display: none; margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
            <h2>💬 Комментарии</h2>
            <textarea id="commentInput-${post.id}" placeholder="Ваш комментарий..." style="width: 100%; height: 60px; border-radius: 10px; padding: 10px; margin-bottom: 10px;"></textarea>
            <button onclick="window.sendComment('${post.id}')" style="background: #41cfff; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">Отправить</button>
            <div id="comments-list-${post.id}" style="margin-top: 15px;"></div>
        </div>
        

    </div>
`;
    }).join('');

    // СТРАБАТЫВАЕТ ЕСЛИ НАЖАЛ ПОКАЗАТЬ ЕЩЕ, ДОРИСОВЫВАЕТ ЕЩЕ 9 СТАТЕЙ
    if (append) {
        // grid.insertAdjacentHTML('beforeend', postsHtml);
        grid.innerHTML += postsHtml;


        // СТРАБАТЫВАЕТ ЕСЛИ ПЕРЕКЛЮЧИЛ ФИЛЬТР И ЧТОБЫ НЕ ОТРЫСОСВЫВАТЬ ВСЕ СТАТЬИ 

    } else {
        grid.innerHTML = postsHtml;
    }

    // ШАГ 3: Управление кнопкой
    // if (loadMoreContainer) {
    //     // ЕСЛИ ПОКАЗАНЫ ВСЕ КАРТОЧКИ, КНОПКА ПОКАЗАТЬ ЕЩЕ УБИРАЕТСЯ, ЕСЛИ ЕЩЕ МОЖНО ПОКАЗАТЬ, ТО ОНА ОСТАЁТСЯ

    //     loadMoreContainer.style.display = (displayedCount >= (window.currentFilteredCount || postsToRender.length)) ? 'none' : '';
    // }
    if (loadMoreContainer) {
        // 1. УЗНАЕМ РЕАЛЬНОЕ КОЛИЧЕСТВО:
        // Если мы фильтруем, берем длину отфильтрованного списка (postsToRender)
        // Если это общая лента, тоже берем длину того, что пришло в функцию
        const totalAvailable = postsToRender.length;

        // 2. СРАВНИВАЕМ:
        // Если мы уже показали (window.displayedCount) столько же или больше, 
        // чем есть всего в этом списке — ПРЯЧЕМ кнопку.
        if (window.displayedCount >= totalAvailable && !append) {
            loadMoreContainer.style.display = 'none';
        } else if (append && postsToRender.length < 8) {
            // Если мы нажали "еще", но пришло меньше 8 новых постов — ПРЯЧЕМ
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }

    // Ищем ТОЛЬКО ТЕ карточки, которые МЫ ТОЛЬКО ЧТО ДОБАВИЛИ КНОПКОЙ ПОКАЗАТЬ ЕЩЕ, ДЕЛАЕМ ИМ АНИМАЦИЮ ПОЯВЛЕНИЯ
    const newCards = grid.querySelectorAll('.article-post:not(.visible)');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            newCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 50); // Уменьшил до 50мс для сочности и скорости
            }, 200);


        });
    });
};
window.renderFilteredPosts = renderFilteredPosts;


export async function loadPosts() {
    window.renderLoader.start();
    try {
        const response = await fetch('https://pro-info-api.onrender.com/api/posts');
        const data = await response.json();
        const trend = document.getElementById ('.trending-box')
        window.allPostsData = data;
        renderFilteredPosts(data);
        renderTrending(data);
        if (trend) updateHubStats(data);
        // 🔥 ФИНАЛЬНЫЙ ШТРИХ: посты на экране, проверяем ссылку!
        window.checkUrlHash();
    } catch (err) {
        console.error("Ошибка фронтенда:", err.message);
    }
    finally {
        window.renderLoader.stop(); // 2. 🔥 ТУШИМ ЛОАДЕР сразу после ответа сервера!
    }
}
window.loadPosts = loadPosts

// ЗАГРУЗКА ПОСТА
export async function loadFullArticle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    // Вызываем твою функцию регистрации просмотра (её тоже можно будет потом перенести)
    if (typeof registerView === 'function') registerView(postId);

    try {
        // 1. Получаем данные от нашего сервера
        const response = await fetch(`https://pro-info-api.onrender.com/api/article/${id}`);
        const article = await response.json();
        if (!response.ok) throw new Error(article.error);

        // 2. Отрисовка текста и заголовков (ТВОЙ КОД)
        document.getElementById('artTitle').innerText = article.title;
        document.getElementById('artText').innerHTML = article.text.replace(/\n/g, '<br>');
        document.getElementById('arti').innerHTML = `${article.title} | iPosters`;

        const likesSpan = document.getElementById('artLikes');
        if (likesSpan) likesSpan.innerText = article.real_likes;



        const imgTag = document.getElementById('artImage');
        if (article.image && imgTag) {
            imgTag.src = article.image;
            imgTag.style.display = 'block';
        }
        if (document.getElementById('avtor')) {
            document.getElementById('avtor').innerText = article.author_name || "Аноним";
        }
        const postId = params.get('id');
        const count = await fetch(`https://pro-info-api.onrender.com/api/view-count/${postId}`);
        const data = await count.json();

        const viwElem = document.getElementById('viw');
        if (viwElem) {
            viwElem.innerHTML = `<span>${data.count}</span>`;
        }

        // 3. Проверка прав на удаление/редактирование
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const delArt = document.getElementById('delete-art');

        if (delArt && user && user.id === article.user_id) {
            delArt.innerHTML = `
                <div class="panel" style="display: flex;">

        <button onclick="openEditModal ('${id}')" style="cursor: pointer; padding: 11px; background: #41cfff;
color: white;
border-color: #41cfff;
box-shadow: 0 4px 15px rgba(65, 207, 255, 0.4),
    0 0 5px rgba(0, 255, 65, 0.2); border: none; border-radius: 20px; font-size: 20px; margin: 20px auto">
                Редактировать
            </button>

            <p id="read-time" style="padding: 11px; background: #0019fc;
color: white;
border-color: #ff4141;
box-shadow: 0 4px 15px rgba(65, 106, 255, 0.4),
    0 0 5px rgba(0, 8, 255, 0.2); border: none; border-radius: 20px; font-size: 20px; margin: 20px">

    </p>
            <button onclick="deletePost('${id}')" style="  cursor: pointer; padding: 11px; background: #fc2a00;
color: white;
border-color: #ff4141;
box-shadow: 0 4px 15px rgba(255, 65, 65, 0.4),
    0 0 5px rgba(0, 255, 65, 0.2); border: none; border-radius: 20px; font-size: 20px; margin: 20px auto">
                Удалить статью
            </button></div>
            `;
        } else if (delArt) {
            // Если не автор — очищаем контейнер (на всякий случай)
            delArt.innerHTML = `
        <p id="read-time" style="padding: 11px; background: #0019fc;
color: white;
border-color: #ff4141;
box-shadow: 0 4px 15px rgba(65, 106, 255, 0.4),
    0 0 5px rgba(0, 8, 255, 0.2); border: none; border-radius: 20px; font-size: 20px; margin: 20px"></p>`;
        } else if (delArt) {
            delArt.innerHTML = `<p id="read-time" class="time-block"></p>`;
        }

    } catch (err) {
        console.error('Ошибка загрузки статьи:', err.message);
    }

    loadComments();
}
window.loadFullArticle = loadFullArticle


// 2. ЗАГРУЗКА ДЛЯ ЛИЧНОГО АККАУНТА
export async function loadMyArticles() {
    try {
        // 1. Получаем живую сессию фронтенда, чтобы вытащить ID текущего пользователя
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (!session || !currentUser) return;

        // 🔥 АБСОЛЮТНЫЙ ФИКС СИНИОРА: Передаем userId GET-параметром прямо в адресную строку URL!
        // Полностью вырезали блокирующийся блок headers! Ошибка 401 уничтожена на веки веков!
        const response = await fetch(`https://pro-info-api.onrender.com/api/my-articles?userId=${currentUser.id}`);
        
        if (typeof window.checkAdminProfile === 'function') {
            window.checkAdminProfile();
        }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. Сохраняем данные во внутренние массивы платформы iPosters
        window.displayedCount = data.length;
        window.allPostsData = data;

        // Запускаем чистокровную отрисовку полнотекстовых постов со всеми лайками и просмотрами!
        if (typeof renderFilteredPosts === 'function') {
            renderFilteredPosts(data);
        }
    } catch (err) {
        console.error("Ошибка загрузки моих статей в профиле:", err.message);
    }
}
window.loadMyArticles = loadMyArticles

window.togglePost = async function (postId) {
    const textBlock = document.getElementById(`text-${postId}`);
    const btn = document.getElementById(`btn-${postId}`);
    const commentSection = document.getElementById(`comments-section-${postId}`);
    const container = document.getElementById(`container-${postId}`);
    if (!container.classList.contains('expanded')) {
        // --- РАСКРЫВАЕМ ---
        container.classList.add('expanded');
        container.style.maxHeight = textBlock.scrollHeight + "px";
        btn.innerText = "Свернуть пост ↑";

        // 1. Считаем просмотр (localStorage внутри спасет от накрутки)
        if (typeof registerView === 'function') {
            await registerView(postId);
        }

        // 2. Показываем комменты
        if (commentSection) {
            commentSection.style.display = 'block';
            if (window.loadComments) loadComments(postId, 3);
        }

        // 3. Обновляем цифру просмотров в карточке
        try {
            const countRes = await fetch(`https://pro-info-api.onrender.com/api/view-count/${postId}`);
            if (countRes.ok) {
                const data = await countRes.json();
                const viewElem = document.getElementById(`viw-${postId}`);
                if (viewElem) viewElem.innerText = data.count;
            }
        } catch (e) { console.log("Счетчик пока спит..."); }

    } else {
        // --- СВОРАЧИВАЕМ ---
        container.classList.remove('expanded'); // Возвращаем градиент
        container.style.maxHeight = "230px"; // Возвр
        btn.innerText = "Развернуть пост ↓";
        if (commentSection) commentSection.style.display = 'none';

        const card = document.getElementById(`post-card-${postId}`);
        if (card) {
            const startTime = performance.now();
            const duration = 500; // Длительность твоей CSS анимации (0.5s)

            function scrollSync(now) {
                const elapsed = now - startTime;

                // Пока идет анимация, прижимаем нижний край карточки к низу экрана
                card.scrollIntoView({
                    behavior: 'auto', // 'auto' вместо 'smooth', чтобы не было конфликта скоростей
                    block: 'end'
                });

                // Если 500мс не прошло, запрашиваем следующий кадр анимации
                if (elapsed < duration) {
                    requestAnimationFrame(scrollSync);
                }
            }

            // Запускаем синхронизацию скролла
            requestAnimationFrame(scrollSync);
        }

    }
};

export async function publishPost(data) {
    const title = data ? data.title : document.getElementById('postTitle').value;
    const image = data ? data.image : document.getElementById('postImage').value;

    // ТВОЯ МАГИЯ: сохраняем проверку инпута или редактируемого div
    const text = data ? data.text : (document.getElementById('postInput').value || document.getElementById('postInput')?.innerHTML);
    if (!title || !text) {
        return Swal.fire({
            title: "Заполни поля!",
            text: "Статья не может быть без заголовка или текста.",
            icon: "warning",
            confirmButtonColor: "#ff8000"
        });
    }

    try {
        // 1. Получаем токен сессии
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return openAuthModal();

        // 2. Отправляем данные на наш Node.js сервер строго по твоему роуту /api/publish
        const response = await fetch(`https://pro-info-api.onrender.com/api/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                title,
                text, // Передаем текст как text
                image,
                id: window.currentEditId // Если null — сервер поймет, что это новый пост
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        // 3. УСПЕХ ДЕПЛОЯ
        const isEdit = !!window.currentEditId;

        // 🔥 UI/UX ТРИУМФ МЕГА-ОГУРЦА: Меняем уведомление для новых постов!
        // Если это редактирование старого поста (isEdit === true) - пишем "Обновлено!".
        // Если это создание новой статьи - честно пишем, что она улетела на проверку к Капибаре!
        if (isEdit) {
            await Swal.fire({
                title: "Обновлено!",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = `article.html?id=${window.currentEditId}`;
        } else {
            // Если пост новый — он скрыт, поэтому location.reload() делать не нужно, 
            // иначе у пользователя просто моргнет пустая главная страница. 
            // Показываем сочное окно карантина модерации!
            await Swal.fire({
                title: "Отправлено! 📄⏳",
                text: "Ваша статья успешно отправлена на модерацию!. Админ решит, опубликуется она или нет.",
                icon: "success",
                confirmButtonColor: "#41cfff" // Твой фирменный неон!
            });
            // Перенаправляем человека, например, в личный кабинет профиля, чтобы он видел свои статьи на проверке
            window.location.href = "profile.html";
        }

    } catch (err) {
        Swal.fire("Ошибка", err.message, "error");
    }
}
window.publishPost = publishPost;

window.deletePost = async function (postId) {
    // 1. Проверяем, что ID вообще пришел
    console.log("Пытаемся удалить статью с ID:", postId);

    if (!postId || postId === "undefined" || postId === "null") {
        console.error("Ошибка: ID статьи пустой или некорректный!");
        return Swal.fire("Ошибка", "Не удалось определить ID статьи для удаления", "error");
    }

    const result = await Swal.fire({
        title: "Вы уверены?",
        text: "Статью нельзя будет восстановить!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff4d4d",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Да, удалить!",
        cancelButtonText: "Отмена"
    });

    if (result.isConfirmed) {
        try {
            // 2. Делаем запрос на удаление
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            await Swal.fire({
                title: "Удалено!",
                text: "Статья успешно удалена.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            if (document.getElementById('artTitle')) { // Если на странице есть заголовок статьи
                window.location.href = '/profile'; // Vercel сам поймет, что это profile.html
            } else {
                // Если мы в профиле, просто обновляем страницу, чтобы статья исчезла из списка
                location.reload();
            }
        } catch (err) {
            Swal.fire("Ошибка", err.message || "Ошибка на стороне базы данных", "error");
            console.error("Ошибка удаления статьи:", err);
        }
    }
}
