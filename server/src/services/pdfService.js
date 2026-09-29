const PDFDocument = require('pdfkit');

const generatePrescriptionPDF = (prescription, patient, doctor) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Header
      doc.fontSize(20).text('Medical Prescription', { align: 'center' });
      doc.moveDown();

      // Doctor Info
      doc.fontSize(12).text(`Doctor: ${doctor.name}`, { align: 'right' });

      // Patient Info
      doc.text(`Patient: ${patient.name}`, { align: 'left' });
      doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { align: 'left' });
      doc.moveDown(2);

      // Medicines
      doc.fontSize(16).text('Medicines:', { underline: true });
      doc.moveDown();

      doc.fontSize(12);
      prescription.medicines.forEach((med, i) => {
        doc.text(`${i + 1}. ${med.name}`);
        doc.text(`   Dosage: ${med.dosage}`);
        doc.text(`   Instructions: ${med.instructions}`);
        doc.moveDown();
      });

      doc.moveDown(2);
      doc.fontSize(10).text('This is a digitally generated prescription.', { align: 'center', color: 'gray' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateReportPDF = (report, patient, doctor) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Header
      doc.fontSize(20).text('Medical Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Title: ${report.title}`, { align: 'center' });
      doc.moveDown();

      // Info
      doc.fontSize(12).text(`Patient: ${patient.name}`);
      doc.text(`Doctor: ${doctor.name}`);
      doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`);
      doc.moveDown(2);

      // Content
      doc.text(report.content);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePrescriptionPDF, generateReportPDF };
