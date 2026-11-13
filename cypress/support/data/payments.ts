import { faker } from '@faker-js/faker';

import type { PaymentMethod } from '../api/invoices';

export interface PaymentCase {
  method: PaymentMethod;
  label: string;
  /** Campos del formulario de pago por `data-test`, con el valor a escribir o seleccionar. */
  fields: Record<string, string>;
}

function futureExpiration(): string {
  const date = faker.date.future({ years: 3 });
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear() + 1)}`;
}

/** Datos de pago ficticios con el formato que exige la tienda; ninguno es un medio real. */
export function buildPaymentCases(): PaymentCase[] {
  return [
    { method: 'cash-on-delivery', label: 'Cash on Delivery', fields: {} },
    {
      method: 'bank-transfer',
      label: 'Bank Transfer',
      fields: {
        bank_name: 'Test Bank',
        account_name: 'QA Automation',
        account_number: faker.string.numeric(10),
      },
    },
    {
      method: 'credit-card',
      label: 'Credit Card',
      fields: {
        credit_card_number: '0000-0000-0000-0000',
        expiration_date: futureExpiration(),
        cvv: '123',
        card_holder_name: 'QA Automation',
      },
    },
    {
      method: 'buy-now-pay-later',
      label: 'Buy Now Pay Later',
      fields: { monthly_installments: '6' },
    },
    {
      method: 'gift-card',
      label: 'Gift Card',
      fields: {
        gift_card_number: faker.string.alphanumeric(16),
        validation_code: faker.string.alphanumeric(4),
      },
    },
  ];
}

export function getPaymentCase(method: PaymentMethod): PaymentCase {
  const match = buildPaymentCases().find((candidate) => candidate.method === method);
  if (!match) throw new Error(`Medio de pago no soportado: ${method}`);
  return match;
}
