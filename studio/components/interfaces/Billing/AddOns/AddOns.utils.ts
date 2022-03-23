export const formatComputeSizes = (computeSizes: any[]) => {
  // Just need to order the options - ideally if the API can filter this that'll be great
  // but for now just let FE order to get things moving quickly
  return computeSizes
    .filter((option: any) => option.name.includes('[Small]'))
    .concat(computeSizes.filter((option: any) => option.name.includes('[Medium]')))
    .concat(computeSizes.filter((option: any) => option.name.includes('[Large]')))
    .concat(computeSizes.filter((option: any) => option.name.includes('[XLarge]')))
    .concat(computeSizes.filter((option: any) => option.name.includes('[XXLarge]')))
}
