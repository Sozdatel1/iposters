// main.js
import { loadPosts } from './posts.js';
import { loadFullArticle } from './posts.js';
import { loadMore } from './utils.js';
// import { calculateReadingTimeStat } from './time-read.js';
import { loginUser } from './signin.js';
import {why} from './documentashion.js';
import {checkUserProfile} from './render.js';
window.publishPost = publishPost;
window.loadMore = loadMore;
// Инициализируем глобальные данные
window.allPostsData = [];
window.displayedCount = 8;

// ПРОСТО ВЫЗОВ
// ЕСЛИ НА СТРАНИЦЕ ЕСТЬ АЙДИ АРТ ТЕКСТ (СТАТЬЯ)
if (document.getElementById('artText')) {

    await loadFullArticle();
    calculateReadingTimeStat()
    await loadPosts();

}
if (document.getElementById('prof')) {
checkUserProfile() 
}
// ПРОВЕРКА: Если мы на главной (index.html)
if (document.getElementById('dynamic-cards')) {
    console.log("Загружаем ленту постов...");
    await loadPosts();
    await loadFullArticle();


}
if (document.getElementById('doc')) {
why()
}