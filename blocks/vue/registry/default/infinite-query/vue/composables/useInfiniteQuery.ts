import { PostgrestQueryBuilder, type PostgrestClientOptions } from '@supabase/postgrest-js'
import { type SupabaseClient } from '@supabase/supabase-js'
import { computed, onMounted, reactive, toRefs, watch } from 'vue'

// @ts-ignore
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type SupabaseClientType = typeof supabase

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N

type Database =
  SupabaseClientType extends SupabaseClient<infer U>
    ? IfAny<
        U,
        {
          public: {
            Tables: Record<string, any>
            Views: Record<string, any>
            Functions: Record<string, any>
          }
        },
        U
      >
    : {
        public: {
          Tables: Record<string, any>
          Views: Record<string, any>
          Functions: Record<string, any>
        }
      }

type DatabaseSchema = Database['public']
type SupabaseTableName = keyof DatabaseSchema['Tables']
type SupabaseTableData<T extends SupabaseTableName> = DatabaseSchema['Tables'][T]['Row']

type DefaultClientOptions = PostgrestClientOptions

type SupabaseSelectBuilder<T extends SupabaseTableName> = ReturnType<
  PostgrestQueryBuilder<
    DefaultClientOptions,
    DatabaseSchema,
    DatabaseSchema['Tables'][T],
    T
  >['select']
>

export type SupabaseQueryHandler<T extends SupabaseTableName> = (
  query: SupabaseSelectBuilder<T>
) => SupabaseSelectBuilder<T>

export interface UseInfiniteQueryProps<T extends SupabaseTableName> {
  tableName: T
  columns?: string
  pageSize?: number
  trailingQuery?: SupabaseQueryHandler<T>
}

interface State<TData> {
  data: TData[]
  count: number
  isSuccess: boolean
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  hasInitialFetch: boolean
  requestCounter: number
}

// --------------------
// Composable
// --------------------

export function useInfiniteQuery<
  TData extends SupabaseTableData<T>,
  T extends SupabaseTableName = SupabaseTableName,
>(props: UseInfiniteQueryProps<T>) {
  const state = reactive<State<TData>>({
    data: [],
    count: 0,
    isSuccess: false,
    isLoading: false,
    isFetching: false,
    error: null,
    hasInitialFetch: false,
    requestCounter: 0,
  })

  const pageSize = computed(() => props.pageSize ?? 20)
  const columns = computed(() => props.columns ?? '*')

  const fetchPage = async (skip: number) => {
    // Capture the current request token to validate this request later
    const requestToken = state.requestCounter

    if (state.hasInitialFetch && (state.isFetching || state.data.length >= state.count)) {
      return
    }

    // Early return if request has been invalidated
    if (requestToken !== state.requestCounter) {
      return
    }

    state.isFetching = true

    let query = supabase
      .from(props.tableName)
      .select(columns.value, { count: 'exact' }) as unknown as SupabaseSelectBuilder<T>

    if (props.trailingQuery) {
      query = props.trailingQuery(query)
    }

    const { data, count, error } = await query.range(skip, skip + pageSize.value - 1)

    // Verify that this request is still valid before mutating state
    if (requestToken !== state.requestCounter) {
      state.isFetching = false
      return
    }

    if (error) {
      console.error(error)
      state.error = error
    } else {
      state.data.push(...(data as TData[]))
      state.count = count || 0
      state.isSuccess = true
      state.error = null
    }

    state.isFetching = false
  }

  const fetchNextPage = async () => {
    if (state.isFetching) return
    await fetchPage(state.data.length)
  }

  const reset = () => {
    state.data = []
    state.count = 0
    state.isSuccess = false
    state.error = null
    state.hasInitialFetch = false
    state.isFetching = false
    state.requestCounter++
  }

  const initialize = async () => {
    state.isLoading = true
    reset()

    await fetchNextPage()

    state.isLoading = false
    state.hasInitialFetch = true
  }

  // React-style deps → Vue watch
  watch(
    () => [props.tableName, props.columns, props.pageSize],
    () => {
      if (state.hasInitialFetch) {
        initialize()
      }
    }
  )

  onMounted(() => {
    if (!state.hasInitialFetch) {
      initialize()
    }
  })

  const hasMore = computed(() => state.count > state.data.length)

  return {
    ...toRefs(state),
    hasMore,
    fetchNextPage,
    refresh: initialize,
  }
}
