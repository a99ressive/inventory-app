# Inventory App — аудит по ТЗ и пошаговый план доработки

Ниже — практический план: **что делать, где делать, в каком порядке**. Он составлен по текущему коду репозитория и ТЗ.

## 1) Что уже реализовано (база)

- Стек соответствует .NET-ветке: ASP.NET Core + React + ORM (EF Core + PostgreSQL + Identity).
- Есть JWT-аутентификация, роли `User/Admin`, блокировка пользователя.
- Есть страницы: Home, Login/Register, My Inventories, Inventory Detail, Profile, Admin.
- Есть таблицы для инвентарей и items.
- Есть full-text search в шапке и API для поиска.
- Есть зачатки Custom ID (модели + сервис генерации/валидации).
- Есть optimistic locking на уровне `RowVersion` для `Inventory` и `Item` (частично применено в сервисах).

## 2) Критичные пробелы относительно ТЗ

### 2.1 Вкладки инвентаря пока заглушки
**Где:** `client/src/pages/InventoryDetail.tsx`.

Сейчас табы Discussion / General settings / Custom ID / Fields / Statistics — это `Alert` с текстом “next step”.

**Что сделать:**
1. Вынести каждый таб в отдельный компонент:
   - `InventoryItemsTab.tsx`
   - `InventoryDiscussionTab.tsx`
   - `InventoryGeneralTab.tsx`
   - `InventoryCustomIdTab.tsx`
   - `InventoryFieldsTab.tsx`
   - `InventoryStatisticsTab.tsx`
2. Для ролей “owner/admin/write/read-only” централизовать матрицу прав и прятать/блокировать edit-действия.

---

### 2.2 Auto-save инвентаря (7–10 сек) + конфликт версий
**Где:**
- Backend: `InventoryService.UpdateWithVersionAsync`, `InventoryController`.
- Frontend: новый `InventoryGeneralTab.tsx`.

**Что сделать:**
1. UI держит `dirty`-флаг и таймер `setInterval(8000)`.
2. На save отправлять `RowVersion` (base64) в `UpdateInventoryDto`.
3. При `409/DbUpdateConcurrencyException` показать diff-сообщение: “данные изменены другим пользователем, обновите страницу”.
4. После успешного save обновлять локальный `RowVersion` из ответа API.

---

### 2.3 Discussion с обновлением 2–5 сек
**Где:**
- Backend: `Comment` модель уже есть, нужен controller/service.
- Frontend: `InventoryDiscussionTab.tsx`.

**Что сделать:**
1. API:
   - `GET /api/inventory/{id}/comments?after=...`
   - `POST /api/inventory/{id}/comments`
2. Реалтайм-подход на старте: polling раз в 3 секунды.
3. Markdown rendering через готовый компонент (`react-markdown`).
4. Имя автора в посте — ссылка на `/profile/:userId`.

---

### 2.4 Custom ID builder (главная killer-feature)
**Где:**
- Backend: `Models/CustomId/*`, `CustomIdService`, `CustomIdValidationService`.
- Frontend: новый `InventoryCustomIdTab.tsx`.

**Что сделать:**
1. Визуальный конструктор (drag-and-drop) элементов ID.
2. Элементы: fixed text, random20, random32, random6, random9, guid, datetime, sequence.
3. Preview “в реальном времени” через API `POST /preview`.
4. При редактировании item валидировать customId по текущему формату.
5. Конфликты уникальности обрабатывать корректным UX: предложить вручную исправить `customId`.

---

### 2.5 Custom fields editor (вторая killer-feature)
**Где:**
- Backend: `UpdateFieldsDto`, `InventoryService.ValidateFieldLimits`.
- Frontend: новый `InventoryFieldsTab.tsx`, `ItemFormModal.tsx`.

**Что сделать:**
1. UI редактор полей с drag-and-drop reorder.
2. Жестко ограничить типы: до 3 каждого типа (string/text/number/link/boolean).
3. Для поля: title, description, showInTable.
4. Item-form рендерить fixed fields + custom fields.
5. В таблице items динамически показывать только поля `showInTable=true`.

---

### 2.6 Access settings: autocomplete по имени и email + сортировка
**Где:**
- Frontend: `AccessSettingsTab.tsx`.
- Backend: `UsersController.Search`, `InventoryService.GetAccessListAsync`.

**Что сделать:**
1. Autocomplete c debounce 250–300ms.
2. Поиск и по `name`, и по `email`.
3. Переключаемая сортировка списка доступа (name/email).
4. Не показывать текущего владельца в списке на удаление.

