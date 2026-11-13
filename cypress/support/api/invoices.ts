import { apiRequest } from './client';
import type { CartLine } from './carts';
import { createCart } from './carts';
import { getPaymentCase } from '../data/payments';
import type { Customer } from './users';

export type PaymentMethod =
  'bank-transfer' | 'cash-on-delivery' | 'credit-card' | 'buy-now-pay-later' | 'gift-card';

export interface InvoiceLine {
  product_id: string;
  quantity: number;
  unit_price: number;
  product: { name: string };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  status_message: string | null;
  total: number;
  billing_street: string;
  billing_city: string;
  billing_country: string;
  invoicelines?: InvoiceLine[];
  payment?: { payment_method: PaymentMethod };
}

/** Crea un pedido completo por API (carrito + factura) para el cliente indicado. */
export function createOrder(
  customer: Customer,
  lines: CartLine[],
  paymentMethod: PaymentMethod = 'cash-on-delivery',
): Cypress.Chainable<Invoice> {
  return createCart(lines).then((cart) =>
    apiRequest<Invoice>({
      method: 'POST',
      path: '/invoices',
      token: customer.token,
      body: {
        billing_street: customer.address.street,
        billing_city: customer.address.city,
        billing_state: customer.address.state,
        billing_country: customer.address.country,
        billing_postal_code: customer.address.postal_code,
        payment_method: paymentMethod,
        payment_details: getPaymentCase(paymentMethod).fields,
        cart_id: cart.id,
      },
    }).then(({ body }) => body),
  );
}

export function getInvoice(id: string, token: string): Cypress.Chainable<Invoice> {
  return apiRequest<Invoice>({ method: 'GET', path: `/invoices/${id}`, token }).then(
    ({ body }) => body,
  );
}

/** Busca una factura del cliente por su número visible (p. ej. INV-2026000010). */
export function findInvoiceByNumber(
  invoiceNumber: string,
  token: string,
): Cypress.Chainable<Invoice> {
  return apiRequest<{ data: Invoice[] }>({ method: 'GET', path: '/invoices', token }).then(
    ({ body }) => {
      const match = body.data.find((invoice) => invoice.invoice_number === invoiceNumber);
      if (!match)
        throw new Error(`La factura ${invoiceNumber} no aparece en la cuenta del cliente.`);
      return getInvoice(match.id, token);
    },
  );
}
