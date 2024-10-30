export const csvGenerator = (totalData, actualHeaderKey, headerToShow, fileName) => {
  let data = totalData || null;
  if (data == null || !data.length) {
    return null;
  }
  let columnDelimiter = ',';
  let lineDelimiter = '\n';
  let keys = headerToShow;
  let result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;
  data.forEach(function (item) {
    let ctr = 0;
    actualHeaderKey.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter;
      if (Array.isArray(item[key])) {
        let arrayItem =
          item[key] && item[key].length > 0
            ? '"' + item[key].join(',') + '"'
            : '-';
        result += arrayItem;
      } else if (typeof item[key] == 'string') {
        let strItem = item[key] ? '"' + item[key] + '"' : '-';
        result += strItem ? strItem.replace(/\s{2,}/g, ' ') : strItem;
      } else {
        let strItem = item[key] + '';
        result += strItem ? strItem.replace(/,/g, '') : strItem;
      }

      ctr++;
    });
    result += lineDelimiter;
  });

  if (result == null) return;

  var blob = new Blob([result]);
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    var hiddenElement = window.document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
    hiddenElement.target = '_blank';
    hiddenElement.download = fileName;
    hiddenElement.click();
  } else {
    let link = document.createElement('a');
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export const generateShipmentLineItems = (shipments, perOrderFee, perOrderUnitFee, perUnitFBAPackAndPrep, perUnitWFSPackAndPrep, b2bFreightPercentageMarkup) => {
  const groupedShipments = {};

  // Step 1: Group items by Shipment_Number
  shipments.forEach(item => {
    const shipmentNumber = item.Shipment_Number;
    const shipmentCostMarkup = (b2bFreightPercentageMarkup / 100) * item.Cost_Of_Shipment

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
        totalCost: 0
      };
    }

    // Increment unitsShipped
    groupedShipments[shipmentNumber].unitsShipped += item.Quantity;
  });

  // Step 2: Calculate markup and totalCost
  const transformedData = Object.values(groupedShipments).map(shipment => {
    const { orderSource, unitsShipped, shipmentCost } = shipment;

    // Calculate markup based on Destination
    let markup;
    if (orderSource === 'Amazon FBA') {
      markup = perUnitFBAPackAndPrep * unitsShipped;
    } else if (orderSource === 'Walmart Fulfillment Services') {
      markup = perUnitWFSPackAndPrep * unitsShipped;
    } else {
      markup = perOrderFee + (perOrderUnitFee * unitsShipped);
    }

    // Calculate total cost
    const totalCost = shipmentCost + markup;

    // Return new structure with calculated fields
    return {
      ...shipment,
      markup,
      totalCost
    };
  });

  return transformedData;
}

export const isWithinDateRange = (shipmentDate, start, end) => {
  // Parse the dates to ensure we compare them as date objects
  const shipmentTime = new Date(shipmentDate).getTime();

  // Set start time to the beginning of the day (00:00:00.000)
  const startTime = new Date(new Date(start).setHours(0, 0, 0, 0)).getTime();

  // Set end time to the end of the day (23:59:59.999) + 1 ms
  const endTime = new Date(new Date(end).setHours(23, 59, 59, 999)).getTime() + 1;

  return shipmentTime >= startTime && shipmentTime <= endTime;
};

export const formatDateInDateRange = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fetchStores = async () => {
  const res = await fetch('/app/api/shipstation/listStores');
  if (res.ok) {
    const stores = await res.json();
    return stores.map(store => {
      return {
        marketplaceName: store.marketplaceName,
        storeId: store.storeId,
        storeName: store.storeName
      }
    })
  } else {
    console.error('Failed to fetch stores');
  }
}

export const findStoreNameBasedOnId = (storeId, stores) => {
  if (storeId === null || storeId === undefined) {
    console.log("storeId is null or undefined")
    return ""
  }
  if (stores === null || stores === undefined) {
    console.log("Stores api call came back as null or undefined")
    return ""
  }
  const store = stores.find(store => store.storeId === storeId);
  return store ? store.storeName : null;
}

export const assignClientIdBasedOnStoreName = (storeName) => {
  // Dog Rocks categorization
  if (storeName === 'Dog Rocks Walmart') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Website') {
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
  }).format(number);
};

export const formatDate = (date) => {
  date = new Date(date)
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0, so we need to add 1
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export const abbreviateString = (str, maxLength, abbreviationSymbol = '...') => {
  if (typeof str !== 'string' || typeof maxLength !== 'number' || maxLength < 1) {
    console.log('There is no Stripe Invoice Link for this contract')
    return ''
  }

  if (str.length <= maxLength) {
    return str;
  }

  const abbreviationLength = abbreviationSymbol.length;
  if (maxLength < abbreviationLength + 1) {
    return str.slice(0, maxLength);
  }

  return str.slice(0, maxLength - abbreviationLength) + abbreviationSymbol;
}

export const test = () => {
  console.log("TEST")
}