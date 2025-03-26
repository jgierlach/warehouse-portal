import { json } from '@sveltejs/kit'

export async function GET({ url, locals }) {
  const startDate = url.searchParams.get('start_date')
  const endDate = url.searchParams.get('end_date')

  if (!startDate || !endDate) {
    return json({
      status: 400,
      body: { message: 'Missing startDate or endDate parameter' },
    })
  }

  // Parse start and end dates, and ensure the end date captures the entire day
  const startDateTime = new Date(startDate)
  const endDateTime = new Date(endDate)

  // Adjust the end date to the *start* of the next day, to exclude any sales on the next day
  const nextDay = new Date(endDateTime)
  nextDay.setUTCDate(endDateTime.getUTCDate() + 1) // Move to the start of the next day
  nextDay.setUTCHours(0, 0, 0, 0) // Set to midnight UTC of the next day

  // Format both dates to UTC
  const formattedStartDate = startDateTime.toISOString()
  const formattedEndDate = nextDay.toISOString() // Start of the next day

  // Query the sales within this range, excluding the start of the next day
  const { data, error } = await locals.supabase
    .from('Outbound_Shipments')
    .select('*')
    .gte('created_at', formattedStartDate)
    .lt('created_at', formattedEndDate) // Strictly less than next day (excludes midnight)

  if (error) {
    console.error(error)
    return json({
      status: 500,
      body: { message: 'Failed to fetch product sales', error },
    })
  }

  return json({
    status: 200,
    body: data,
  })
}
