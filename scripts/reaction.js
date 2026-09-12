import { supabase } from './render.js';
export async function likePost(postId) {
    // ВАЖНО: Теперь postId приходит как аргумент, а не из URL
    if (!postId) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // 1. Быстрая проверка для анонимов через localStorage
        if (!user) {
            const myLikes = JSON.parse(localStorage.getItem('my_likes') || '[]');
            if (myLikes.includes(postId)) {
                return Swal.fire("Упс!", "Вы уже поставили лайк этому посту", "info");
            }
        }

        // 2. Запрос на сервер (передаем postId)
        const response = await fetch('https://pro-info-api.onrender.com/api/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session ? `Bearer ${session.access_token}` : ''
            },
            body: JSON.stringify({ postId: postId }) // Передаем наш ID
        });

        const result = await response.json();

        if (response.ok) {
            // --- ПРАЗДНИК ТОЛЬКО ПРИ УСПЕХЕ ---
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.7 },
                    colors: ['#41cfff', '#ffffff', '#ff8000']
                });
            }

            // Ищем спан именно ВНУТРИ этой карточки
            const likesSpan = document.getElementById(`likes-count-${postId}`);
            if (likesSpan) likesSpan.innerText = result.count;

            // Записываем анониму в локалку
            if (!user) {
                const myLikes = JSON.parse(localStorage.getItem('my_likes') || '[]');
                myLikes.push(postId);
                localStorage.setItem('my_likes', JSON.stringify(myLikes));
            }
        } else if (result.error === "already_liked") {
            Swal.fire("Упс!", "Вы уже поставили лайк этому посту", "info");
        }

    } catch (err) {
        console.error("Like error:", err);
    }
};
window.likePost = likePost