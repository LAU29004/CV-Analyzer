export const sectionTitle = (doc, title) => {
  doc.font("Helvetica-Bold").fontSize(12).text(title.toUpperCase());
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.6);
};

export const renderBullets = (doc, bullets = []) => {
  bullets.forEach(b => {
    if (typeof b === "string" && b.trim()) {
      doc.text(`• ${b}`, { indent: 14, lineGap: 2 });
    }
  });
};