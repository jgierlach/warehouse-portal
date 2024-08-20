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