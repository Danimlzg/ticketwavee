require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const ticketsRoutes = require('./routes/ticketsRoutes');
const eventosRoutes = require('./routes/eventosRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const db = require('./config/db'); 
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
  res.send('API endpoint');
});

app.get('/', (req, res) => {
  res.send('Servidor corriendo');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});