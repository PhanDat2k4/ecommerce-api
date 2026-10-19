require('dotenv').config();
const express = require('express');
const prisma = require('./config/prisma');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('Thiếu JWT_SECRET trong file .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check: 200 khi query được PostgreSQL, 503 khi không
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      message: 'E-commerce API is running',
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`ecommerce-api listening on port ${PORT}`));
