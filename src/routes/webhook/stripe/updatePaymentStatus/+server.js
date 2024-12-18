const PAYMENT_INTENT_TYPES = {
  INVOICE_SUCCEEDED: 'invoice.payment_succeeded',
}

/**
 * Extracts the invoice ID from webhook payload
 * @param {{ data: { object: { id: string; }; }; }} data
 */
function getInvoiceId(data) {
  return data?.data?.object?.id
}

export async function POST({ request, locals }) {
  try {
    const requestData = await request.json()
    const invoiceId = getInvoiceId(requestData)

    if (!invoiceId) {
      console.error('Invalid webhook payload: Missing invoice ID')
      return new Response('Invalid payload', { status: 400 })
    }

    switch (requestData.type) {
      case PAYMENT_INTENT_TYPES.INVOICE_SUCCEEDED:
        console.log('Received Stripe webhook for invoice ID:', invoiceId)

        const { data, error } = await locals.supabase
          .from('invoice_line_items')
          .update({ payment_status: 'Paid' })
          .match({ stripe_invoice_id: invoiceId })
          .select() // Fetch updated rows for verification

        if (error) {
          console.error('Supabase error updating payment_status:', error.message)
          return new Response('Supabase error', { status: 500 })
        }

        if (data?.length === 0) {
          console.warn('No matching records found for stripe_invoice_id:', invoiceId)
        } else {
          console.log('Successfully updated records:', data)
        }
        break

      default:
        console.log('Unhandled webhook type:', requestData.type)
        return new Response('Unhandled event type', { status: 400 })
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response('Server error', { status: 500 })
  }
}

// const PAYMENT_INTENT_TYPES = {
//   INVOICE_SUCCEEDED: 'invoice.payment_succeeded',
// }

// /**
//  * @param {{ data: { object: { id: any; }; }; }} data
//  */
// function getInvoiceId(data) {
//   return data.data.object.id
// }

// export async function POST({ request, locals }) {
//   const requestData = await request.json()

//   switch (requestData.type) {
//     case PAYMENT_INTENT_TYPES.INVOICE_SUCCEEDED:
//       console.log('Received stripe payment webhook for invoice ID:', getInvoiceId(requestData))

//       const { error } = await locals.supabase
//         .from('invoice_line_items')
//         .update({
//           payment_status: 'Paid',
//         })
//         .match({
//           stripe_invoice_id: getInvoiceId(requestData),
//         })

//       if (error) {
//         console.error('Failed to find line items that match stripe invoice id', error)
//       } else {
//         console.log(
//           'Successfully updated contract with Invoice Id for invoice:',
//           getInvoiceId(requestData),
//         )
//       }
//       break
//     default:
//       break
//   }

//   return new Response('ok')
// }
