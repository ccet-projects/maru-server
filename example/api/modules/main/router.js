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
  }, async () => {
    return {
      id: 1,
      title: 'Pride and prejudice',
      author: 'Jane Austen'
    };
  });
};
