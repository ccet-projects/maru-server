import { Server } from 'socket.io';
import fastifyPlugin from 'fastify-plugin';

import parser from './parser.js';

export default (app) => fastifyPlugin((fastify, opts, done) => {
  const logger = app.logger.child({ scope: 'websocket' });

  const io = new Server(fastify.server, {
    transports: ['websocket'],
    parser,
  });

  fastify.decorate('io', io);

  fastify.decorateRequest('joinRoom', function joinRoom(roomId) {
    fastify.io.sockets.sockets.get(this.headers.wsid)?.join(roomId);
  });
  fastify.decorateRequest('leaveRoom', function leaveRoom(roomId) {
    fastify.io.sockets.sockets.get(this.headers.wsid)?.leave(roomId);
  });

  const serializerBySchema = new Map();

  fastify.decorate('emitToRoom', function emitToRoom(roomId, event, data, schema = null) {
    let serializer = JSON.stringify;
    if (schema && this.serializerCompiler) {
      serializer = serializerBySchema.get(schema);
      if (!serializer) {
        serializer = this.serializerCompiler({ schema });
        serializerBySchema.set(schema, serializer);
      }
    }

    this.io.to(roomId).emit(event, serializer(data));
  });

  fastify.io.on('connect', (socket) => {
    socket.on('request', async (message, reply) => {
      const {
        method,
        url,
        query,
        body: payload,
      } = message;
      try {
        // Имитация HTTP-запроса
        const { statusCode, body } = await fastify.inject({
          method,
          url,
          query,
          payload,
          headers: { wsid: socket.id },
        });
        reply({ status: statusCode, body });
      } catch (e) {
        logger.error('Кривое сообщение от веб-сокета');
      }
    });
  });

  done();
});
