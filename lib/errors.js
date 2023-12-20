/* eslint-disable max-classes-per-file */
import APIError from 'maru/APIError.js';

class WebError extends APIError {
  status = 500;
}

// Для бизнес-логики
export class BadRequest extends WebError {
  status = 400;

  constructor(code = 'BAD_REQUEST', details = undefined) {
    super(code, details);
  }
}

export class Unauthorized extends WebError {
  status = 401;

  constructor() {
    super('UNAUTHORIZED');
  }
}

export class Forbidden extends WebError {
  status = 403;

  constructor() {
    super('UNAUTHORIZED');
  }
}

export class TooManyRequests extends WebError {
  status = 429;

  constructor(retryAfter) {
    super('TOO_MANY_REQUESTS', { retryAfter });
  }
}
