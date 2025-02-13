import Dinero from 'dinero.js'

export const USAGE_ITEMS = [
  'egress',
  'disk',
  'mau',
  'thirdPartyMau',
  'ssoMau',
  'storage',
  'imageTransforms',
  'functionInvocations',
  'rtMessages',
  'rtPeakConns',
] as const
export type UsageItem = (typeof USAGE_ITEMS)[number]

export const TIERS = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const
export type Tier = (typeof TIERS)[keyof typeof TIERS]

class Unit {
  constructor(
    private single: string,
    private plural: string,
    private singleLong?: string,
    private pluralLong?: string
  ) {}

  toFormatted(amt: number, long?: boolean) {
    if (amt === 1) {
      return long ? this.singleLong : this.single
    } else {
      return long ? this.pluralLong : this.plural
    }
  }
}

const GB = new Unit('GB', 'GB')
const MB = new Unit('MB', 'MB')
const MAU = new Unit('MAU', 'MAU', 'monthly active user', 'monthly active users')
const million = new Unit('million', 'million')

class UnitValue {
  constructor(
    private value: number,
    private unit?: Unit,
    private modifier?: string
  ) {}

  toString(options?: { longFormat?: boolean }) {
    return `${Intl.NumberFormat().format(this.value)}${this.unit ? ` ${this.unit.toFormatted(this.value, options?.longFormat)} ` : ''}${this.modifier ? ` ${this.modifier}` : ''}`
  }

  toStringOmitSingle() {
    if (this.unit && this.value === 1) {
      return `${this.unit.toFormatted(this.value)}${this.modifier ? ` ${this.modifier}` : ''}`
    }
    return this.toString()
  }
}

export function createUnitValue(value: number, unit?: Unit, modifier?: string) {
  return new UnitValue(value, unit, modifier)
}

interface Quota {
  base: UnitValue
  overage?: {
    price: Dinero.Dinero
    units: UnitValue
  }
}

const UNAVAILABLE = 'UNAVAILABLE' as const
type Unavailable = typeof UNAVAILABLE

const CUSTOM = 'CUSTOM' as const
type Custom = typeof CUSTOM

export const QUOTAS: Record<UsageItem, Record<Tier, Quota | Custom | Unavailable>> = {
  egress: {
    [TIERS.FREE]: {
      base: createUnitValue(5, GB),
    },
    [TIERS.PRO]: {
      base: createUnitValue(250, GB),
      overage: {
        price: Dinero({ amount: 9 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(250, GB),
      overage: {
        price: Dinero({ amount: 9 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  disk: {
    [TIERS.FREE]: {
      base: createUnitValue(500, MB),
    },
    [TIERS.PRO]: {
      base: createUnitValue(8, GB, 'disk per project'),
      overage: {
        price: Dinero({ amount: 125, precision: 3 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(8, GB),
      overage: {
        price: Dinero({ amount: 125, precision: 3 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  mau: {
    [TIERS.FREE]: {
      base: createUnitValue(50_000, MAU),
    },
    [TIERS.PRO]: {
      base: createUnitValue(100_000, MAU),
      overage: {
        price: Dinero({ amount: 325, precision: 5 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(100_000, MAU),
      overage: {
        price: Dinero({ amount: 325, precision: 5 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  thirdPartyMau: {
    [TIERS.FREE]: {
      base: createUnitValue(50, MAU),
    },
    [TIERS.PRO]: {
      base: createUnitValue(50, MAU),
      overage: {
        price: Dinero({ amount: 325, precision: 5 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(50, MAU),
      overage: {
        price: Dinero({ amount: 325, precision: 5 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  ssoMau: {
    [TIERS.FREE]: UNAVAILABLE,
    [TIERS.PRO]: {
      base: createUnitValue(50, MAU),
      overage: {
        price: Dinero({ amount: 15, precision: 3 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(50, MAU),
      overage: {
        price: Dinero({ amount: 15, precision: 3 }),
        units: createUnitValue(1, MAU),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  storage: {
    [TIERS.FREE]: {
      base: createUnitValue(1, GB),
    },
    [TIERS.PRO]: {
      base: createUnitValue(100, GB),
      overage: {
        price: Dinero({ amount: 21, precision: 3 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(100, GB),
      overage: {
        price: Dinero({ amount: 21, precision: 3 }),
        units: createUnitValue(1, GB),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  imageTransforms: {
    [TIERS.FREE]: UNAVAILABLE,
    [TIERS.PRO]: {
      base: createUnitValue(100),
      overage: {
        price: Dinero({ amount: 5, precision: 0 }),
        units: createUnitValue(1000),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(100),
      overage: {
        price: Dinero({ amount: 5, precision: 0 }),
        units: createUnitValue(1000),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  functionInvocations: {
    [TIERS.FREE]: {
      base: createUnitValue(500_000),
    },
    [TIERS.PRO]: {
      base: createUnitValue(2, million),
      overage: {
        price: Dinero({ amount: 2, precision: 0 }),
        units: createUnitValue(1, million),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(2, million),
      overage: {
        price: Dinero({ amount: 2, precision: 0 }),
        units: createUnitValue(1, million),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  rtMessages: {
    [TIERS.FREE]: {
      base: createUnitValue(2, million),
    },
    [TIERS.PRO]: {
      base: createUnitValue(5, million),
      overage: {
        price: Dinero({ amount: 25, precision: 1 }),
        units: createUnitValue(1, million),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(5, million),
      overage: {
        price: Dinero({ amount: 25, precision: 1 }),
        units: createUnitValue(1, million),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
  rtPeakConns: {
    [TIERS.FREE]: {
      base: createUnitValue(200),
    },
    [TIERS.PRO]: {
      base: createUnitValue(500),
      overage: {
        price: Dinero({ amount: 10, precision: 0 }),
        units: createUnitValue(1000),
      },
    },
    [TIERS.TEAM]: {
      base: createUnitValue(500),
      overage: {
        price: Dinero({ amount: 10, precision: 0 }),
        units: createUnitValue(1000),
      },
    },
    [TIERS.ENTERPRISE]: CUSTOM,
  },
}
