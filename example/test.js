import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import maru from 'maru';
import server from '../index.js';

describe('Запуск', () => {
  let app;

  after(() => app?.stop())

  it('Подключение компонента', async () => {
    app = maru(import.meta.url, [server]);
    await app.start();
    assert.ok(app.server);
    await app.stop();
    app = null;
  });
});

describe('REST API', () => {
  let app = maru(import.meta.url, [server]);

  before(() => app.start());

  after(() => app.stop());

  it('Запрос по HTTP', async () => {
    const url = `${app.config.baseUrl}/book/1`;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const book = await response.json();
    assert.equal(book.id, 1);
    assert.ok(book.title);
    assert.ok(book.author);
  });

  it('Иные HTTP-статусы', async () => {
    const url = `${app.config.baseUrl}/privateSection`;
    const response = await fetch(url);
    assert.equal(response.status, 401);
    const error = await response.json();
    assert.ok(error.code);
  });
});