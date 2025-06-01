const db = require('../config/db'); 
const obtenerEventos = async (req, res) => {
  try {
    const [result] = await db.promise().query('SELECT * FROM eventos');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

const obtenerEventoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query('SELECT * FROM eventos WHERE id = ?', [id]);
    if (result.length === 0) {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.json(result[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
};

const crearEvento = async (req, res) => {
  const { nombre, fecha, fechaFin, lugar, precio, tickets, creadorId } = req.body;
  const imagen = req.file ? req.file.filename : null; 
  console.log('Datos recibidos para crear el evento:', { nombre, fecha, lugar, precio, tickets, creadorId });
  console.log('Imagen recibida:', imagen); 

  if (!nombre || !fecha || !fechaFin || !lugar || !precio || !tickets || !creadorId) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  console.log('Validación pasada, datos correctos.');

  try {
    const [result] = await db.promise().query(
      `INSERT INTO eventos (nombre, fecha, fechaFin, lugar, precio, tickets, imagen, creadorId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [nombre, fecha, fechaFin, lugar, precio, tickets, imagen, creadorId]
    );

    console.log('Evento creado exitosamente con ID:', result.insertId);
    res.status(201).json({ message: 'Evento creado exitosamente', id: result.insertId, imagen });
  } catch (err) {
    console.error('Error al crear el evento:', err); 
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};

const actualizarEvento = async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, fechaFin, lugar, precio, tickets } = req.body;

  if (!nombre || !fecha || !fechaFin || !lugar || !precio || !tickets) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE eventos
       SET nombre = ?, fecha = ?, fechaFin = ?, lugar = ?, precio = ?, tickets = ?
       WHERE id = ?`, 
      [nombre, fecha, fechaFin, lugar, precio, tickets, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.json({ message: 'Evento actualizado exitosamente' });
    }
  } catch (err) {
    console.error('Error al actualizar el evento:', err); 
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
};

const eliminarEvento = async (req, res) => {
  const { id } = req.params;
  const db = require('../config/db');
  try {
    // Elimina primero los tickets asociados a este evento
    await db.promise().query('DELETE FROM tickets WHERE eventoId = ?', [id]);
    // Ahora elimina el evento
    const [result] = await db.promise().query('DELETE FROM eventos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.json({ message: 'Evento eliminado exitosamente' });
    }
  } catch (err) {
    console.error('Error al eliminar el evento:', err); 
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
};

module.exports = {
  obtenerEventos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
};
