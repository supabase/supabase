import { Address4 } from 'ip-address'

const privateIPRanges = [
  new Address4('10.0.0.0/8'),
  new Address4('172.16.0.0/12'),
  new Address4('192.168.0.0/16'),
]

export const checkIfPrivate = (cidr: string) => {
  const address = new Address4(cidr)
  const res = privateIPRanges.map((range) => address.isInSubnet(range))
  return res.includes(true)
}

export const getAddressEndRange = (cidr: string) => {
  try {
    const address = new Address4(cidr)
    return { start: address.startAddress().address, end: address.endAddress().address }
  } catch (error: any) {
    return undefined
  }
}
