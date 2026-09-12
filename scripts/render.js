const { createClient } = window.supabase;

// 1. НАСТРОЙКА (Вставь свои данные из Settings -> API)
export const supabase = createClient('https://nwopcdkydnuudovkgvxs.supabase.co', 'sb_publishable_U38NKz2Gg_btgccNGzIDCA_ynTC9x7q')




// Закрыть модальное окно
window.closeAuthModal = function () {
    document.getElementById('auth-modal').style.display = 'none';
};


// ПРОСМОТРЫ

async function registerView(postId) {
    // 1. Проверяем метку в браузере
    const storageKey = `viewed_${postId}`;
    if (localStorage.getItem(storageKey)) {
        return; // Если уже смотрели, просто выходим
    }

    try {
        // 2. Если метки нет — пинаем сервер
        const response = await fetch(`https://pro-info-api.onrender.com/api/view/${postId}`, {
            method: 'POST'
        });

        // 3. Если сервер ответил успешно — ставим метку
        if (response.ok) {
            localStorage.setItem(storageKey, 'true');
        }
    } catch (err) {
        console.error('Ошибка регистрации просмотра');
    }
}
window.registerView = registerView;


function handleSearch(event) {
    const term = event.target.value.toLowerCase().trim();
    console.log("Печатаю:", event.target.value);
    if (!window.allPostsData) return console.warn("Нет данных!");

    // 1. Проверяем, есть ли данные для поиска
    if (!window.allPostsData) {
        console.warn("Данные еще не загружены!");
        return;
    }
    
    // 2. Фильтруем массив по заголовку и тексту
    const filtered = window.allPostsData.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.text.toLowerCase().includes(term)
    );
    console.log("Найдено статей:", filtered.length); // Проверка в консоли
    // 3. Вызываем твою функцию отрисовки
    if (typeof window.renderFilteredPosts === 'function') {
        window.renderFilteredPosts(filtered, false);
    }

    // 4. Если пусто — пишем сообщение
    const container = document.getElementById('articles-container');
    if (filtered.length === 0 && container) {
        container.innerHTML = `<p style="color: #00d4ff; text-align: center; padding: 20px;">Ничего не найдено... 🔍</p>`;
    }
}

// Делаем функцию доступной для HTML
window.handleSearch = handleSearch;




let isRegMode = false;

// Открыть модальное окно


// Переключение между Входом и Регистрацией
// Убедитесь, что эта переменная объявлена один раз вверху файла (вне функций)

window.toggleModalMode = function () {
    isRegMode = !isRegMode;

    const title = document.getElementById('modal-title');
    const btn = document.getElementById('modal-btn');
    const switchText = document.getElementById('modal-switch-text');
    const switchLink = document.getElementById('modal-switch-link');
    
    // НАХОДИМ ИНПУТЫ И ПЛАШКУ ОШИБОК
    const userInput = document.getElementById('user');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('pass');
    const errorMsg = document.getElementById('auth-error-msg');

    // Очищаем старый ввод и ошибки при переключении окон
    if (errorMsg) errorMsg.innerText = "";
    if (userInput) userInput.value = "";
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";

    if (isRegMode) {
        title.innerText = "Регистрация";
        btn.innerText = "Создать аккаунт";
        switchText.innerText = "Уже есть аккаунт?";
        switchLink.innerText = "Войти";
        
        // Переключаем инпуты для режима РЕГИСТРАЦИИ
        if (userInput) userInput.placeholder = "Придумайте никнейм";
        if (emailInput) emailInput.style.display = "block"; // Показываем почту!
    } else {
        title.innerText = "Вход в аккаунт";
        btn.innerText = "Войти";
        switchText.innerText = "Еще нет аккаунта?";
        switchLink.innerText = "Создать аккаунт";
        
        // Переключаем инпуты для режима ВХОДА
        if (userInput) userInput.placeholder = "Ваш никнейм";
        if (emailInput) emailInput.style.display = "none";  // Скрываем почту!
    }
};


