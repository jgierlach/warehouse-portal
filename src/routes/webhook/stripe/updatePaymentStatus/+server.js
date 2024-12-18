const PAYMENT_INTENT_TYPES = {
  INVOICE_SUCCEEDED: 'invoice.payment_succeeded',
}

/**
 * @param {{ data: { object: { id: any; }; }; }} data
 */
function getInvoiceId(data) {
  return data.data.object.id
}

export async function POST({ request, locals }) {
  const requestData = await request.json()

  switch (requestData.type) {
    case PAYMENT_INTENT_TYPES.INVOICE_SUCCEEDED:
      console.log('Received stripe payment webhook for invoice ID:', getInvoiceId(requestData))

      const { error } = await locals.supabase
        .from('invoice_line_items')
        .update({
          payment_status: 'Paid',
        })
        .match({
          stripe_invoice_id: getInvoiceId(requestData),
        })

      if (error) {
        console.error('Failed to find line items that match stripe invoice id', error)
      } else {
        console.log(
          'Successfully updated contract with Invoice Id for invoice:',
          getInvoiceId(requestData),
        )
      }
      break
    default:
      break
  }

  return new Response('ok')
}
