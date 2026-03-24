const LIGHT_SCALE_LIGHTNESS = [98.8, 97.3, 95.3, 92.9, 91, 88.6, 85.9, 78, 56.1, 52.2, 43.5, 9]
const DARK_SCALE_LIGHTNESS = [8.6, 11, 13.7, 15.7, 18, 20.4, 24.3, 31.4, 43.9, 49.4, 62.7, 92.9]

const buildScale = (lightnesses) =>
  Object.fromEntries(
    lightnesses.map((lightness, index) => [
      `scale${index + 1}`,
      `hsl(var(--neutral-hue) var(--neutral-saturation) ${lightness}%)`,
    ])
  )

module.exports = {
  brand: {
    brand1: 'hsla(153, 80%, 99%, 1)',
    brand2: 'hsla(148, 88%, 97%, 1)',
    brand3: 'hsla(148, 76%, 95%, 1)',
    brand4: 'hsla(148, 68%, 92%, 1)',
    brand5: 'hsla(148, 59%, 88%, 1)',
    brand6: 'hsla(149, 43%, 82%, 1)',
    brand7: 'hsla(149, 43%, 69%, 1)',
    brand8: 'hsla(154, 55%, 45%, 1)',
    brand9: 'hsla(153, 60%, 53%, 1)',
    brand10: 'hsla(153, 50%, 50%, 1)',
    brand11: 'hsla(153, 50%, 34%, 1)',
    brand12: 'hsla(153, 40%, 12%, 1)',
  },
  brandDark: {
    brand1: 'hsla(153, 75%, 6%, 1)',
    brand2: 'hsla(153, 73%, 7%, 1)',
    brand3: 'hsla(154, 69%, 9%, 1)',
    brand4: 'hsla(154, 67%, 11%, 1)',
    brand5: 'hsla(154, 66%, 13%, 1)',
    brand6: 'hsla(154, 64%, 17%, 1)',
    brand7: 'hsla(154, 62%, 22%, 1)',
    brand8: 'hsla(153, 60%, 28%, 1)',
    brand9: 'hsla(153, 60%, 53%, 1)',
    brand10: 'hsla(153, 60%, 70%, 1)',
    brand11: 'hsla(153, 60%, 50%, 1)',
    brand12: 'hsla(153, 60%, 95%, 1)',
  },
  contrast: {
    'brand-hiContrast': 'hsl(var(--brand-default))',
    'brand-loContrast': 'hsl(var(--brand-300))',
  },
  scale: buildScale(LIGHT_SCALE_LIGHTNESS),
  scaleDark: buildScale(DARK_SCALE_LIGHTNESS),
}
