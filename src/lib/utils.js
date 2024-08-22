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