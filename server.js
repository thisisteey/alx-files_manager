import express from 'express';
import startServer from './libs/boot';
import configRoutes from './routes';
import configMiddlewares from './libs/middlewares';

const app = express();

configMiddlewares(app);
configRoutes(app);
startServer(app);

export default app;
