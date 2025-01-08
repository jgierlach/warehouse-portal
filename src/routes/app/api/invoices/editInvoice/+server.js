import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const {
    billingMonth,
    companyName,
    stripeInvoiceId,
    stripeDashboardUrl,
    stripeInvoiceUrl,
    dateDue,
  } = await request.json()

  const row = {
    stripe_invoice_id: stripeInvoiceId,
    stripe_dashboard_url: stripeDashboardUrl,
    stripe_invoice_url: stripeInvoiceUrl,
    date_due: dateDue,
  }

  const { data, error } = await locals.supabase
    .from('invoice_line_items')
    .update(row)
    .eq('billing_month', billingMonth)
    .eq('company_name', companyName)
    .select()

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Invoice was edited!' },
  })
}
