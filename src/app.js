import './bootstrap';

import express from 'express';
import path from 'path';
import Youch from 'youch';
import helmet from 'helmet';
import redis from 'redis';
import RateLimit from 'express-rate-limit';
import RateLimitRedis from 'rate-limit-redis';
import cors from 'cors';

import * as Sentry from '@sentry/node';
import 'express-async-errors';

import routes from './routes';
import sentryConfig from './config/sentry';

import './database';
import swaggerDoc from '../src/config/swaggerDoc';

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);
    swaggerDoc(this.server);

    this.routes();
    this.middlewares();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(helmet());
    this.server.use(function(req, res, next) {
      res.header(
        'Access-Control-Allow-Origin',
        'https://vigorous-elion-c24ee3.netlify.com'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
      next();
    });
    // this.server.use(
    //   cors({
    //     origin: 'https://vigorous-elion-c24ee3.netlify.com', // caminho do front end que poderão acessar o servidor.
    //   })
    // );
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );

    /* if (process.env.NODE_ENV !== 'development') {
      this.server.use(
        new RateLimit({
          store: new RateLimitRedis({
            client: redis.createClient({
              host: process.env.REDIS_HOST,
              port: process.env.REDIS_PORT,
            }),
          }),
          windowMs: 1000 * 60 * 15,
          max: 10, // 100
        })
      );
    } */
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json(errors);
      }
    });
  }
}

export default new App().server;