---

### 2.7 Item page + likes
**Где:**
- Backend: `Like` модель есть, но нужен endpoints.
- Frontend: новая страница `ItemDetail.tsx`.

**Что сделать:**
1. `POST /api/items/{id}/likes` и `DELETE /api/items/{id}/likes`.
2. Ограничение “один пользователь — один лайк” через уникальный индекс.
3. На item page показать like count + toggle like.

---

### 2.8 Локализация (2 языка) и тема (light/dark)
**Где:**
- Frontend: `App.tsx`, `NavBar.tsx`.

**Что сделать:**
1. Подключить i18n библиотеку (`react-i18next`).
2. Добавить переключатель языка (EN + RU/PL/ES).
3. Добавить Theme toggle через MUI ThemeProvider.
4. Сохранять язык/тему в localStorage + профиль пользователя (опционально на сервере).

---

### 2.9 Social login (Google/Facebook) end-to-end
**Где:**
- Backend уже имеет `AddGoogle/AddFacebook`.
- Нужны controller endpoints + frontend flow.

**Что сделать:**
1. OAuth callback endpoint, выдача вашего JWT после внешнего логина.
2. Кнопки “Continue with Google/Facebook” на Login/Register.
3. Обработать state/redirect ошибки.

---

### 2.10 Избежать N+1 и запросов в циклах
**Что уже исправлено сейчас:**
- В `AdminController.GetUsers` убран запрос ролей в цикле; роли админа читаются одним запросом.

**Что проверить дополнительно:**
- По всем контроллерам: нет ли `foreach` + запрос внутри.
- Для сложных списков переходить на проекции и пакетные запросы.

## 3) Что исправлено в этом коммите

1. Убрана N+1 проблема в админ-списке пользователей:
   - раньше: для каждого пользователя отдельный `_userManager.GetRolesAsync(u)`;
   - теперь: единый join по `UserRoles/Roles` и определение admin-флага набором ID.

Это прямо соответствует запрету из ТЗ “Don’t execute database queries inside loops”.

## 4) Точный порядок внедрения (спринты)

### Sprint 1 (must-have foundation, 2–3 дня)
1. Завершить Inventory tabs (без заглушек).
2. Auto-save + optimistic lock для General settings.
3. Discussion polling 3s + markdown.
4. Довести AccessSettings autocomplete/sort.

### Sprint 2 (killer features, 3–5 дней)
1. Custom ID builder + preview + DnD.
2. Custom fields editor + DnD + showInTable.
3. Item form/table под динамические поля.

### Sprint 3 (platform & polish, 2–3 дня)
1. Likes + item page.
2. i18n + dark/light theme.
3. OAuth Google/Facebook E2E.
4. Нагрузочный прогон поиска/таблиц + UX полировка под мобильные.

## 5) Definition of Done (чеклист перед защитой)

- [ ] На главной: latest table, top-5 table, tag cloud.
- [ ] В шапке глобальный поиск доступен на всех страницах.
- [ ] Неавторизованный пользователь: read-only + поиск.
- [ ] Автор/админ редактируют инвентарь; write-user редактирует items.
- [ ] Access list: add/remove + autocomplete (name/email) + sortable.
- [ ] Inventory autosave каждые 7–10 сек + обработка конфликтов версий.
- [ ] Items и inventories отображаются таблицами по умолчанию.
- [ ] Нет кнопок edit/delete в каждой строке таблицы (массовые/контекстные действия).
- [ ] Custom ID format builder + preview + DB unique(inventory_id, custom_id).
- [ ] Custom fields limits соблюдены, reorder работает.
- [ ] Discussion обновляется для всех в пределах 2–5 сек.
- [ ] Admin page: block/unblock/delete/grant/revoke admin; self-demote работает.
- [ ] 2 языка UI + 2 темы UI.
- [ ] Соц.логин минимум через 2 провайдера.

## 6) Риски и как закрыть

1. **Concurrency UX сложный для пользователей**
   - Решение: явное сообщение “данные обновлены другим пользователем”, кнопка refresh/merge.
2. **Custom ID collisions**
   - Решение: DB unique index + дружелюбная ошибка + ручное редактирование customId.
3. **Производительность поиска/таблиц**
   - Решение: индексы + пагинация + проекции, без `SELECT *` и без N+1.
4. **Сроки**
   - Решение: жёсткий scope на core requirements, optional только после полного core.
