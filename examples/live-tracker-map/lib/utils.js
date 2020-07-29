function RoundToFixDecimals(value, numDecimals = 5) {
  function addZero(s, size) {
    while (s.length <= (size || 2)) { s = s + "0"; }
    return s;
  }

  const temp = addZero("1", numDecimals)
  const tempNum = parseInt(temp, 10)
  return Math.round((value + Number.EPSILON) * tempNum) / tempNum
}

export {
  RoundToFixDecimals
}