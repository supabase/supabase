import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks/useParams'
import { CookbookRecipeExecutor } from 'components/interfaces/Cookbook/CookbookRecipeExecutor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Loader2, AlertCircle } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import type { CookbookRecipe } from 'types/cookbook'

const CookbookRecipePage: NextPageWithLayout = () => {
  const { ref, recipeSlug } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [recipe, setRecipe] = useState<CookbookRecipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recipeSlug) return

    const fetchRecipe = async () => {
      setLoading(true)
      setError(null)

      try {
        // Construct URL from recipeSlug
        // You can customize this URL pattern based on where recipes are hosted
        const recipeUrl = `https://idglwaxxhycmeyjvbbbr.supabase.co/storage/v1/object/public/cookbook/${recipeSlug}.json`

        const response = await fetch(recipeUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch recipe: ${response.statusText}`)
        }

        const data: CookbookRecipe = await response.json()
        setRecipe(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load recipe')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [recipeSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
          <p className="text-sm text-foreground-light">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-medium mb-1">Failed to Load Recipe</h3>
            <p className="text-sm text-foreground-light">{error || 'Recipe not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CookbookRecipeExecutor
      recipe={recipe}
      projectRef={ref!}
      connectionString={project?.connectionString}
    />
  )
}

CookbookRecipePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default CookbookRecipePage
