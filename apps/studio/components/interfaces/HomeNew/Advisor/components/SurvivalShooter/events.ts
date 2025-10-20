import type { WeaponType, Projectile, Player, Enemy, Vector2 } from './types'

const GLOBAL_SCOPE = 'global'

type HandlerScope = WeaponType | typeof GLOBAL_SCOPE

// Projectile behavior and rendering types (used by items that spawn custom projectiles)
export type ProjectileRenderFunction = (
  projectile: Projectile,
  renderCtx: { ctx: CanvasRenderingContext2D; playerPosition: Vector2; isDark: boolean }
) => void

export type ProjectileBehaviorFunction = (
  projectile: any, // RuntimeProjectile, but we can't import it here to avoid circular deps
  ctx: {
    deltaTime: number
    currentTime: number
    runtime: any // GameRuntime
  }
) => boolean

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
  render?: ProjectileRenderFunction
  behavior?: ProjectileBehaviorFunction
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

export interface OnPlayerUpdateContext {
  player: Player
  deltaTime: number
  currentTime: number
}

export interface OnPlayerMoveContext {
  player: Player
  oldPosition: { x: number; y: number }
  newPosition: { x: number; y: number }
  deltaTime: number
}

export interface OnPlayerDamagedContext {
  player: Player
  damageAmount: number
  enemy: Enemy
  currentTime: number
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

export interface OnPlayerUpdateResult {
  healAmount?: number // regen or other healing effects
}

export interface OnPlayerDamagedResult {
  damageReduction?: number // flat reduction
  damageMultiplier?: number // 0.5 = half damage, 2.0 = double damage
  reflectDamage?: number // damage to reflect back to enemies
}

// Event handler function types
export type OnDamageHandler = (context: OnDamageContext) => OnDamageResult | void
export type OnEnemyDeathHandler = (context: OnEnemyDeathContext) => OnEnemyDeathResult | void
export type OnShootHandler = (context: OnShootContext) => void
export type OnPlayerUpdateHandler = (context: OnPlayerUpdateContext) => OnPlayerUpdateResult | void
export type OnPlayerMoveHandler = (context: OnPlayerMoveContext) => void
export type OnPlayerDamagedHandler = (context: OnPlayerDamagedContext) => OnPlayerDamagedResult | void

// Event handlers that items can implement
export interface EventHandlers {
  onDamage?: OnDamageHandler
  onEnemyDeath?: OnEnemyDeathHandler
  onShoot?: OnShootHandler
  onPlayerUpdate?: OnPlayerUpdateHandler
  onPlayerMove?: OnPlayerMoveHandler
  onPlayerDamaged?: OnPlayerDamagedHandler
}

interface DamageAggregation extends Required<Pick<OnDamageResult, 'healAmount' | 'additionalDamage'>> {
  shouldRemoveProjectile: boolean | null
}

interface EnemyDeathAggregation extends Required<Pick<OnEnemyDeathResult, 'healAmount'>> {}

interface PlayerUpdateAggregation extends Required<Pick<OnPlayerUpdateResult, 'healAmount'>> {}

interface PlayerDamagedAggregation {
  damageReduction: number
  damageMultiplier: number
  reflectDamage: number
}

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
  private readonly playerUpdateHandlers = new Map<HandlerScope, Set<OnPlayerUpdateHandler>>()
  private readonly playerMoveHandlers = new Map<HandlerScope, Set<OnPlayerMoveHandler>>()
  private readonly playerDamagedHandlers = new Map<HandlerScope, Set<OnPlayerDamagedHandler>>()

  onDamage(handler: OnDamageHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.damageHandlers, handler, weaponType)
  }

  onEnemyDeath(handler: OnEnemyDeathHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.enemyDeathHandlers, handler, weaponType)
  }

  onShoot(handler: OnShootHandler, weaponType?: WeaponType): () => void {
    return this.attachHandler(this.shootHandlers, handler, weaponType)
  }

  onPlayerUpdate(handler: OnPlayerUpdateHandler): () => void {
    return this.attachHandler(this.playerUpdateHandlers, handler)
  }

  onPlayerMove(handler: OnPlayerMoveHandler): () => void {
    return this.attachHandler(this.playerMoveHandlers, handler)
  }

  onPlayerDamaged(handler: OnPlayerDamagedHandler): () => void {
    return this.attachHandler(this.playerDamagedHandlers, handler)
  }

  emitDamage(weaponType: WeaponType, context: OnDamageContext): DamageAggregation {
    const aggregated = createAggregation()
    this.collectResults(this.damageHandlers, weaponType, context, (handler) => {
      const result = handler(context)
      if (!result) return
      aggregated.healAmount += result.healAmount ?? 0
      aggregated.additionalDamage += result.additionalDamage ?? 0
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
      aggregated.healAmount += result.healAmount ?? 0
    })
    return aggregated
  }

  emitShoot(weaponType: WeaponType, context: OnShootContext): void {
    this.collectResults(this.shootHandlers, weaponType, context, (handler) => {
      handler(context)
    })
  }

  emitPlayerUpdate(context: OnPlayerUpdateContext): PlayerUpdateAggregation {
    const aggregated: PlayerUpdateAggregation = {
      healAmount: 0,
    }
    // Player events don't use weapon-specific scoping, only global
    const handlers = this.playerUpdateHandlers.get(GLOBAL_SCOPE)
    if (!handlers) return aggregated

    handlers.forEach((handler) => {
      const result = handler(context)
      if (!result) return
      aggregated.healAmount += result.healAmount ?? 0
    })
    return aggregated
  }

  emitPlayerMove(context: OnPlayerMoveContext): void {
    const handlers = this.playerMoveHandlers.get(GLOBAL_SCOPE)
    if (!handlers) return
    handlers.forEach((handler) => handler(context))
  }

  emitPlayerDamaged(context: OnPlayerDamagedContext): PlayerDamagedAggregation {
    const aggregated: PlayerDamagedAggregation = {
      damageReduction: 0,
      damageMultiplier: 1,
      reflectDamage: 0,
    }
    const handlers = this.playerDamagedHandlers.get(GLOBAL_SCOPE)
    if (!handlers) return aggregated

    handlers.forEach((handler) => {
      const result = handler(context)
      if (!result) return
      aggregated.damageReduction += result.damageReduction ?? 0
      if (result.damageMultiplier !== undefined) {
        aggregated.damageMultiplier *= result.damageMultiplier
      }
      aggregated.reflectDamage += result.reflectDamage ?? 0
    })
    return aggregated
  }

  clear() {
    this.damageHandlers.clear()
    this.enemyDeathHandlers.clear()
    this.shootHandlers.clear()
    this.playerUpdateHandlers.clear()
    this.playerMoveHandlers.clear()
    this.playerDamagedHandlers.clear()
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
