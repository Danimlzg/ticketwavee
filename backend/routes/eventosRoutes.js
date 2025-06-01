const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  obtenerEventos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento
} = require('../controllers/eventosCOntroller'); 
const { verificarToken, verificarRolEmpresa, verificarRolSuperadmin } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Crear evento: empresa o superadmin
router.post('/', verificarToken, verificarRolEmpresa, upload.single('imagen'), async (req, res) => {
  try {
    console.log('Datos recibidos en la ruta:', req.body); 
    const { nombre, fecha, lugar, precio, tickets, creadorId } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Datos recibidos en la ruta:', { nombre, fecha, lugar, precio, tickets }); 

    if (!nombre || !fecha || !lugar || !precio || !tickets || !creadorId) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    req.body.imagen = imagePath;
    await crearEvento(req, res);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar evento: empresa o superadmin
router.put('/:id', verificarToken, verificarRolEmpresa, actualizarEvento);

// Eliminar evento: 
// - superadmin puede eliminar cualquiera
// - empresa solo puede eliminar los suyos
router.delete('/:id', verificarToken, async (req, res) => {
  const userType = req.user.userType;
  const userId = req.user.id;
  const eventoId = req.params.id;

  console.log('Intentando eliminar evento:', { eventoId, userType, userId });

  if (userType === 'superadmin') {
    console.log('Superadmin intentando eliminar evento');
    return eliminarEvento(req, res);
  }

  if (userType === 'empresa') {
    // Solo puede eliminar eventos que ha creado
    const db = require('../config/db');
    try {
      const [eventos] = await db.promise().query('SELECT creadorId FROM eventos WHERE id = ?', [eventoId]);
      console.log('Resultado de búsqueda de evento para empresa:', eventos);
      if (eventos.length === 0) {
        console.log('Evento no encontrado');
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (String(eventos[0].creadorId) !== String(userId)) {
        console.log('Intento de eliminar evento ajeno:', { creadorId: eventos[0].creadorId, userId });
        return res.status(403).json({ error: 'No puedes eliminar eventos de otros usuarios' });
      }
      console.log('Empresa autorizada para eliminar evento');
      return eliminarEvento(req, res);
    } catch (err) {
      console.error('Error al comprobar permisos para eliminar el evento:', err);
      return res.status(500).json({ error: 'Error al comprobar permisos para eliminar el evento' });
    }
  }

  console.log('Tipo de usuario sin permisos para eliminar eventos:', userType);
  // Otros tipos de usuario no pueden eliminar eventos
  return res.status(403).json({ error: 'Acceso denegado' });
});

router.get('/', obtenerEventos);

router.get('/:id', obtenerEventoPorId);

module.exports = router;
