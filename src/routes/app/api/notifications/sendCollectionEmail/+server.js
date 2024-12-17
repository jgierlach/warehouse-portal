import fetch from 'node-fetch'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
  const { billingContactEmail, subjectLine, emailText, ccArray } = await request.json()

  const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY
  const endpoint = 'https://api.sendgrid.com/v3/mail/send'

  let data = {
    personalizations: [
      {
        to: [{ email: billingContactEmail }], // Replace with the recipient's email address
        subject: subjectLine,
        bcc: [
          {
            email: 'accountsreceivable@hometown-industries.com',
          },
        ],
      },
    ],
    from: {
      email: 'accountsreceivable@hometown-industries.com',
      name: 'Hometown Industries Accounting',
    },
    content: [{ type: 'text/plain', value: emailText }],
  }

  // If the cc array has any data in it add it to the payload
  if (ccArray.length > 0) {
    data.personalizations[0].cc = ccArray
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  })

  console.log('RESPONSE', response)

  if (response.ok) {
    return json({
      status: 200,
      body: { message: 'Collection email sent successfully!' },
    })
  } else {
    return json({
      status: response.status,
      body: { message: 'Collection email failed to send.' },
    })
  }
}
