// src/app.js
const express = require('express');
const app = express();
const carRoutes = require('./routes/carRoutes');
require('dotenv').config();

// Middleware para parsear JSON
app.use(express.json());

// Utilizar as rotas definidas
app.use('/', carRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
