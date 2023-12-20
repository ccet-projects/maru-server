import { Forbidden } from '../../../../lib/errors.js'; // eslint-disable-line import/no-unresolved

export default (app, server) => {
  server.get('/book/:id', {
    schema: {
      params: {
        id: { type: 'integer' }
      },
      response: {
        200: { $ref: 'Book#' }
      }
    }
  }, async () => ({ id: 1, title: 'Pride and prejudice', author: 'Jane Austen' }));

  server.get('/secretSection', {
    schema: {
      response: {
        403: { $ref: 'APIError#' }
      }
    }
  }, async () => {
    throw new Forbidden();
  });
};
