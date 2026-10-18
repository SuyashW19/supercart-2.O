import React from "react";
import { X, Download, Printer, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import { Order } from "../types";
import { formatINR, APP_NAME, GSTIN, SUPPORT_PHONE, SUPPORT_EMAIL } from "../config";

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const invoiceNo = `INV-${order.order_number}-${new Date(order.created_at).getFullYear()}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Branding
    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // emerald-600
    doc.text(APP_NAME, 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("SuperCart Quick Commerce Technologies Pvt. Ltd.", 20, 32);
    doc.text(`GSTIN: ${GSTIN}`, 20, 37);
    doc.text(`Dark Store: ${order.store_location.name}`, 20, 42);

    // Invoice Meta
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("TAX INVOICE", pageWidth - 70, 25);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice No: ${invoiceNo}`, pageWidth - 70, 32);
    doc.text(`Order No: ${order.order_number}`, pageWidth - 70, 37);
    doc.text(`Date: ${invoiceDate}`, pageWidth - 70, 42);
    doc.text(`Payment: ${order.payment_method.toUpperCase()}`, pageWidth - 70, 47);

    // Line Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 52, pageWidth - 20, 52);

    // Bill To
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("BILLED TO & DELIVERED AT:", 20, 60);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(order.customer_name, 20, 66);
    doc.text(`${order.delivery_address.house_no}, ${order.delivery_address.street}`, 20, 71);
    if (order.customer_phone) {
      doc.text(`Phone: ${order.customer_phone}`, 20, 81);
    }

    // Table Header
    let y = 92;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y - 5, pageWidth - 40, 8, "F");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Item Description", 24, y);
    doc.text("Qty", 110, y);
    doc.text("Rate", 130, y);
    doc.text("Total", pageWidth - 35, y);

    y += 8;
    // Table Rows
    order.items.forEach((item) => {
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${item.name} (${item.weight})`, 24, y);
      doc.text(String(item.quantity), 112, y);
      doc.text(`Rs. ${item.price}`, 130, y);
      doc.text(`Rs. ${item.price * item.quantity}`, pageWidth - 35, y);
      y += 6.5;
    });

    // Divider
    doc.line(20, y + 2, pageWidth - 20, y + 2);
    y += 10;

    // Breakdown
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Item Total:", pageWidth - 80, y);
    doc.text(`Rs. ${order.item_total}`, pageWidth - 35, y);
    y += 5.5;

    doc.text("Delivery Fee:", pageWidth - 80, y);
    doc.text(`Rs. ${order.delivery_fee}`, pageWidth - 35, y);
    y += 5.5;

    doc.text("Handling Charges:", pageWidth - 80, y);
    doc.text(`Rs. ${order.handling_fee}`, pageWidth - 35, y);
    y += 5.5;

    if (order.discount > 0) {
      doc.text("Discount Applied:", pageWidth - 80, y);
      doc.text(`-Rs. ${order.discount}`, pageWidth - 35, y);
      y += 5.5;
    }

    doc.text("CGST (2.5%) + SGST (2.5%):", pageWidth - 80, y);
    doc.text(`Rs. ${order.gst}`, pageWidth - 35, y);
    y += 7;

    // Grand Total
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text("Grand Total (INR):", pageWidth - 80, y);
    doc.text(`Rs. ${order.grand_total}`, pageWidth - 35, y);

    // Footer note
    y += 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This is an electronically generated tax invoice. No signature required.", 20, y);
    doc.text(`Customer Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}`, 20, y + 5);

    doc.save(`${invoiceNo}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tax Invoice
            </h2>
            <span className="text-xs text-slate-400 font-mono">({invoiceNo})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Header Details */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-emerald-600 tracking-tight">
                {APP_NAME}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                SuperCart Quick Commerce Technologies Pvt. Ltd.
              </p>
              <p className="text-[11px] text-slate-400">GSTIN: {GSTIN}</p>
              <p className="text-[11px] text-slate-400">
                FSSAI Lic. No: 11521034000892
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px] mb-1">
                Tax Invoice
              </span>
              <p className="font-mono text-slate-900 dark:text-white font-bold">
                {invoiceNo}
              </p>
              <p className="text-slate-500">Date: {invoiceDate}</p>
              <p className="text-slate-500">Payment: {order.payment_method.toUpperCase()}</p>
            </div>
          </div>

          {/* Customer / Billing details */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                Billed To:
              </span>
              <p className="font-bold text-slate-900 dark:text-white">{order.customer_name}</p>
              {order.customer_phone ? <p className="text-slate-500">{order.customer_phone}</p> : null}
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                Delivered At:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {order.delivery_address.house_no}, {order.delivery_address.street},{" "}
                {order.delivery_address.area}, {order.delivery_address.city} - {order.delivery_address.pincode}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Tax (5%)</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item, i) => {
                  const lineTotal = item.price * item.quantity;
                  const itemGst = Math.round(lineTotal * 0.05);
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {item.weight} · HSN: 2106
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{formatINR(item.price)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                        {formatINR(itemGst)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        {formatINR(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Calculation breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatINR(order.item_total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charges:</span>
                <span className="tabular-nums font-medium text-emerald-600">
                  {order.delivery_fee === 0 ? "FREE" : formatINR(order.delivery_fee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Handling Fee:</span>
                <span className="tabular-nums">{formatINR(order.handling_fee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount:</span>
                  <span className="tabular-nums">-{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>CGST (2.5%) + SGST (2.5%):</span>
                <span className="tabular-nums">{formatINR(order.gst)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-emerald-600 tabular-nums">{formatINR(order.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Footer declaration */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center leading-normal">
            This is a computer-generated tax invoice issued in accordance with Section 31 of the CGST Act, 2017.
            <br />
            For any billing support, contact {SUPPORT_EMAIL} or call {SUPPORT_PHONE}.
          </div>
        </div>
      </div>
    </div>
  );
};
