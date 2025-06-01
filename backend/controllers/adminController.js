const db = require('../config/db');

// Panel de ventas: resumen de ventas por evento
const ventasPorEvento = async (req, res) => {
  console.log('Acceso a ventasPorEvento por usuario:', req.user);
  try {
    const [result] = await db.promise().query(`
      SELECT e.id, e.nombre, e.fecha, e.lugar, e.precio, e.creadorId,
        COUNT(t.id) AS ticketsVendidos,
        SUM(e.precio) * COUNT(t.id) AS totalRecaudado
      FROM eventos e
      LEFT JOIN tickets t ON e.id = t.eventoId
      GROUP BY e.id
      ORDER BY e.fecha DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Error al obtener ventas por evento:', err);
    res.status(500).json({ error: 'Error al obtener ventas por evento' });
  }
};

// Listar todos los usuarios y empresas
const listarUsuarios = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      `SELECT id, nombre, primerApellido, segundoApellido, email, userType FROM usuarios`
    );
    res.json(result);
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// Actualizar usuario/empresa
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, primerApellido, segundoApellido, email, userType } = req.body;
  try {
    await db.promise().query(
      `UPDATE usuarios SET nombre=?, primerApellido=?, segundoApellido=?, email=?, userType=? WHERE id=?`,
      [nombre, primerApellido, segundoApellido, email, userType, id]
    );
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario/empresa
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM usuarios WHERE id=?', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = {
  ventasPorEvento,
  listarUsuarios,
  actualizarUsuario,
  eliminarUsuario,
};
