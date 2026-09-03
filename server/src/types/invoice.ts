import { Document, Types } from 'mongoose';

export type InvoiceStatus = 'PAID' | 'REFUNDED' | 'VOID';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string;
  user: Types.ObjectId;
  payment: Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  issuedAt: Date;
  status: InvoiceStatus;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
