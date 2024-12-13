export const generateClientIds = (clients) => {
  const activeClients = clients.filter(
    (client) =>
      client.username !== 'jan@hometown-industries.com' &&
      client.username !== 'susan@hometown-industries.com' &&
      client.username !== 'wesley@hometown-industries.com' &&
      client.username !== 'storageandfulfillment@hometown-industries.com',
  )
  return activeClients.map((client) => client.username)
}

export const calculateRevenueCollectedForSelectedMonth = (invoiceLineItemsForSelectedMonth) => {
  return invoiceLineItemsForSelectedMonth
    .filter((row) => row.payment_status === 'Paid')
    .map((lineItem) => parseFloat(lineItem.line_item_cost.toString().replace(/,/g, '')))
    .reduce((a, b) => a + b, 0)
}

export const calculateRevenueBilledForSelectedMonth = (invoiceLineItemsForSelectedMonth) => {
  return invoiceLineItemsForSelectedMonth
    .map((lineItem) => parseFloat(lineItem.line_item_cost.toString().replace(/,/g, '')))
    .reduce((a, b) => a + b, 0)
}

export const alphabetizeByCompanyName = (arr) => {
  return arr.slice().sort((a, b) => {
    const nameA = a['company_name'].toUpperCase()
    const nameB = b['company_name'].toUpperCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }
    return 0
  })
}

export const findInvoiceLineItemsForSelectedMonth = (lineItems, billingMonthAndYear) => {
  return lineItems.filter((lineItem) => lineItem.billing_month === billingMonthAndYear)
}

export const getCurrentBillingMonthAndYear = () => {
  const date = new Date()
  const currentMonthAndYear = `${date.toLocaleString('default', { month: 'long' })}, ${date.getFullYear()}`
  return getPreviousMonthAndYear(currentMonthAndYear)
}

export const getPreviousMonthAndYear = (monthYear) => {
  if (!monthYear) return ''
  const date = parseMonthYear(monthYear)
  date.setMonth(date.getMonth() - 1)
  return formatMonthYear(date)
}

// Example utility function to parse "Month, Year" into a Date object
function parseMonthYear(monthYear) {
  const [month, year] = monthYear.split(', ')
  return new Date(`${month} 1, ${year}`)
}

