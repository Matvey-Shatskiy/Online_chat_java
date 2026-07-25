import { registerUser, loginUser } from './api.js';

export function initLogin() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        errorEl.textContent = '';

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Загрузка...';

        try {
            await loginUser(email, password);
            window.location.href = '/chat.html';
        } catch (err) {
            errorEl.textContent = err.message || 'Неверный логин или пароль';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    });
}

export function initRegister() {
    const form = document.getElementById('register-form');
    const errorEl = document.getElementById('error');
    const successEl = document.getElementById('success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm').value;
        errorEl.textContent = '';
        successEl.textContent = '';

        if (password !== confirm) {
            errorEl.textContent = 'Пароли не совпадают';
            return;
        }
        if (password.length < 6) {
            errorEl.textContent = 'Пароль должен быть не менее 6 символов';
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';

        try {
            await registerUser(email, username, password);
            successEl.textContent = 'Регистрация успешна! Перенаправление...';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } catch (err) {
            errorEl.textContent = err.message || 'Ошибка регистрации';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });
}