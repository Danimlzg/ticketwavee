const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); 
require('dotenv').config();

const generarToken = (userId, userType) => {
  return jwt.sign({ id: userId, userType }, process.env.JWT_SECRET, {
    expiresIn: '1h', 
  });
};

const registrar = async (req, res) => {
  const { nombre, primerApellido, segundoApellido, email, password, userType } = req.body; // Añadir apellidos

  try {
    const [user] = await db.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (user.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (userType === 'usuario') {
      await db.promise().query(
        'INSERT INTO usuarios (nombre, primerApellido, segundoApellido, email, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, primerApellido, segundoApellido, email, hashedPassword, userType]
      );
    } else {
      await db.promise().query(
        'INSERT INTO usuarios (nombre, email, password, userType) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, userType]
      );
    }

    res.json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('Error al registrar el usuario:', err); 
    res.status(500).json({ error: 'Error al registrar el usuario', details: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Intentando login con:', { email, password });

    const [user] = await db.promise().query('SELECT id, email, password, userType FROM usuarios WHERE email = ?', [email]);
    console.log('Resultado de búsqueda en la base de datos:', user);

    if (user.length === 0) {
      console.log('No se encontró el usuario con ese email');
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    console.log('Comparación de contraseña:', { input: password, hash: user[0].password, validPassword });

    if (!validPassword) {
      console.log('Contraseña incorrecta');
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken(user[0].id, user[0].userType);
    console.log('Login exitoso para usuario:', { id: user[0].id, userType: user[0].userType });
    res.json({ 
      message: 'Inicio de sesión exitoso', 
      token, 
      userType: user[0].userType, 
      userId: user[0].id 
    });
  } catch (err) {
    console.error('Error al iniciar sesión:', err); 
    res.status(500).json({ error: 'Error al iniciar sesión', details: err.message });
  }
};

module.exports = { login, registrar };