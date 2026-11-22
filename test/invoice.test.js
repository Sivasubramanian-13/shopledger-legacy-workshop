const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('invoice GST breakdown and total match the figures used to bill the customer', () => {
  const order = {
    items: [{ id: 1, name: 'Rice', sku: 'GRN-001', price: 640, qty: 1, hsn: '1006' }],
    coupon: ''
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const invoiced = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: invoiced.subtotal,
      discount: invoiced.discount,
      tax: invoiced.tax,
      cgst: invoiced.cgst,
      sgst: invoiced.sgst,
      total: invoiced.total,
      lineGstPercent: invoiced.rows[0].gstPercent,
      lineTax: invoiced.rows[0].lineTax
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total,
      lineGstPercent: billed.lines[0].gstPercent,
      lineTax: billed.lines[0].tax
    }
  );
});

test('invoice applies the HSN tax slab and splits GST as billed', () => {
  const order = {
    items: [{ id: 1, name: 'Rice', price: 100, qty: 1, hsn: '1006' }],
    coupon: ''
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const invoiced = invoice.computeInvoiceFigures(order);

  assert.equal(invoiced.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(invoiced.rows[0].lineTax, billed.lines[0].tax);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.cgst, billed.cgst);
  assert.equal(invoiced.sgst, billed.sgst);
  assert.equal(invoiced.total, billed.total);
});

test('invoice percent coupon, GST, and total match the billed calculation', () => {
  const order = {
    items: [{ id: 1, name: 'Rice', price: 1000, qty: 1, hsn: '1006' }],
    coupon: 'WELCOME'
  };

  const billed = pricing.computeTotals(order.items, order.coupon);
  const invoiced = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { discount: invoiced.discount, tax: invoiced.tax, total: invoiced.total },
    { discount: billed.discount, tax: billed.tax, total: billed.total }
  );
});

test('invoice ignores an inactive coupon just as the billed calculation does', () => {
  const order = {
    items: [{ id: 1, name: 'Tea', price: 1200, qty: 1, hsn: '0902' }],
    coupon: 'DIWALI20'
  };

  const invoiced = invoice.computeInvoiceFigures(order);

  const billed = pricing.computeTotals(order.items, order.coupon);

  assert.equal(invoiced.discount, billed.discount);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.total, billed.total);
});
