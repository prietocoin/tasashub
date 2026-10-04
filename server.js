import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import tasasRoutes from './src/modules/tasas/routes/tasas.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'TasasHub Engine ⚡', timestamp: new Date() });
});

// Enrutador principal de TasasHub
app.use('/api/v1/tasas', tasasRoutes);

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[TasasHub ⚡] Servidor ejecutándose en el puerto ${env.PORT}`);
});
