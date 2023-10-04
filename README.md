# maru-server

Компонент, отвечающий за веб-сервер и всё с ним связанное в приложении.

## Как добавить

Установка

```sh
npm install --save github:ccet-projects/maru-server
```

Точка входа в приложение

```js
import maru from 'maru';
import server from '@maru/server';

const app = maru(import.meta.url, [server]);
app.start();
```

Используемые ключи конфига

| Название | Значение по умолчанию | Описание |
| --- | --- | --- |
| host | 'localhost' | Хост для прослушивания |
| port | 3000 | Порт для прослушивания |
| baseUrl | `http://{host}:{port}` | Внешний доступ к серверу |

## Как использовать

### Роуты

Роуты автоматически загружаются по шаблону пути `api/modules/*/router.js`.

Шаблон файла

```js
export default (app, server) => {
};
```

Пример файла

```js
export default (app, server) => {
  server.get('/book/:id', {
    schema: {
      summary: 'Информация о книге',
      tags: ['Товары'],
      params: { id: { type: 'integer' } },
      response: { 200: { $ref: 'Book#' } },
    },
  }, async (req) => {
    // web sockets only
    req.joinRoom(`book/${req.params.id}/chat`); // Обратное действие - req.leaveRoom(<room_name>);

    return {
      id: req.params.id,
      name: 'Гарри Поттер и Орден Ленина'
    };
  });

  Book.on('comment:added', (comment) => {
    // web sockets only
    server.emitToRoom(
      `book/${comment.book}/chat`, // room
      'comment:added', // event
      comment, // body
      { $ref: 'Comment#' } // schema
    );
  });
};
```

### Статичный HTML

Все файлы, расположенные по шаблону пути `public/*`, будут доступны по HTTP как `/*` (как будто лежат в корне).

### Swagger

Страница документация в формате swagger генерируется по адресу `/docs`.
