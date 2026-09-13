import { supabase } from './render.js';

if (!window.commentsLimit) {
    window.commentsLimit = {};
}

function buildCommentTree(list, parentId = null) {
    return list
        .filter(item => item.parent_id == parentId)
        .map(item => ({ ...item, replies: buildCommentTree(list, item.id) }));
}


export async function loadComments(postId, isLoadMore = false) {
    const list = document.getElementById(`comments-list-${postId}`);
    if (!list || !postId) return;

    // 1. Инициализируем и управляем лимитом КОРНЕВЫХ комментов
    if (!window.commentsLimit) {
        window.commentsLimit = {};
    }
    if (!window.commentsLimit[postId] || !isLoadMore) {
        window.commentsLimit[postId] = 3; // Старт с 3 главных веток
    } else if (isLoadMore) {
        window.commentsLimit[postId] += 3; // Добавляем по 3 ветки по клику
    }

    const currentLimit = window.commentsLimit[postId];

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // Запрос к бэкенду Express на Рендере
        const response = await fetch(`https://pro-info-api.onrender.com/api/comments/${postId}`);
        let allComments = await response.json();
        if (!Array.isArray(allComments)) {
            console.warn("Предупреждение: Сервер вернул ошибку, подменяем на пустой массив.");
            allComments = [];
        }
        if (!allComments || allComments.length === 0) {
            list.innerHTML = '<p style="color: gray; font-size: 14px; padding: 10px; text-align: center;">Пока никто не прокомментировал. Будьте первым!</p>';
            const oldBtn = document.getElementById(`load-more-btn-${postId}`);
            if (oldBtn) oldBtn.remove();
            return;
        }

        // Разделяем родителей и ответы на плоском уровне
        const rootComments = allComments.filter(c => !c.parent_id || c.parent_id === 0 || c.parent_id === 'null' || c.parent_id === '0' || c.parent_id === '');
        const replyComments = allComments.filter(c => c.parent_id && c.parent_id !== 'null' && c.parent_id !== '0');

        // Обрезаем родительские комменты по лимиту
        const limitedRoots = rootComments.slice(0, currentLimit);

        // Объединяем обратно для сборки рекурсивного дерева
        const filteredFlatList = [...limitedRoots, ...replyComments];
        const commentTree = buildCommentTree(filteredFlatList, null);

        // Рекурсивный генератор HTML (Вычищен до идеального блеска!)
        function generateCommentHtml(c, level = 0) {
            const isOwner = user && user.id === c.user_id;
            const marginShift = Math.min(level * 30, 90);

            const borderStyle = level > 0 ? 'border-left: 3px solid #41cfff;' : 'border: 1px solid #ececec;';
            const backgroundStyle = level > 0 ? 'background: #fafafa;' : 'background: #fcfcfc;';

            const rawText = c.content || c.text || '';
            const formattedText = rawText.replace(/(@[a-zA-Z0-9_а-яА-ЯёЁ]+)/g,
                `<span class="mention-tag" style="color: #41cfff; font-weight: bold; cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: 0.2s;">$1</span>`
            );

            // 🔥 ФИКС СИНИОРА: Если коммент твой - берем красивый регистр Yaa / Kapibara из живых метаданных сессии!
            // Никаких split почты, которые выкатывали дефисы и хэши (kapibara-malo)!
            // Если коммент чужого автора - выводим c.user_name, присланный сервером Express!
            const currentAuthorName = isOwner 
                ? (user.user_metadata?.display_name || user.user_metadata?.name || "Автор") 
                : (c.user_name || 'Аноним');
            return `
            <div style="margin-left: ${marginShift}px; ${backgroundStyle} ${borderStyle} padding: 12px; border-radius: 6px; margin-bottom: 12px; position: relative; transition: 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <b onclick="window.prepareReply('${postId}', '${c.id}', '${currentAuthorName}')" 
                       class="comment-author"
                       style="color: #333; font-size: 15px; cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: 0.2s;">
                       ${currentAuthorName}
                    </b>
                    <small style="color: #000000; font-size: 11px; margin: 0 auto;">
                        ${new Date(c.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </small>
                </div>
                
                <p style="margin: 0; color: #222; font-size: 16px; line-height: 1.4; padding-right: 20px;">${formattedText}</p>
                
                <div style="margin-top: 6px;">
                    <span onclick="window.prepareReply('${postId}', '${c.id}', '${currentAuthorName}')" 
                          style="color: #007bff; font-size: 12px; cursor: pointer; font-weight: bold; transition: 0.2s;"
                          onmouseover="this.style.color='#41cfff'" onmouseout="this.style.color='#007bff'">
                          Ответить
                    </span>
                </div>

                ${isOwner ? `
                    <button onclick="window.deleteComment('${c.id}', '${postId}')" 
                        style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 14px; padding: 0;" title="Удалить">🗑️</button>
                ` : ''}
            </div>
            ${c.replies.map(reply => generateCommentHtml(reply, level + 1)).join('')}
            `;
        }

        // Выводим дерево на страницу
        list.innerHTML = commentTree.map(c => generateCommentHtml(c, 0)).join('');

        // 🔥 ШАГ 3. ЖЕЛЕЗОБЕТОННОЕ ВЫВЕДЕНИЕ КНОПКИПОДГРУЗКИ
        const oldBtn = document.getElementById(`load-more-btn-${postId}`);
        if (oldBtn) oldBtn.remove();

        // Если реальное количество КОРНЕВЫХ (главных) комментов в базе больше текущего лимита,
        // кнопка ОБЯЗАНА появиться на экране твоего ноута!
        if (allComments.length > filteredFlatList.length) {
            list.insertAdjacentHTML('afterend', `
                <button id="load-more-btn-${postId}" onclick="loadComments('${postId}', true)" 
                    style="display: block; width: 100%; background: none; border: none; color: #007bff; cursor: pointer; font-size: 14px; padding: 10px 0; text-align: center; font-weight: bold; margin-top: -10px; margin-bottom: 15px;">
                    Показать ещё комментарии...
                </button>
            `);
        }

    } catch (err) {
        console.error("Критический сбой рендера дерева комментов:", err);
    }
};
window.loadComments = loadComments

