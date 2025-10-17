import type { WeaponType, Projectile, Player, Enemy } from './types'

const GLOBAL_SCOPE = 'global'

type HandlerScope = WeaponType | typeof GLOBAL_SCOPE

// Event contexts - rich state passed to event handlers
export interface OnDamageContext {
  weaponType: WeaponType
  damageDealt: number
  enemy: Enemy
  projectile: Projectile
  player: Player
  wasLethal: boolean
}

export type SpawnProjectileOptions = Omit<Projectile, 'id'> & {
  id?: string
}

export interface OnEnemyDeathContext {
  enemy: Enemy
  player: Player
  projectile: Projectile
  weaponType: WeaponType
  enemies: ReadonlyArray<Enemy>
  currentTime: number
  spawnProjectile: (projectile: SpawnProjectileOptions) => void
}

export interface OnShootContext {
  weaponType: WeaponType
  player: Player
  projectileCount: number
}

// Event handler return types
export interface OnDamageResult {
  shouldRemoveProjectile?: boolean
  healAmount?: number
  additionalDamage?: number
}

export interface OnEnemyDeathResult {
  healAmount?: number
  spawnProjectiles?: number
  // Removed explosionRadius and explosionDamage - items handle effects directly via context
}

// Event handler function types
export type OnDamageHandler = (context: OnDamageContext) => OnDamageResult | void
export type OnEnemyDeathHandler = (context: OnEnemyDeathContext) => OnEnemyDeathResult | void
export type OnShootHandler = (context: OnShootContext) => void

// Event handlers that items can implement
export interface EventHandlers {
  onDamage?: OnDamageHandler
  onEnemyDeath?: OnEnemyDeathHandler
  onShoot?: OnShootHandler
}

interface DamageAggregation extends Required<Pick<OnDamageResult, 'healAmount' | 'additionalDamage'>> {
  shouldRemoveProjectile: boolean | null
}

interface EnemyDeathAggregation extends Required<Pick<OnEnemyDeathResult, 'healAmount'>> {}

function createAggregation(): DamageAggregation {
  return {
    healAmount: 0,
    additionalDamage: 0,
    shouldRemoveProjectile: null,
  }
}

export class GameEventBus {
  private readonly damageHandlers = new Map<HandlerScope, Set<OnDamageHandler>>()
  private readonly enemyDeathHandlers = new Map<HandlerScope, Set<OnEnemyDeathHandler>>()
  private readonly shootHandlers = new Map<HandlerScope, Set<OnShootHandler>>()

  onDamage(handler: OnDamageHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.damageHandlers, handler, weaponType)
  }

  onEnemyDeath(handler: OnEnemyDeathHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.enemyDeathHandlers, handler, weaponType)
  }

  onShoot(handler: OnShootHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.shootHandlers, handler, weaponType)
  }

  emitDamage(weaponType: WeaponType, context: OnDamageContext): DamageAggregation {
    const aggregated = createAggregation()
    this.collectResults(this.damageHandlers, weaponType, context, (handler) => {
      const result = handler(context)
      if (!result) return
      aggregated.healAmount += result.healAmount || 0
      aggregated.additionalDamage += result.additionalDamage || 0
      if (result.shouldRemoveProjectile !== undefined) {
        aggregated.shouldRemoveProjectile = result.shouldRemoveProjectile
      }
    })
    return aggregated
  }

  emitEnemyDeath(weaponType: WeaponType, context: OnEnemyDeathContext): EnemyDeathAggregation {
    const aggregated: EnemyDeathAggregation = {
      healAmount: 0,
    }
    this.collectResults(this.enemyDeathHandlers, weaponType, context, (handler) => {
      const result = handler(context)
      if (!result) return
      aggregated.healAmount += result.healAmount || 0
    })
    return aggregated
  }

  emitShoot(weaponType: WeaponType, context: OnShootContext): void {
    this.collectResults(this.shootHandlers, weaponType, context, (handler) => {
      handler(context)
    })
  }

  clear() {
    this.damageHandlers.clear()
    this.enemyDeathHandlers.clear()
    this.shootHandlers.clear()
  }

  private attachHandler<T>(
    store: Map<HandlerScope, Set<T>>,
    handler: T,
    weaponType?: WeaponType
  ): () => void {
    const scope: HandlerScope = weaponType ?? GLOBAL_SCOPE
    const handlers = store.get(scope) ?? new Set<T>()
    handlers.add(handler)
    store.set(scope, handlers)
    return () => {
      const scoped = store.get(scope)
      if (!scoped) return
      scoped.delete(handler)
      if (scoped.size === 0) {
        store.delete(scope)
      }
    }
  }

  private collectResults<TContext>(
    store: Map<HandlerScope, Set<(context: TContext) => unknown>>,
    weaponType: WeaponType,
    context: TContext,
    invoke: (handler: (context: TContext) => unknown) => void
  ) {
    const scopes: HandlerScope[] = [GLOBAL_SCOPE, weaponType]
    scopes.forEach((scope) => {
      const handlers = store.get(scope)
      if (!handlers) return
      handlers.forEach((handler) => invoke(handler))
    })
  }
}