// Срабатывает при нажатии на большую кнопку
window.handleModalAction = function () {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    // НАХОДИМ ИНПУТ ПОЧТЫ
    const emailEl = document.getElementById('email');
    const email = emailEl ? emailEl.value : ""; 
    
    const errorDisplay = document.getElementById('auth-error-msg');
    
    // Валидация полей в зависимости от режима
    if (isRegMode) {
        // При регистрации проверяем все 3 поля
        if (!user.trim() || !email.trim() || !pass.trim()) {
            if (errorDisplay) errorDisplay.innerText = "⚠️ Заполните все поля!";
            return;
        }
    } else {
        // При входе проверяем только ник и пароль
        if (!user.trim() || !pass.trim()) {
            if (errorDisplay) errorDisplay.innerText = "⚠️ Заполните все поля!";
            return;
        }
    }
    
    if (errorDisplay) errorDisplay.innerText = "";
    
    if (isRegMode) {
        // ПЕРЕДАЕМ ТРИ АРГУМЕНТА: ник, почту, пароль
        registerUser(user, email, pass);
    } else {
        // ПЕРЕДАЕМ ДВА АРГУМЕНТА: ник и пароль
        loginUser(user, pass);
    }
};

// Закрытие при клике вне карточки
window.addEventListener('click', (e) => {
    const modal = document.getElementById('auth-modal');
    if (e.target === modal) {
        closeAuthModal();
    }
});

// Функция, которая проверяет статус входа и меняет кнопки (ДЛЯ ГЛАВНОЙ)
// =========================================================================
// 🦫 СУВЕРЕННЫЙ И СИНХРОННЫЙ UI-МОДУЛЬ ШАПКИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ (INDEX)
// =========================================================================
async function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const profileBtn = document.getElementById('profile-btn');
    const usernameDisplay = document.getElementById('username-display');
    const plus = document.getElementById('plus');

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
        // 🔥 АБСОЛЮТНЫЙ ФИКС СИНИОРА: Достаем красивый регистр никнейма напрямую из метаданных базы!
        // Никакого жесткого затирания маленькими буквами из email!
        const username = user.user_metadata?.display_name || user.user_metadata?.name || user.email.split('@')[0] || 'Аноним';

        if (usernameDisplay) {
            usernameDisplay.innerText = username; // Выведет строго красивый: "Kapibara" или "Yaa"
        }
        if (plus) {
            plus.style.display = 'flex';
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (profileBtn) profileBtn.style.display = 'none';
        if (plus) plus.style.display = 'none';
    }
}

window.updateAuthUI = updateAuthUI


// Функция защиты роута (ДЛЯ ПРОФИЛЯ)
export async function checkUserProfile() {
    const { data: { session }, error } = await supabase.auth.getSession();
    const user = session?.user;
    // Если не вошел — отправляем на главную БЕЗ сохранения в истории переходов
    if (!user || error) {
        window.location.replace('index.html');
        return;
    }

    // Показываем ник в шапке (отрезаем домен)
    const username = user.user_metadata?.display_name || user.user_metadata?.name || user.email.split('@')[0] || 'Аноним';
    const profileBtn = document.getElementById('profile-btn');
    const usernameDisplay = document.getElementById('username-display');
    const akk = document.getElementById('akk')
    const prof = document.getElementById('profile')
    // const avtor = document.getElementById('avtor');
    if (profileBtn) {
        profileBtn.style.setProperty('display', 'block', 'important');
    }
    if (usernameDisplay) {
        usernameDisplay.innerText = username;
    }
    if (akk) {

        akk.innerText = `${username} | Профиль`; // Получится: "ivan | Профиль"
    }
    if (prof) {

        prof.innerText = `${username} • Профиль | iPosters`; // Получится: "ivan | Профиль"
    }
    // Загружаем только статьи этого пользователя
    if (typeof loadMyArticles === 'function') {
        loadMyArticles(user.id);
    }
}
window.checkUserProfile = checkUserProfile;
// Функция для кнопки "Профиль"
window.goToProfile = function () {
    window.location.href = 'profile.html';
};

