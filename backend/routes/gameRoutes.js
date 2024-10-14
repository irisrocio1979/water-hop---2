// backend/routes/gameRoutes.js
const express = require('express');
const router = express.Router();

// Ejemplo de ruta para obtener la puntuación
router.get('/score', (req, res) => {
    // Aquí puedes manejar la lógica para devolver la puntuación
    res.json({ score: 100 });
});

// Agrega más rutas según sea necesario
module.exports = router;
