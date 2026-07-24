#  Real-Time Web Messenger

Современный веб-мессенджер с возможностью обмена сообщениями в реальном времени, аутентификацией по JWT, управлением профилем и отслеживанием статусов пользователей.

![Java](https://img.shields.io/badge/Java-26-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)

---

## Основные возможности

* **Аутентификация и безопасность:** Регистрация, вход в систему с использованием **JWT (JSON Web Tokens)** и хешированием паролей (**BCrypt**).
* **Чат в реальном времени:** Обмен сообщениями без перезагрузки страницы на базе **WebSocket**.
* **Статусы пользователей:** Отслеживание состояния `Online` / `Offline` в режиме реального времени.
* **Управление профилем:** Возможность изменения имени, статуса «О себе», а также загрузки индивидуальной аватарки.
* **Поиск пользователей:** Удобный поиск собеседников по никнейму.

---

## Технологический стек

### Backend
* **Language:** Java 26
* **Framework:** Spring Boot 4
* **Security:** Spring Security + JWT 
* **Real-time:** Spring WebSocket
* **Database:** SQLite + Spring Data JPA (Hibernate)
* **Build Tool:** Maven

### Frontend
* HTML5, CSS3 
* JavaScript 

---

## Структура проекта

```text
src/
├── main/
│   ├── java/com/messenger/
│   │   ├── config/         # Конфигурации Security, WebSocket, Web
│   │   ├── controller/     # REST-контроллеры (Auth, Users, Profile)
│   │   ├── model/          # JPA Сущности (User, Message)
│   │   ├── repository/     # Spring Data JPA репозитории
│   │   ├── security/       # JWT Фильтры и утилиты
│   │   ├── service/        # Бизнес-логика
│   │   └── websocket/      # Обработчик WebSocket соединений
│   └── resources/
│       ├── static/         # Frontend (HTML, CSS, JS, изображения)
│       └── application.properties # Конфигурация приложения
```

## Запуск проекта локально

### Предварительные требования

- **JDK 17** или выше
- **Maven 3.8+** 

### Шаги для запуска

1. **Клонируйте репозиторий:**

   ```
   git clone [https://github.com/Matvey-Shatskiy/Online_chat_java.git]
   cd ИМЯ_РЕПОЗИТОРИЯ
   ```

2. **Настройте переменные окружения (опционально):** Приложение использует значения по умолчанию для SQLite (`users.db`) и JWT. При необходимости вы можете переопределить их в `src/main/resources/application.properties` или через переменные окружения:

   ```
   JWT_SECRET=your_super_secret_key_here_must_be_at_least_32_bytes
   JWT_EXPIRATION=86400000
   ```

3. **Соберите и запустите проект:**

   ```
   # Для Linux / macOS
   ./mvn spring-boot:run
   
   # Для Windows
   mvn.cmd clean spring-boot:run
   ```

4. **Откройте приложение в браузере:** Перейдите по адресу: http://localhost:8080
