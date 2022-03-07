import { STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS } from 'lib/constants'

// Temp hard-code, should fetch all available add ons from API
export const COMPUTE_SIZES = [
  {
    id: STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS.SMALL,
    name: 'Small',
    description: 'Great for personal projects and experiments',
    specs: '2 CPUs • 1GB memory • 2,085Mbps Disk IO',
    price: 0,
  },
  {
    id: STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS.MEDIUM,
    name: 'Medium',
    description: 'Great for projects that are starting to gain traction',
    specs: '2 CPUs • 4GB memory • 2,085Mbps Disk IO',
    price: 50,
  },
  {
    id: STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS.LARGE,
    name: 'Large',
    description: 'For a large project that receives a decent amount of traffic',
    specs: '2 CPUs • 8GB memory • 4,750Mbps Disk IO',
    price: 100,
  },
  {
    id: STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS.XLARGE,
    name: 'X-Large',
    description: 'For a large project that receives a sizeable amount of traffic',
    specs: '4 CPUs • 16GB memory • 4,750Mbps Disk IO',
    price: 200,
  },
  {
    id: STRIPE_COMPUTE_SIZE_ADD_ON_PRICE_IDS.XXLARGE,
    name: 'XX-Large',
    description: 'For a huge project that receives heavy amount of traffic',
    specs: '8 CPUs • 32GB memory • 4,750Mbps Disk IO',
    price: 400,
  },
]
