import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const {
    id,
    billingMonth,
    companyName,
    lineItemName,
    billingTerms,
    cost,
    stripeInvoiceId,
    stripeDashboardUrl,
    stripeInvoiceUrl,
    paymentStatus,
    dateDue,
  } = await request.json()

  const row = {
    id,
    billing_month: billingMonth,
    company_name: companyName,
    line_item_name: lineItemName,
    line_item_cost: cost,
    line_item_billing_terms: billingTerms,
    stripe_invoice_id: stripeInvoiceId,
    stripe_dashboard_url: stripeDashboardUrl,
    stripe_invoice_url: stripeInvoiceUrl,
    payment_status: paymentStatus,
    date_due: dateDue,
  }

  const { data, error } = await locals.supabase
    .from('invoice_line_items')
    .update(row)
    .eq('id', id)
    .select()

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Invoice line item was edited!' },
  })
}
