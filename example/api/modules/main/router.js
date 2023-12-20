import { Forbidden } from '../../../../lib/errors.js'; // eslint-disable-line import/no-unresolved
import onlyUsers from '../../../../lib/policies/onlyUsers.js';

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

  server.get('/privateSection', {
    schema: {
      response: {
        200: { type: 'string' }
      }
    },
    preHandler: onlyUsers
  }, async () => 'Some private data');
};
