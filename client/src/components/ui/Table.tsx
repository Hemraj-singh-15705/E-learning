import React from 'react';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ children, className = '', ...props }) => (
  <div className="w-100 overflow-x-auto border border-secondary rounded-4 shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
    <table className={`table table-dark table-hover align-middle mb-0 ${className}`} style={{ backgroundColor: 'transparent' }} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <thead className={`border-bottom border-secondary text-secondary text-uppercase fw-bold ${className}`} style={{ fontSize: '0.7rem', letterSpacing: '0.04em', backgroundColor: 'rgba(0, 0, 0, 0.25)' }} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-secondary ${className}`} style={{ fontSize: '0.8rem' }} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = '', ...props }) => (
  <tr className={`transition-all ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <th className={`px-3.5 py-3 font-semibold text-secondary ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-3.5 py-3 text-light ${className}`} {...props}>
    {children}
  </td>
);

export default Table;
