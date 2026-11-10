export const round2 = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

export const calculateLineItem = (item, isInterState = false, enableGst = true) => {
  const qty = Number(item.quantity) || 0;
  const sellingPrice = Number(item.sellingPrice) || 0;
  const purchasePrice = Number(item.purchasePrice) || 0;

  const grossAmount = round2(qty * sellingPrice);

  let discountAmount = 0;
  if (item.discountType === 'percentage') {
    const pct = Math.min(Math.max(Number(item.discountValue) || 0, 0), 100);
    discountAmount = round2((grossAmount * pct) / 100);
  } else {
    discountAmount = round2(Math.min(Number(item.discountValue) || 0, grossAmount));
  }

  const taxableAmount = round2(grossAmount - discountAmount);
  const taxRate = enableGst ? (Number(item.taxRate) || 0) : 0;
  const totalTax = round2((taxableAmount * taxRate) / 100);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (enableGst && taxRate > 0) {
    if (isInterState) {
      igstAmount = totalTax;
    } else {
      cgstAmount = round2(totalTax / 2);
      sgstAmount = round2(totalTax - cgstAmount);
    }
  }

  const totalAmount = round2(taxableAmount + totalTax);

  return {
    ...item,
    quantity: qty,
    purchasePrice,
    sellingPrice,
    grossAmount,
    discountAmount,
    taxableAmount,
    taxRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    totalAmount
  };
};

export const calculateBillTotals = (items = [], options = {}) => {
  const isInterState = !!options.isInterState;
  const enableGst = options.enableGst !== false;

  const processedItems = items.map((item) =>
    calculateLineItem(item, isInterState, enableGst)
  );

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalTax = 0;
  let rawGrandTotal = 0;

  for (const it of processedItems) {
    subtotal += it.grossAmount;
    totalDiscount += it.discountAmount;
    taxableAmount += it.taxableAmount;
    cgstAmount += it.cgstAmount;
    sgstAmount += it.sgstAmount;
    igstAmount += it.igstAmount;
    totalTax += it.totalTax;
    rawGrandTotal += it.totalAmount;
  }

  subtotal = round2(subtotal);
  totalDiscount = round2(totalDiscount);
  taxableAmount = round2(taxableAmount);
  cgstAmount = round2(cgstAmount);
  sgstAmount = round2(sgstAmount);
  igstAmount = round2(igstAmount);
  totalTax = round2(totalTax);
  rawGrandTotal = round2(rawGrandTotal);

  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = round2(roundedGrandTotal - rawGrandTotal);
  const grandTotal = roundedGrandTotal;

  const paidAmount = round2(Math.max(0, Number(options.paidAmount) || 0));
  const balanceDue = round2(Math.max(0, grandTotal - paidAmount));

  let paymentStatus = 'paid';
  if (balanceDue === grandTotal) {
    paymentStatus = 'unpaid';
  } else if (balanceDue > 0) {
    paymentStatus = 'partial';
  }

  return {
    items: processedItems,
    subtotal,
    totalDiscount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    roundOff,
    grandTotal,
    paidAmount,
    balanceDue,
    paymentStatus
  };
};