// 2. ФУНКЦИЯ ПОДГОТОВКИ ОТВЕТА (Вызывается по клику на автора или кнопку "Ответить")
window.prepareReply = function (postId, commentId, authorName) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (!input) return;

    // Вшиваем ID родительского комментария в кастомный атрибут самого инпута
    input.setAttribute('data-parent-id', commentId);

    // Автоматически подставляем имя с собачкой и переводим фокус на поле ввода
    input.value = `@${authorName}, `;
    input.focus();
};


// 3. ОБНОВЛЕННАЯ ФУНКЦИЯ ОТПРАВКИ КОММЕНТАРИЯ (Умеет отправлять parentId)
window.sendComment = async function (postId, isLoadMore = false) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return Swal.fire("Ошибка", "Напишите хотя бы пару слов!", "warning");

    // Вытаскиваем parent_id из атрибута инпута (если его нет - улетит null, то есть главный коммент)
    const parentId = input.getAttribute('data-parent-id');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return openAuthModal();

    try {
        const response = await fetch(`https://pro-info-api.onrender.com/api/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                postId,
                text,
                parentId: parentId ? parseInt(parentId) : null
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        // Полная очистка поля и сброс состояния ответа после успешного сохранения в базу
        input.value = '';
        input.removeAttribute('data-parent-id');
        Swal.fire("Отправлено!", "Комментарий отправлен на модерацию.");
        // Мгновенно обновляем ветку комментов именно этой статьи
        if (window.loadComments) window.loadComments(postId);

    } catch (err) {
        Swal.fire("Ошибка", err.message, "error");
    }
};


// 4. ИСПРАВЛЕННАЯ ФУНКЦИЯ УДАЛЕНИЯ КОММЕНТАРИЯ (Каскад на бэкенде подчистит остальное)
window.deleteComment = async function (commentId, postId) {
    const result = await Swal.fire({
        title: 'Удалить комментарий?',
        text: "Все ответы на этот комментарий также будут уничтожены навсегда из базы данных!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#ccc',
        confirmButtonText: 'Да, удалить!',
        cancelButtonText: 'Отмена'
    });

    if (result.isConfirmed) {
        try {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;

            Swal.fire('Удалено!', 'Комментарий и вся его ветка успешно стерты.', 'success');
            if (window.loadComments) window.loadComments(postId);
        } catch (err) {
            Swal.fire('Ошибка', err.message, 'error');
        }
    }
};