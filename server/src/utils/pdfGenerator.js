import PDFDocument from 'pdfkit';

/**
 * Generate PDF Invoice Buffer
 * @param {Object} bill
 * @param {Object} settings
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (bill, settings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${bill.invoiceNumber}`,
          Author: settings.shopName || 'Hardware Billing'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const shopName = settings.shopName || 'Kisan Hardware & Sanitary Mart';
      const tagline = settings.tagline || 'Pipes, Motors, Submersibles & Fittings';
      const shopAddress = settings.address || 'Main Market Road';
      const shopPhone = settings.phone || '';
      const shopGstin = settings.gstin || '';
      const invoicePrefix = settings.invoicePrefix || 'INV';

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#1E3A8A'); // Dark Blue
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold');
      doc.text(shopName.toUpperCase(), 50, 48);

      doc.fillColor('#E2E8F0').fontSize(10).font('Helvetica');
      doc.text(tagline, 50, 70);

      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold');
      doc.text('TAX INVOICE', 400, 52, { align: 'right', width: 145 });

      // Shop & Invoice Meta
      doc.fillColor('#1F2937');
      let y = 110;

      // Left: Shop Info
      doc.fontSize(9).font('Helvetica');
      doc.text(`Address: ${shopAddress}`, 40, y, { width: 250 });
      y += 14;
      if (shopPhone) {
        doc.text(`Phone: ${shopPhone}`, 40, y);
        y += 14;
      }
      if (shopGstin) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${shopGstin}`, 40, y);
        doc.font('Helvetica');
        y += 14;
      }

      // Right: Invoice Info
      let rightY = 110;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(`Invoice No: ${bill.invoiceNumber}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 15;
      doc.font('Helvetica').fontSize(9);
      doc.text(`Date: ${new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 14;
      doc.text(`Payment Mode: ${bill.paymentMode}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 14;
      doc.text(`Payment Status: ${bill.paymentStatus.toUpperCase()}`, 320, rightY, { width: 235, align: 'right' });

      y = Math.max(y, rightY) + 15;

      // Customer Box
      doc.rect(40, y, 515, 45).fillAndStroke('#F8FAFC', '#CBD5E1');
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
      doc.text('BILL TO (CUSTOMER):', 50, y + 6);
      doc.font('Helvetica').fontSize(9);
      doc.text(`${bill.customer?.name || 'Cash Customer'} | Phone: ${bill.customer?.phone || 'N/A'}`, 50, y + 18);
      if (bill.customer?.address || bill.customer?.gstin) {
        const extra = [
          bill.customer?.address ? `Address: ${bill.customer.address}` : '',
          bill.customer?.gstin ? `GSTIN: ${bill.customer.gstin}` : ''
        ].filter(Boolean).join(' | ');
        doc.text(extra, 50, y + 30);
      }

      y += 55;

      // Items Table Header
      doc.rect(40, y, 515, 20).fill('#334155');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
      doc.text('#', 45, y + 6, { width: 20 });
      doc.text('ITEM DESCRIPTION', 68, y + 6, { width: 180 });
      doc.text('HSN', 245, y + 6, { width: 45 });
      doc.text('QTY', 290, y + 6, { width: 45, align: 'right' });
      doc.text('RATE', 340, y + 6, { width: 50, align: 'right' });
      doc.text('DISC', 395, y + 6, { width: 35, align: 'right' });
      doc.text('GST%', 435, y + 6, { width: 35, align: 'right' });
      doc.text('AMOUNT', 475, y + 6, { width: 75, align: 'right' });

      y += 20;

      // Items Rows
      doc.fillColor('#1E293B').font('Helvetica').fontSize(8.5);
      let idx = 1;

      for (const item of bill.items) {
        // Alternating zebra row
        if (idx % 2 === 0) {
          doc.rect(40, y, 515, 18).fill('#F1F5F9');
          doc.fillColor('#1E293B');
        }

        const itemName = `${item.name}${item.brand ? ` (${item.brand})` : ''}${item.sizeModel ? ` - ${item.sizeModel}` : ''}`;
        doc.text(String(idx), 45, y + 4, { width: 20 });
        doc.text(itemName.substring(0, 35), 68, y + 4, { width: 180 });
        doc.text(item.hsnCode || '-', 245, y + 4, { width: 45 });
        doc.text(`${item.quantity} ${item.unit || ''}`, 290, y + 4, { width: 45, align: 'right' });
        doc.text(item.sellingPrice.toFixed(2), 340, y + 4, { width: 50, align: 'right' });
        doc.text((item.discountAmount || 0).toFixed(2), 395, y + 4, { width: 35, align: 'right' });
        doc.text(`${item.taxRate || 0}%`, 435, y + 4, { width: 35, align: 'right' });
        doc.text(item.totalAmount.toFixed(2), 475, y + 4, { width: 75, align: 'right' });

        y += 18;
        idx++;

        if (y > 680) {
          doc.addPage();
          y = 40;
        }
      }

      // Divider line
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, y + 4).lineTo(555, y + 4).stroke();
      y += 12;

      // Summary Box (Right Aligned)
      const summaryLeft = 330;
      doc.fontSize(8.5).font('Helvetica');

      const addSummaryRow = (label, val, isBold = false, isHighlight = false) => {
        if (isHighlight) {
          doc.rect(summaryLeft - 5, y - 2, 230, 18).fill('#FEF3C7');
          doc.fillColor('#B45309');
        } else {
          doc.fillColor('#1E293B');
        }

        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, summaryLeft, y, { width: 130 });
        doc.text(val, summaryLeft + 130, y, { width: 90, align: 'right' });
        y += 15;
      };

      addSummaryRow('Subtotal:', `₹${bill.subtotal.toFixed(2)}`);
      if (bill.totalDiscount > 0) {
        addSummaryRow('Total Discount:', `-₹${bill.totalDiscount.toFixed(2)}`);
      }
      addSummaryRow('Taxable Amount:', `₹${bill.taxableAmount.toFixed(2)}`);

      if (bill.isInterState) {
        addSummaryRow('IGST:', `₹${bill.igstAmount.toFixed(2)}`);
      } else {
        addSummaryRow('CGST:', `₹${bill.cgstAmount.toFixed(2)}`);
        addSummaryRow('SGST:', `₹${bill.sgstAmount.toFixed(2)}`);
      }

      if (bill.roundOff !== 0) {
        addSummaryRow('Round Off:', `${bill.roundOff > 0 ? '+' : ''}₹${bill.roundOff.toFixed(2)}`);
      }

      y += 2;
      doc.rect(summaryLeft - 5, y - 3, 230, 22).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11);
      doc.text('GRAND TOTAL:', summaryLeft, y + 3, { width: 130 });
      doc.text(`₹${bill.grandTotal.toFixed(2)}`, summaryLeft + 130, y + 3, { width: 90, align: 'right' });
      y += 25;

      addSummaryRow('Paid Amount:', `₹${bill.paidAmount.toFixed(2)}`);
      if (bill.balanceDue > 0) {
        addSummaryRow('Balance Due (Udhaar):', `₹${bill.balanceDue.toFixed(2)}`, true, true);
      }

      // Bank Details & Footer Notes (Left side)
      let footerY = y - 75;
      if (footerY < y) footerY = y + 10;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155');
      doc.text('BANK & UPI DETAILS:', 40, footerY);
      doc.font('Helvetica').fillColor('#64748B');
      footerY += 12;
      if (settings.bankName) doc.text(`Bank: ${settings.bankName}`, 40, footerY);
      footerY += 10;
      if (settings.bankAccountNumber) doc.text(`A/C: ${settings.bankAccountNumber} | IFSC: ${settings.ifscCode}`, 40, footerY);
      footerY += 10;
      if (settings.upiId) doc.text(`UPI ID: ${settings.upiId}`, 40, footerY);

      footerY += 18;
      doc.font('Helvetica-Bold').fillColor('#334155').text('TERMS & CONDITIONS:', 40, footerY);
      doc.font('Helvetica').fillColor('#64748B');
      footerY += 10;
      doc.text(settings.termsAndConditions || 'Goods once sold are non-refundable.', 40, footerY, { width: 260 });

      // Authorized Signatory
      doc.font('Helvetica-Bold').fillColor('#1E293B').fontSize(9);
      doc.text('For ' + shopName, 400, footerY + 20, { width: 155, align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text('(Authorized Signatory)', 400, footerY + 45, { width: 155, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
