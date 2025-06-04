const qrcode = require('qrcode');
const db = require('../config/db');
const { enviarCorreoConQR } = require('../utils/email');

const generarCodigoQR = async (ticketId, eventoId, usuarioId) => {
  const data = JSON.stringify({ id: ticketId, eventoId, usuarioId, timestamp: Date.now() });
  console.log('Datos para generar el código QR:', data);
  return data;
};

const comprarTicket = async (req, res) => {
  const { eventoId, cantidad, usuarioId } = req.body;

  console.log('Datos recibidos en el controlador comprarTicket:', { eventoId, cantidad, usuarioId });
  try {
    if (!usuarioId || usuarioId === 'undefined') {
      console.error('Error: usuarioId no proporcionado o inválido');
      return res.status(400).json({ error: 'Usuario no autenticado. Por favor, inicia sesión.' });
    }

    const [evento] = await db.promise().query('SELECT * FROM eventos WHERE id = ?', [eventoId]);
    console.log('Evento obtenido para compra:', evento);

    if (evento.length === 0) {
      console.error('Error: Evento no encontrado');
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (evento[0].tickets < cantidad) {
      console.error(`Error: No hay suficientes entradas disponibles. Entradas disponibles: ${evento[0].tickets}, solicitadas: ${cantidad}`);
      return res.status(400).json({ error: 'No hay suficientes entradas disponibles' });
    }

    const [updateResult] = await db.promise().query('UPDATE eventos SET tickets = tickets - ? WHERE id = ?', [cantidad, eventoId]);
    console.log('Resultado de la actualización de tickets:', updateResult);

    const [usuario] = await db.promise().query('SELECT email, nombre, primerApellido, segundoApellido FROM usuarios WHERE id = ?', [usuarioId]);
    if (usuario.length === 0) {
      console.error('Error: Usuario no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const userEmail = usuario[0].email;
    const userNombre = usuario[0].nombre;
    const userPrimerApellido = usuario[0].primerApellido;
    const userSegundoApellido = usuario[0].segundoApellido;

    for (let i = 0; i < cantidad; i++) {
      // 1. Inserta el ticket con codigoQR temporal
      const [insertResult] = await db.promise().query(
        'INSERT INTO tickets (eventoId, usuarioId, codigoQR, usado) VALUES (?, ?, ?, ?)', 
        [eventoId, usuarioId, '', false]
      );
      const ticketId = insertResult.insertId;

      // 2. Genera el codigoQR JSON plano
      const codigoQR = await generarCodigoQR(ticketId, eventoId, usuarioId);
      console.log('Código QR generado:', codigoQR);

      // 3. Actualiza el ticket con el codigoQR correcto
      await db.promise().query(
        'UPDATE tickets SET codigoQR = ? WHERE id = ?',
        [codigoQR, ticketId]
      );

      // 4. Genera el QR como imagen para el PDF/correo
      const qrImage = await qrcode.toDataURL(codigoQR);

      try {
        await enviarCorreoConQR(
          userEmail,
          qrImage, // Usa la imagen QR para el PDF/correo
          { ...evento[0], compradorNombre: userNombre, compradorPrimerApellido: userPrimerApellido, compradorSegundoApellido: userSegundoApellido }
        );
        console.log(`Correo enviado exitosamente al usuario con ID: ${usuarioId}`);
      } catch (emailError) {
        console.error('Error al enviar el correo:', emailError);
      }
    }

    res.json({ message: 'Compra realizada exitosamente' });
  } catch (err) {
    console.error('Error al realizar la compra:', err);
    res.status(500).json({ error: 'Error al realizar la compra', details: err.message });
  }
};

const validarTicket = async (req, res) => {
  const { codigoQR } = req.body;
  console.log('Valor recibido en codigoQR:', codigoQR);

  try {
    const [ticketRows] = await db.promise().query('SELECT * FROM tickets WHERE codigoQR = ?', [codigoQR]);
    if (ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const ticket = ticketRows[0];

    // Obtener información del evento y usuario
    const [eventoRows] = await db.promise().query('SELECT nombre, fecha, lugar FROM eventos WHERE id = ?', [ticket.eventoId]);
    const evento = eventoRows.length > 0 ? eventoRows[0] : {};
    const [usuarioRows] = await db.promise().query('SELECT nombre, email FROM usuarios WHERE id = ?', [ticket.usuarioId]);
    const usuario = usuarioRows.length > 0 ? usuarioRows[0] : {};

    const ticketInfo = {
      id: ticket.id,
      evento: evento,
      usuario: usuario,
      fechaCompra: ticket.fechaCompra,
      usado: ticket.usado,
    };

    if (ticket.usado) {
      return res.status(200).json({
        message: 'El ticket ya ha sido escaneado',
        ticket: ticketInfo,
        usado: true
      });
    }

    await db.promise().query('UPDATE tickets SET usado = true WHERE id = ?', [ticket.id]);

    res.json({
      message: 'Ticket válido',
      ticket: ticketInfo,
      usado: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al validar el ticket' });
  }
};

const obtenerTicketsUsuario = async (req, res) => {
  const usuarioId = req.params.usuarioId;
  try {
    const [tickets] = await db.promise().query(
      `SELECT t.*, e.nombre AS eventoNombre, e.fecha, e.lugar, e.imagen
       FROM tickets t
       JOIN eventos e ON t.eventoId = e.id
       WHERE t.usuarioId = ?
       ORDER BY t.id DESC`, // Cambiado a t.id DESC
      [usuarioId]
    );
    res.json(tickets);
  } catch (err) {
    console.error('Error al obtener tickets del usuario:', err);
    res.status(500).json({ error: 'Error al obtener los tickets del usuario' });
  }
};

module.exports = { comprarTicket, validarTicket, obtenerTicketsUsuario };