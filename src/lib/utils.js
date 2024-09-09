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
  if (storeName === 'Dog Rocks Walmart') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Website') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Drink Ballast') {
    return 'roy@drinkballast.com'
  }
  if (storeName === 'Hometown Amazon') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown eBay') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown Walmart') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Jewell Nursing Website') {
    return 'support@jewellnursingsolutions.com'
  }
  return 'clientId Not Found'
}

export const formatDollarValue = (number) => {
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