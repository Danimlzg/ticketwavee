const express = require('express');
const { ventasPorEvento, listarUsuarios, actualizarUsuario, eliminarUsuario } = require('../controllers/adminController');
const { verificarToken, verificarRolSuperadmin, verificarRolEmpresa } = require('../middleware/authMiddleware');

const router = express.Router();

// Permitir acceso a panel de ventas a empresa y superadmin
router.get('/ventas', verificarToken, (req, res, next) => {
  if (req.user.userType === 'empresa' || req.user.userType === 'superadmin') {
    return ventasPorEvento(req, res);
  }
  return res.status(403).json({ error: 'Acceso solo para empresa o superadmin' });
});

// Solo superadmin puede gestionar usuarios
router.get('/usuarios', verificarToken, verificarRolSuperadmin, listarUsuarios);
router.put('/usuarios/:id', verificarToken, verificarRolSuperadmin, actualizarUsuario);
router.delete('/usuarios/:id', verificarToken, verificarRolSuperadmin, eliminarUsuario);

module.exports = router;
