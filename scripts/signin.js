// --- АВТОРИЗАЦИЯ (НИК + ПАРОЛЬ) ---
window.openAuthModal = function () {
    document.getElementById('auth-modal').style.display = 'flex';
};



// РЕГИСТРАЦИЯ
export async function registerUser(username, password) {
    const regErrorDisplay = document.getElementById('reg-error-msg');
    if (regErrorDisplay) regErrorDisplay.innerText = "";

    // 1. Проверяем заполнение обязательных полей формы
    if (!username.trim() || !password.trim()) {
        if (regErrorDisplay) regErrorDisplay.innerText = "⚠️ Заполни все поля!";
        return;
    }

    try {
        Swal.showLoading(); // Включаем сочный лоадер ожидания

        // 🚨 ШАГ 2. СТРОГИЙ СЕРВЕРНЫЙ ИНТЕРЦЕПТ: Проверяем ник на бэкенде Рендера!
        // Запрос идет регистрозависимо, символ в символ (kapibara !== Kapibara)!
        const checkResponse = await fetch('https://pro-info-api.onrender.com/api/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        });

        if (!checkResponse.ok) throw new Error("Ошибка проверки никнейма на сервере");

        const checkResult = await checkResponse.json();

        // Если сервер нашел точное совпадение имени в базе с учетом больших букв - стопаем код!
        if (checkResult.exists) {
            if (regErrorDisplay) regErrorDisplay.innerText = checkResult.message;
            Swal.close();
            return;
        }

        // 🚨 ШАГ 3. КИБЕР-ГЕНЕРАЦИЯ УНИКАЛЬНОГО ХЭШ-EMAIL: Обходим citext-фильтр Supabase!
        // Высчитываем количество больших букв в инпуте юзера
        let casingHash = "malo";
        if (username !== username.toLowerCase()) {
            // Если есть заглавные буквы - считаем их количество и шьем метку bolsh!
            casingHash = "bolsh" + username.replace(/[^A-Z]/g, '').length;
        }

        // Очищаем имя для безопасной отправки в левую часть email
        const cleanNickForEmail = username.toLowerCase().replace(/[^a-z0-9]/g, '');

        // На выходе для "kapibara" -> kapibara-malo@app.local
        // На выходе для "Kapibara" -> kapibara-bolsh1@app.local — СТРОКИ СТАЛИ РАЗНЫМИ ДЛЯ БД!
        const validEmail = `${cleanNickForEmail}-${casingHash}@app.local`;

        // 4. ШТУРМ ОБЛАКА: Регистрируем уникальный аккаунт в Supabase Auth
        // Намертво сохраняем оригинальный красивый регистр со всеми большими буквами в метаданные!
        const { data, error } = await supabase.auth.signUp({
            email: validEmail,
            password: password,
            options: {
                data: {
                    display_name: username, // Сохранит строго: "Kapibara" или "Yaa"
                    name: username
                }
            }
        });

        if (error) {
            if (regErrorDisplay) regErrorDisplay.innerText = `❌ ${error.message}`;
            Swal.close();
            return;
        }
        if (typeof closeAuthModal === 'function') {
            closeAuthModal();
        }
        // Закрываем модалку фронтенда после триумфа


        // Сочный вывод салюта успеха
        await Swal.fire({
            title: "Готово! 🎉",
            text: `Аккаунт ${username} успешно создан!`,
            icon: "success",
            confirmButtonColor: "#00d4ff"
        });

        // Перезагружаем сессию для мгновенного вступления в силу без ВПН
        location.reload();

    } catch (err) {
        console.error("Критический сбой регистрационного конвейера:", err.message);
        if (regErrorDisplay) regErrorDisplay.innerText = `❌ ${err.message}`;
        Swal.close();
    }
}
window.registerUser = registerUser;


// ВХОД
export async function loginUser(username, password) {
    const errorDisplay = document.getElementById('auth-error-msg');
    if (errorDisplay) errorDisplay.innerText = "";

    // 1. Сначала проверяем поля, чтобы не слать пустой запрос (избегаем ошибки 400)
    if (!username.trim() || !password.trim()) {
        if (errorDisplay) errorDisplay.innerText = "⚠️ Заполни все поля!";
        return;
    }

    // 2. 🔥 АБСОЛЮТНЫЙ UI-СИНХРОН СИНИОРА: Повторяем логику хэша больших букв один в один с SignUp!
    // Считаем количество больших заглавных букв в инпуте входа
    let casingHash = "malo";
    if (username !== username.toLowerCase()) {
        // Если есть большие буквы - считаем их точное количество и шьем метку bolsh!
        casingHash = "bolsh" + username.replace(/[^A-Z]/g, '').length;
    }

    // Очищаем имя для сборки левой части почты строго в нижнем регистре
    const cleanNickForEmail = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    // На выходе для "kapibara" -> соберется kapibara-malo@app.local
    // На выходе для "Kapibara" -> соберется kapibara-bolsh1@app.local — ТОЧНОЕ ПОПАДАНИЕ В СВОЙ АККАУНТ КЛОНА!
    const email = `${cleanNickForEmail}-${casingHash}@app.local`;

    // 3. ШТУРМ ОБЛАКА SUPABASE AUTH: Входим строго в целевой изолированный профиль!
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.warn("Новый хэш-профиль не найден, проверяем старую базу .local...");

        // Сборка старой классической почты, которая была у тебя изначально!
        const legacyEmail = `${username.toLowerCase()}@app.local`;

        // ПОПЫТКА №2: Бесшовно штурмуем базу по старому адресу!
        const legacyAuth = await supabase.auth.signInWithPassword({ email: legacyEmail, password });

        if (legacyAuth.error) {
            // Если и старый акк не нашелся - только тогда выводим ошибку на экран!
            if (errorDisplay) errorDisplay.innerText = "❌ Неверный ник или пароль";
            return;
        }
    }

    // 4. Бесшовная перезагрузка сессии фронтенда напрямую без ВПН
    location.reload();
}
window.loginUser = loginUser;