// Example utility function to format a Date object back into "Month, Year"
function formatMonthYear(date) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${month}, ${year}`
}

export const generateBillingMonthsAndYears = (rows) => {
  return sortBillingMonthsAndYears([...new Set(rows.map((row) => row.billing_month))])
}

export const generateCompanyNames = (clients) => {
  return [...new Set(clients.map((client) => client.company_name))]
}

export const sortBillingMonthsAndYears = (dates) => {
  return dates.sort((a, b) => {
    const [monthA, yearA] = a.split(', ').map((str) => str.trim())
    const [monthB, yearB] = b.split(', ').map((str) => str.trim())
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const yearDiff = parseInt(yearA) - parseInt(yearB)
    if (yearDiff !== 0) {
      return yearDiff
    }
    return months.indexOf(monthA) - months.indexOf(monthB)
  })
}

export const formatMonthForLineItem = (input) => {
  const monthMap = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    10: 'October',
    11: 'November',
    12: 'December',
  }

  const [year, month] = input.split('-') // Split by '-' to get year and month
  return `${monthMap[month]}, ${year}`
}

export const formatTimeStampForChangelog = (dateString) => {
  const options = {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }

  const date = new Date(dateString)
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const [monthDay, time] = formatter.format(date).split(', ')

  // Extract day suffix
  const day = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    timeZone: 'America/Chicago',
  }).format(date)
  const suffix = getDaySuffix(day)

  return `${monthDay}${suffix}, ${time} CST`
}

export const getDaySuffix = (day) => {
  if (day.endsWith('1') && !day.endsWith('11')) return 'st'
  if (day.endsWith('2') && !day.endsWith('12')) return 'nd'
  if (day.endsWith('3') && !day.endsWith('13')) return 'rd'
  return 'th'
}

export const addInvoiceTerms = (inputDate, daysUntilDue) => {
  // Parse the input date
  let parts = inputDate.split('/')
  let month = parseInt(parts[0], 10)
  let day = parseInt(parts[1], 10)
  let year = parseInt(parts[2], 10)

  // If the year is in short format, convert it to full format
  if (year < 1000) {
    year += 2000
  }

  // Create a date object
  let date = new Date(year, month - 1, day)

  // Add 14 days to the date
  date.setDate(date.getDate() + daysUntilDue)

  // Format the new date to MM/DD/YY
  let newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  let newDay = date.getDate().toString().padStart(2, '0')
  let newYear = date.getFullYear().toString()

  return `${newMonth}/${newDay}/${newYear}`
}

export const getCurrentDateFormatted = () => {
  const date = new Date()

  let month = date.getMonth() + 1 // getMonth returns months indexed from 0
  let day = date.getDate()
  let year = date.getFullYear()

  // Ensuring that the month and day are always two digits
  month = month < 10 ? '0' + month : month
  day = day < 10 ? '0' + day : day

  return `${month}/${day}/${year}`
}

// Expected format month/day/year
export const generateInvoiceNumber = () => {
  const date = new Date()

  let month = date.getMonth() + 1 // getMonth returns months indexed from 0
  let day = date.getDate()
  let year = date.getFullYear()

  // Ensuring that the month and day are always two digits
  month = month < 10 ? '0' + month : month
  day = day < 10 ? '0' + day : day

  return `${month}${year}`
}

export const generateUniqueShippingNumber = () => {
  const timestamp = Date.now() // Current timestamp in milliseconds
  const randomPart = Math.floor(Math.random() * 100000) // Random number between 0 and 99999
  const uniqueShippingNumber = `SHIP-${timestamp}-${randomPart}`
  return uniqueShippingNumber
}

export const csvGenerator = (totalData, actualHeaderKey, headerToShow, fileName) => {
  let data = totalData || null
  if (data == null || !data.length) {
    return null
  }
  let columnDelimiter = ','
  let lineDelimiter = '\n'
  let keys = headerToShow
  let result = ''
  result += keys.join(columnDelimiter)
  result += lineDelimiter
  data.forEach(function (item) {
    let ctr = 0
    actualHeaderKey.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter
      if (Array.isArray(item[key])) {
        let arrayItem = item[key] && item[key].length > 0 ? '"' + item[key].join(',') + '"' : '-'
        result += arrayItem
      } else if (typeof item[key] == 'string') {
        let strItem = item[key] ? '"' + item[key] + '"' : '-'
        result += strItem ? strItem.replace(/\s{2,}/g, ' ') : strItem
      } else {
        let strItem = item[key] + ''
        result += strItem ? strItem.replace(/,/g, '') : strItem
      }

      ctr++
    })
    result += lineDelimiter
  })

  if (result == null) return

  var blob = new Blob([result])
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae)
  } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    var hiddenElement = window.document.createElement('a')
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result)
    hiddenElement.target = '_blank'
    hiddenElement.download = fileName
    hiddenElement.click()
  } else {
    let link = document.createElement('a')
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export const generateShipmentLineItems = (
  shipments,
  perOrderFee,
  perOrderUnitFee,
  perUnitFBAPackAndPrep,
  perUnitWFSPackAndPrep,
  b2bFreightPercentageMarkup,
) => {
  const groupedShipments = {}

  // Step 1: Group items by Shipment_Number
  shipments.forEach((item) => {
    const shipmentNumber = item.Shipment_Number
    const shipmentCostMarkup = Number(
      ((b2bFreightPercentageMarkup / 100) * item.Cost_Of_Shipment).toFixed(2),
    )

    if (!groupedShipments[shipmentNumber]) {
      groupedShipments[shipmentNumber] = {
        orderDate: item.Date_Of_Last_Change,
        shipmentNumber: item.Shipment_Number,
        recipientName: item.Recipient_Name,
        poNumber: item.PO_Number,
        orderSource: item.Destination,
        unitsShipped: 0,
        shipmentCost: item.Cost_Of_Shipment + shipmentCostMarkup,
        markup: 0,
        totalCost: 0,
      }
    }

    // Increment unitsShipped
    groupedShipments[shipmentNumber].unitsShipped += item.Quantity
  })

  // Step 2: Calculate markup and totalCost
  const transformedData = Object.values(groupedShipments).map((shipment) => {
    const { orderSource, unitsShipped, shipmentCost } = shipment

    // Calculate markup based on Destination
    let markup
    if (orderSource === 'Amazon FBA') {
      markup = perUnitFBAPackAndPrep * unitsShipped
    } else if (orderSource === 'Walmart Fullfillment Services') {
      markup = perUnitWFSPackAndPrep * unitsShipped
    } else {
      markup = perOrderFee + perOrderUnitFee * unitsShipped
    }

    // Calculate total cost
    const totalCost = Number((shipmentCost + markup).toFixed(2))

    // Return new structure with calculated fields
    return {
      ...shipment,
      markup,
      totalCost,
    }
  })

  return transformedData
}

export const isWithinDateRange = (shipmentDate, start, end) => {
  // Convert all dates to a consistent format: YYYY-MM-DD
  const formattedShipmentDate = new Date(shipmentDate).toISOString().split('T')[0]
  const formattedStartDate = new Date(start).toISOString().split('T')[0]
  const formattedEndDate = new Date(end).toISOString().split('T')[0]

  // Convert the formatted dates back to timestamps
  const shipmentTime = new Date(formattedShipmentDate).getTime()
  const startTime = new Date(formattedStartDate).getTime()
  const endTime = new Date(formattedEndDate).setHours(23, 59, 59, 999)

  return shipmentTime >= startTime && shipmentTime <= endTime
}

export const formatDateInDateRange = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fetchStores = async () => {
  const res = await fetch('/app/api/shipstation/listStores')
  if (res.ok) {
    const stores = await res.json()
    return stores.map((store) => {
      return {
        marketplaceName: store.marketplaceName,
        storeId: store.storeId,
        storeName: store.storeName,
      }
    })
  } else {
    console.error('Failed to fetch stores')
  }
}

export const findStoreNameBasedOnId = (storeId, stores) => {
  if (storeId === null || storeId === undefined) {
    console.log('storeId is null or undefined')
    return ''
  }
  if (stores === null || stores === undefined) {
    console.log('Stores api call came back as null or undefined')
    return ''
  }
  const store = stores.find((store) => store.storeId === storeId)
  return store ? store.storeName : null
}

export const assignClientIdBasedOnStoreName = (storeName) => {
  // Dog Rocks categorization
  if (storeName === 'Dog Rocks Walmart') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Website') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Faire') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Amazon') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Shopify') {
    return 'operations@podiumpetproducts.com'
  }
  // Bessies Best categorization
  if (storeName === `Bessies Best Amazon`) {
    return 'jen@bessiesbest.com'
  }
  // Dr. Appleseed categorization
  if (storeName === 'Dr. Appleseed Amazon') {
    return 'drappleseedextracts@gmail.com'
  }
  if (storeName === 'Dr. Appleseed Faire') {
    return 'drappleseedextracts@gmail.com'
  }
  if (storeName === 'Dr. Appleseed Shopify') {
    return 'drappleseedextracts@gmail.com'
  }
  // Drink Ballast categorization
  if (storeName === 'Drink Ballast Wix') {
    return 'roy@drinkballast.com'
  }
  // Jewell Nursing categorization
  if (storeName === 'Jewell Nursing Website') {
    return 'support@jewellnursingsolutions.com'
  }
  // Hometown categorization
  if (storeName === 'Hometown Amazon') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown eBay') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown Walmart') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'FilterPal Shopify') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === "Rob Edward's Shopify") {
    return 'homeinddistribution@gmail.com'
  }
  return 'clientId Not Found'
}

export const formatDollarValue = (number) => {
  if (number === null || number === undefined) {
    number = 0
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number)
}

export const formatDateInSubjectLine = (date) => {
  date = new Date(`${date}T00:00:00`) // Forces the date to local time
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // January is 0, so we add 1
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export const formatDate = (date) => {
  date = new Date(date)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // January is 0, so we need to add 1
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export const abbreviateString = (str, maxLength, abbreviationSymbol = '...') => {
  if (typeof str !== 'string' || typeof maxLength !== 'number' || maxLength < 1) {
    console.log('There is no Stripe Invoice Link for this contract')
    return ''
  }

  if (str.length <= maxLength) {
    return str
  }

  const abbreviationLength = abbreviationSymbol.length
  if (maxLength < abbreviationLength + 1) {
    return str.slice(0, maxLength)
  }

  return str.slice(0, maxLength - abbreviationLength) + abbreviationSymbol
}

export const test = () => {
  console.log('TEST')
}
