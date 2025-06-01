const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Token recibido en el middleware:', authHeader); 

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado o malformado' });
  }

  const token = authHeader.split(' ')[1]; 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, userType: decoded.userType }; 
    console.log('Token decodificado:', decoded); 
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err); 
    res.status(401).json({ error: 'Token inválido' });
  }
};

const verificarRolEmpresa = (req, res, next) => {
  if (req.user.userType !== 'empresa' && req.user.userType !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

const verificarRolSuperadmin = (req, res, next) => {
  if (req.user.userType !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso solo para superadmin' });
  }
  next();
};

module.exports = { verificarToken, verificarRolEmpresa, verificarRolSuperadmin };