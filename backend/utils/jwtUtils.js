const jwt = require('jsonwebtoken');
require('dotenv').config();

const generarToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { generarToken };