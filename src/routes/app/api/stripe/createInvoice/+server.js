import Stripe from 'stripe';
import { json } from '@sveltejs/kit';

const stripePrivateKey = import.meta.env.VITE_STRIPE_PRIVATE_KEY;
const stripe = new Stripe(stripePrivateKey);

export async function POST({ request, locals }) {
  // Parse the request body from JSON
  const requestBody = await request.json();
  const { stripeCustomerId, lineItems, passCardFeesOn, billingPeriod, daysUntilDue } = requestBody;

  if (stripeCustomerId === null || stripeCustomerId === undefined) {
    return json({
      status: 500,
      body: {
        message: 'No Stripe Customer Id was provided.',
      },
    });
  }

  const convertStrToCents = (str, passCardFeesOn) => {
    const num = parseFloat(str.toString().replace(/,/g, ''))
    const invoiceAmount = passCardFeesOn ? num * 1.034 : num
    const invoiceAmountInCents = invoiceAmount * 100
    return Math.round(invoiceAmountInCents); // Ensure rounding to deal with floating point imprecision
  };

  const generateDescription = (item, passCardFeesOn) => {
    if (passCardFeesOn) {
      return `${item.servicesProvided} - ${billingPeriod}`
    }
    return `${item.servicesProvided} - ${billingPeriod}`
  }

  try {
    // Create the invoice with auto_advance set to true
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      payment_settings: {
        payment_method_types: ['card', 'us_bank_account']
      },
    });

    // Create an invoice item for each line item provided
    const invoiceItemPromises = lineItems.map(item => {
      let amount = convertStrToCents(item.actualContractValue, passCardFeesOn)
      let description = generateDescription(item, passCardFeesOn)
      return stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount,
        currency: 'usd',
        description,
        invoice: invoice.id
      })
    }
    );

    // Wait for all invoice items to be created
    await Promise.all(invoiceItemPromises);

    await stripe.invoices.finalizeInvoice(invoice.id);

    // Comment the line below in if you want Stripe Invoices to be sent to customers
    // await stripe.invoices.sendInvoice(invoice.id);

    // Code to retrieve stripe invoice url
    const hostedInvoice = await stripe.invoices.retrieve(invoice.id)
    const stripeInvoiceUrl = hostedInvoice.hosted_invoice_url

    // Return success response
    return json({
      status: 200,
      body: {
        message: 'Invoice created successfully.',
        invoiceId: invoice.id,
        stripeInvoiceUrl,
      },
    });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    // Return error response
    return json({
      status: 500,
      body: {
        error: 'Failed to create invoice',
      },
    });
  }
}