// Функция выхода
window.logoutUser = async function () {
    await supabase.auth.signOut();
    window.location.replace('index.html'); // replace спасает от зацикливания
};

// --- ГЛАВНОЕ ИСПРАВЛЕНИЕ: Разделение запуска по страницам ---
document.addEventListener('DOMContentLoaded', () => {
    const isProfilePage = document.getElementById('prof')

    if (isProfilePage) {
        // На странице профиля проверяем сессию и редиректим если не залогинен
        checkUserProfile();
    } else {
        // На остальных страницах (главной) просто переключаем кнопки Войти/Профиль
        updateAuthUI();
    }
});



// const delArt = document.getElementById('delete-art')
// if (delArt) {
//     delArt.innerHTML = `
//       <button onclick="deletePost('${postId}')" style="color: red; border: none; background: none; cursor: pointer;">
//         Удалить
//     </button>`}
window.deleteMyAccount = async function () {
    // 1. Показываем всплывающее окно с предупреждением
    const { data: { session }, error } = await supabase.auth.getSession();
    const user = session?.user;
    const username = user.user_metadata?.display_name || user.user_metadata?.name || user.email.split('@')[0] || 'Аноним';
    const result = await Swal.fire({
        title: `Удалить аккаунт ${username}?`,
        text: "Ваш профиль и ВСЕ ваши статьи будут безвозвратно удалены!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff4d4d",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Да, удалить всё",
        cancelButtonText: "Отмена"
    });

    // 2. Если пользователь нажал "Да, удалить всё"
    if (result.isConfirmed) {
        try {
            // Получаем ID текущего авторизованного пользователя
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return Swal.fire("Ошибка", "Пользователь не найден", "error");
            }

            // Показываем индикатор загрузки
            Swal.fire({
                title: 'Удаление...',
                text: 'Пожалуйста, подождите',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 3. Отправляем запрос на ваш бэкенд на Render
            const response = await fetch('https://pro-info-api.onrender.com/api/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: user.id })
            });

            const resData = await response.json();

            // Если сервер вернул ошибку
            if (!response.ok || resData.error) {
                throw new Error(resData.error || "Не удалось удалить аккаунт");
            }

            // 4. Уведомляем об успехе
            await Swal.fire({
                title: "Удалено!",
                text: "Ваш аккаунт был успешно стерт.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            // Выходим из сессии в браузере и редиректим на главную
            await supabase.auth.signOut();
            window.location.replace('index.html');

        } catch (err) {
            // Если что-то пошло не так (например, сервер Render спит)
            Swal.fire("Ошибка", err.message, "error");
            console.error("Ошибка удаления:", err);
        }
    }
}















window.closeEditModal = function () {
    document.getElementById('edit-modal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Возвращаем скролл
};

window.saveChanges = async function () {
    const newTitle = document.getElementById('editTitle').value;
    const newText = document.getElementById('editText').value;
    const newImage = document.getElementById('editImage').value;

    // 1. Проверяем наличие ID
    if (!window.currentEditId) {
        return Swal.fire("Ошибка", "ID статьи не найден", "error");
    }

    if (!newTitle || !newText) {
        return Swal.fire("Ошибка", "Поля не могут быть пустыми", "warning");
    }

    try {
        // 2. Добавляем .select(), чтобы проверить, обновилось ли что-то реально
        const { data, error } = await supabase
            .from('articles')
            .update({ title: newTitle, text: newText, image: newImage })
            .eq('id', window.currentEditId)
            .select();

        if (error) throw error;

        // 3. Если data пустая — значит RLS заблокировал обновление
        if (!data || data.length === 0) {
            return Swal.fire("Доступ запрещен", "У вас нет прав на редактирование этой статьи.", "error");
        }

        await Swal.fire({
            title: "Обновлено!",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

        location.reload();
    } catch (err) {
        Swal.fire("Ошибка", err.message, "error");
        console.error("Ошибка при сохранении:", err);
    }
};





