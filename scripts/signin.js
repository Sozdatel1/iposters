
import { supabase } from './render.js';

// --- АВТОРИЗАЦИЯ (НИК + ПАРОЛЬ) ---
window.openAuthModal = function () {
    document.getElementById('auth-modal').style.display = 'flex';
};



// РЕГИСТРАЦИЯ
export async function registerUser(username, email, password) {
    const regErrorDisplay = document.getElementById('reg-error-msg');
    if (regErrorDisplay) regErrorDisplay.innerText = "";

    // 1. Проверяем заполнение всех обязательных полей
    if (!username.trim() || !email.trim() || !password.trim()) {
        if (regErrorDisplay) regErrorDisplay.innerText = "⚠️ Заполни все поля!";
        return;
    }

    try {
        
        Swal.showLoading(); // Красивый лоадер ожидания

        // 2. Проверяем никнейм на вашем бэкенде (на Render), чтобы не было точных дубликатов на сайте
        const checkResponse = await fetch('https://pro-info-api.onrender.com/api/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.trim() })
        });

        if (!checkResponse.ok) throw new Error("Ошибка проверки никнейма на сервере");
        const checkResult = await checkResponse.json();

        // Если никнейм уже занят, прерываем регистрацию
        if (checkResult.exists) {
            if (regErrorDisplay) regErrorDisplay.innerText = checkResult.message;
            Swal.close();
            return;
        }
        const emailResponse = await fetch('https://pro-info-api.onrender.com/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() })
        });

        if (!emailResponse.ok) throw new Error("Ошибка проверки почты на сервере");
        const emailResult = await emailResponse.json();

        if (emailResult.exists) {
            Swal.close();
            openAuthModal()
            if (regErrorDisplay) regErrorDisplay.innerText = `⚠️ ${emailResult.message}`;
            return;
        }
        // 🔥 КОНЕЦ ПРОВЕРКИ EMAIL

        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                // 🔥 ВОТ ОН — ЗАПРЕТ АВТО-ВХОДА:
                shouldCreateUserSession: false, 
                data: {
                    display_name: username.trim(),
                    name: username.trim()
                }
            }
        });

    
        

        // Если Supabase вернул ошибку (например, этот email уже зарегистрирован)
        if (error) {
            openAuthModal()
            if (regErrorDisplay) regErrorDisplay.innerText = `❌ ${error.message}`;
            Swal.close();
            return;
        }

        // 4. Успешное завершение
        if (typeof closeAuthModal === 'function') {
            closeAuthModal(); // Закрываем модальное окно фронтенда
        }

        await Swal.fire({
            title: "Почти готово! ✉️",
            text: `На почту ${email} отправлено письмо. Пожалуйста, подтвердите регистрацию!`,
            icon: "info",
            confirmButtonColor: "#00d4ff"
        });

        // Больше не делаем автоматический location.reload(), 
        // так как юзер сначала должен зайти на почту и подтвердить аккаунт.

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

    // 1. Проверяем заполнение полей, чтобы не слать пустые запросы
    if (!username.trim() || !password.trim()) {
        if (errorDisplay) errorDisplay.innerText = "⚠️ Заполни все поля!";
        return;
    }

    try {
        closeAuthModal()
        Swal.showLoading(); // Включаем сочный лоадер ожидания

        // 2. СТРОГИЙ СЕРВЕРНЫЙ ПОИСК: Запрашиваем email по никнейму на бэкенде Render
        // Сервер вернет email только если регистр букв совпал символ в символ!
        const response = await fetch('https://pro-info-api.onrender.com/api/get-email-by-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.trim() })
        });

        const result = await response.json();

        // Если бэкенд ответил ошибкой (например, никнейм написан с неправильным регистром букв)
        if (!response.ok) {
            if (errorDisplay) {
                openAuthModal()
                errorDisplay.innerText = `❌ ${result.error || 'Ошибка входа'}`;
            }
            Swal.close();
            return;
        }

        // 3. АВТОРИЗАЦИЯ В ОБЛАКЕ SUPABASE
        // Если сервер нашел email для этого точного регистра ника — сверяем пароль
        const { error: authError } = await supabase.auth.signInWithPassword({ 
            email: result.email, // Используем реальный email, полученный от бэкенда
            password: password 
        });

        // 4. Обработка ошибок авторизации Supabase (например, неверный пароль)
        if (authError) {
            Swal.close();
            
            // Если пользователь зарегистрировался, но еще не перешел по ссылке из Яндекс.Почты:
            if (authError.message.includes("Email not confirmed")) {
                if (errorDisplay) errorDisplay.innerText = "❌ Почта не подтверждена!";
                Swal.fire("Внимание!", "Пожалуйста, подтвердите вашу почту через ссылку в письме.", "warning");
            } else {
                // Если пароль действительно не подошел
                if (errorDisplay) errorDisplay.innerText = "❌ Неверный пароль";
            }
            return;
        }

        // 5. Триумфальное завершение входа
        if (typeof closeAuthModal === 'function') closeAuthModal();

        await Swal.fire({
            title: "С возвращением! 👋",
            text: "Вы успешно вошли в аккаунт",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

        // Бесшовная перезагрузка страницы для обновления сессии
        location.reload();

    } catch (err) {
        console.error("Критический сбой конвейера авторизации:", err.message);
        if (errorDisplay) errorDisplay.innerText = `❌ ${err.message}`;
        Swal.close();
    }
}
window.loginUser = loginUser;


