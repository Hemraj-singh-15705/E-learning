import mongoose, { Schema } from 'mongoose';
import { IInvoice } from '../types/invoice';

const InvoiceItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    items: [InvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PAID', 'REFUNDED', 'VOID'],
      default: 'PAID'
    },
    pdfUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

InvoiceSchema.index({ user: 1, issuedAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
