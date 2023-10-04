/* eslint-disable no-await-in-loop */

import path from 'node:path';

import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
// import jwt from '@fastify/jwt';
import serveStatic from '@fastify/static';
import ajvKeywords from 'ajv-keywords';
import { APIError } from 'maru/errors.js'; // eslint-disable-line import/no-unresolved

import wsRestApi from './lib/socket.io/restApi.js';
import APIErrorSchema from './lib/schemas/APIError.js';
import ObjectIdSchema from './lib/schemas/ObjectId.js';
import HttpStatus from './lib/HttpStatus.js';

export default class WebServer {
  name = 'server';

  app;

  config;

  server;

  constructor(app) {
    this.app = app;
  }

  async start() {
    this.config = this.app.config;

    if (!this.config.host) {
      this.config.host = 'localhost';
    }
    if (!this.config.port) {
      this.config.port = 3000;
      this.app.logger.warn('Не задан порт для веб-сервера. По умолчанию выставлен порт 3000');
    }
    if (!this.config.baseUrl) {
      this.config.baseUrl = `http://${this.config.host}:${this.config.port}`;
    }

    this.server = fastify({
      logger: {
        level: this.app.config.logs.level,
        base: undefined,
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        formatters: {
          level: (label) => ({ level: label })
        }
      },
      disableRequestLogging: true,
      forceCloseConnections: true,
      ajv: {
        plugins: [
          [ajvKeywords, ['transform']]
        ]
      }
    });
    this.app.server = this.server;

    this.server.setErrorHandler((error, request, reply) => {
      if (error instanceof APIError) {
        return reply
          .status(error.status)
          .send({
            code: error.code,
            message: error.message
          });
      }

      const status = error.statusCode ?? reply.statusCode ?? 500;

      return reply
        .status(status)
        .send({
          code: error.validation ? 'VALIDATION_FAILED' : (HttpStatus[status] ?? 'UNKNOWN_ERROR'),
          message: error.message
        });
    });

    this.server.setNotFoundHandler((request, reply) => {
      reply.status(404).send({ code: HttpStatus[404] });
    });

    await this.server.register(cors, { origin: true });

    await this.server.register(serveStatic, { root: path.join(this.app.path, '..', 'public') });

    await this.server.register(swagger, {
      openapi: {
        info: {
          title: this.app.name,
          description: this.app.info.description,
          version: this.app.info.version,
        },
        servers: [{
          url: this.config.baseUrl,
        }],
        components: {
          securitySchemes: {
            jwt: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            }
          }
        }
      },
      hideUntagged: true,
      exposeRoute: true,
      refResolver: {
        buildLocalReference: (json, baseUri, fragment, i) => json.$id || `def-${i}`,
      },
    });
    await this.server.register(swaggerUI, { routePrefix: '/docs' });

    // TODO: Непонятно как это совместить с socket.io
    // if (this.config.auth) {
    //   await this.server.register(jwt, { secret: this.config.auth.secret });
    // }

    await this.server.register(wsRestApi(this.app));

    this.server.addSchema(APIErrorSchema);
    this.server.addSchema(ObjectIdSchema);

    this.server.get('/', {
      schema: {
        summary: 'Кратко о приложении',
        tags: ['Общее'],
      },
    }, () => ({
      name: this.app.info.name,
      version: this.app.info.version,
      description: this.app.info.description,
    }));

    // Бизнес-логика
    for (const files of Object.values(this.app.modules)) {
      if (files.router) {
        const router = (await import(files.router)).default;
        const wrapper = async (server, opts, done) => {
          if (files.schemas) {
            const schemas = await Promise.all(
              Object.values(files.schemas).map(async (url) => (await import(url)).default)
            );
            schemas.forEach((schema) => server.addSchema(schema));
          }
          router(this.app, server);
          done();
        };
        await this.server.register(wrapper);
      }
    }

    await this.server.ready();
    this.server.swagger();

    await this.server.listen({
      port: this.config.port,
      host: this.config.host,
    });
    this.app.logger.always(`Веб-сервер запущен на ${this.config.host}:${this.config.port}`);
  }

  async stop() {
    // Закрываем вручную все соединения, иначе server.close намертво зависает
    this.server.io.disconnectSockets(true);
    await this.server.close();
    this.server.io.close();
  }
}
