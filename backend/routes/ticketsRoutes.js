const express = require('express');
const { comprarTicket, validarTicket, obtenerTicketsUsuario } = require('../controllers/ticketsController');

const router = express.Router();

router.post('/comprar', comprarTicket); 
router.post('/validar', validarTicket);
router.get('/usuario/:usuarioId', obtenerTicketsUsuario);

module.exports = router;