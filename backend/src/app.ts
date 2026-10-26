import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { producerRoutes, productRoutes } from './modules/products/products.routes.js';
import { pickupPointRoutes } from './modules/pickup-points/pickup-points.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { batchRoutes } from './modules/batches/batches.routes.js';
import { reviewRoutes } from './modules/reviews/reviews.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { maintenanceMiddleware } from './modules/maintenance.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

export const app = express();

// Na hospedagem a API fica atrás de um proxy; necessário para o limite por IP.
if (env.isProduction) app.set('trust proxy', 1);

// A página do Swagger usa scripts próprios: fica fora da política de segurança padrão.
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'PrintHub API' }));
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use(helmet());
// Em desenvolvimento, qualquer porta do localhost (ng serve pode subir em outra porta).
const localhost = /^http:\/\/localhost:\d+$/;
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = !origin || env.corsOrigins.includes(origin) || (!env.isProduction && localhost.test(origin));
      callback(null, allowed);
    },
  }),
);
app.use(express.json({ limit: '100kb' }));

// Protege login e cadastro contra tentativas em massa.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Em desenvolvimento o limite é folgado para não atrapalhar os testes manuais.
  limit: env.isProduction ? 30 : 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    res.status(429).json({
      erro: { codigo: 'MUITAS_TENTATIVAS', mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
    });
  },
});

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Antes de mostrar pedidos e lotes, aplica os prazos de 48 h e de 7 dias.
api.use(['/orders', '/producer', '/attendant', '/batches', '/pickup-points', '/dashboard'], maintenanceMiddleware);

api.use(['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'], authLimiter);
api.use('/auth', authRoutes);
api.use('/products', productRoutes);
api.use('/producers', producerRoutes);
api.use('/pickup-points', pickupPointRoutes);
api.use('/batches', batchRoutes);
api.use(orderRoutes);
api.use(reviewRoutes);
api.use(adminRoutes);

app.use('/api', api);
app.use(notFoundHandler);
app.use(errorHandler);
