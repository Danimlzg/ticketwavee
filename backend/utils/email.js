const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

// Genera un PDF con la información del evento y el QR con estilos
const generarPDF = (evento, qrCodeDataUrl) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Fondo y cabecera
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');
    doc.fillColor('#fff');
    doc.fontSize(26).font('Helvetica-Bold').text('TicketWave', { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Evento
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#f5ba09').text(evento.nombre, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(14).font('Helvetica').fillColor('#fff');
    doc.text('Fecha: ', { continued: true }).fillColor('#f5ba09').text(`${new Date(evento.fecha).toLocaleString()}`);
    doc.fillColor('#fff').text('Lugar: ', { continued: true }).fillColor('#f5ba09').text(evento.lugar);
    doc.fillColor('#fff').text('Precio: ', { continued: true }).fillColor('#f5ba09').text(`${evento.precio}`);
    doc.moveDown(1);

    // Nombre del comprador
    if (evento.compradorNombre || evento.compradorPrimerApellido || evento.compradorSegundoApellido) {
      doc.fontSize(13).fillColor('#fff').text(
        `Titular: ${evento.compradorNombre || ''} ${evento.compradorPrimerApellido || ''} ${evento.compradorSegundoApellido || ''}`.trim(),
        { align: 'center' }
      );
      doc.moveDown(1);
    }

    // Mensaje
    doc.fillColor('#fff').fontSize(13).text('Presenta este ticket en la entrada del evento. El código QR es único y personal.', { align: 'center' });
    doc.moveDown(1.5);

    // QR centrado
    if (qrCodeDataUrl) {
      const qrImage = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrImage, 'base64');
      const qrX = (doc.page.width - 150) / 2;
      doc.image(qrBuffer, qrX, doc.y, { width: 150, align: 'center' });
      doc.moveDown(2);
    }

    doc.end();
  });
};

const enviarCorreoConQR = async (destinatario, qrCode, evento) => {
  console.log('Enviando correo a:', destinatario); 
  const pdfBuffer = await generarPDF(evento, qrCode);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: destinatario,  
    subject: `Tu entrada para ${evento.nombre}`,
    html: `
      <h1 style="color:#1a1a2e;">¡Gracias por tu compra!</h1>
      <p>Adjuntamos tu entrada en PDF con toda la información y tu código QR.</p>
      <p>¡Te esperamos!</p>
    `,
    attachments: [
      {
        filename: `entrada-${evento.nombre}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente a:', destinatario);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo con el PDF. Por favor, verifica la configuración del servidor.');
  }
};

module.exports = { enviarCorreoConQR };