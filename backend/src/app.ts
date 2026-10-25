import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { producerRoutes, productRoutes } from './modules/products/products.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '100kb' }));

const api = express.Router();
api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRoutes);
api.use('/products', productRoutes);
api.use('/producers', producerRoutes);

app.use('/api', api);
app.use(notFoundHandler);
app.use(errorHandler);
