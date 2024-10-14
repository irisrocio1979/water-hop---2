// backend/server.js
const express = require('express');
const app = express();
const gameRoutes = require('./routes/gameRoutes');

const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static('../frontend')); // Servir archivos estáticos del frontend

// Rutas
app.use('/api/game', gameRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
