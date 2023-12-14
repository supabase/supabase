// export default function () {
//   const randomNumber = Math.floor(Math.random() * 26) + Date.now()
//   return randomNumber.toString()
// }

export function generateUID() {
  // I generate the UID from two parts here
  // to ensure the random number provide enough bits.
  var firstPart = (Math.random() * 46656) | 0
  var secondPart = (Math.random() * 46656) | 0
  const newFirstPart = ('00000' + firstPart.toString(36)).slice(-3)
  const newSecondPart = ('00000' + secondPart.toString(36)).slice(-3)
  return newFirstPart + newSecondPart
}
