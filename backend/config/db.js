const mysql = require('mysql2');
require('dotenv').config(); 

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
  connection.release();

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      primerApellido VARCHAR(255),
      segundoApellido VARCHAR(255),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      userType ENUM('usuario', 'empresa', 'superadmin') NOT NULL DEFAULT 'usuario'
    )
  `;
  pool.query(createUsersTable, (err) => {
    if (err) {
      console.error('Error al verificar la tabla de usuarios:', err);
      return;
    }
    console.log('Tabla de usuarios verificada');
    // Crear superadmin si no existe
    const superadminEmail = 'superdani@gmail.com';
    const superadminPassword = '$2b$10$G3Qg.OSnypOc0j8FY/R8IeH4edFYWvHcT1rehs8YNtSjmE/bYiKwu'; // Hash real de '1234'
    pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [superadminEmail],
      (err, results) => {
        if (err) {
          console.error('Error al buscar superadmin:', err);
          return;
        }
        if (results.length === 0) {
          pool.query(
            'INSERT INTO usuarios (nombre, primerApellido, segundoApellido, email, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
            ['superdani', '', '', superadminEmail, superadminPassword, 'superadmin'],
            (err) => {
              if (err) {
                console.error('Error al crear superadmin:', err);
              } else {
                console.log('Superadmin creado por defecto');
              }
            }
          );
        }
      }
    );
  });

  const createEventosTable = `
    CREATE TABLE IF NOT EXISTS eventos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      fecha DATETIME NOT NULL,
      lugar VARCHAR(255) NOT NULL,
      precio DECIMAL(10, 2) NOT NULL,
      tickets INT NOT NULL,
      imagen VARCHAR(255) NOT NULL,
      creadorId INT NOT NULL,
      FOREIGN KEY (creadorId) REFERENCES usuarios(id)
    )
  `;
  pool.query(createEventosTable, (err) => {
    if (err) {
      console.error('Error al verificar la tabla de eventos:', err);
      return;
    }
    console.log('Tabla de eventos verificada.');
  });

  const addCreadorIdColumn = `
    ALTER TABLE eventos
    ADD COLUMN creadorId INT NOT NULL,
    ADD FOREIGN KEY (creadorId) REFERENCES usuarios(id)
  `;
  pool.query(addCreadorIdColumn, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEY') {
      console.error('Error al agregar la columna creadorId:', err);
      return;
    }
    console.log('Columna creadorId verificada o agregada.');
  });

  const addTicketsColumn = `
    ALTER TABLE eventos
    ADD COLUMN tickets INT NOT NULL DEFAULT 0
  `;
  pool.query(addTicketsColumn, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') { 
      console.error('Error al agregar la columna tickets:', err);
      return;
    }
    console.log('Columna tickets verificada o agregada.');
  });

  const createTicketsTable = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      eventoId INT NOT NULL,
      usuarioId INT NOT NULL,
      codigoQR TEXT,
      usado BOOLEAN DEFAULT false,
      fechaCompra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventoId) REFERENCES eventos(id),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `;
  pool.query(createTicketsTable, (err) => {
    if (err) {
      console.error('Error al verificar la tabla de tickets:', err);
      return;
    }
    console.log('Tabla de tickets verificada');
  });
});

module.exports = pool;