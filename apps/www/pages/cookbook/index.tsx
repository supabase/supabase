import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { motion } from 'framer-motion'
import { Search, Database, Code, X } from 'lucide-react'

import { Button, Input } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import RecipeDialog from '~/components/RecipeDialog'
import recipesData from '~/data/recipes.json'

type RecipeType = 'query' | 'edge-function'

interface Recipe {
  id: string
  title: string
  description: string
  type: RecipeType
  code: string
}

interface Category {
  id: string
  title: string
  description: string
  items: Recipe[]
}

function CookbookPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Convert recipes data to array format
  const recipes = Object.values(recipesData) as Category[]

  // Handle URL parameters for direct recipe loading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const recipeId = params.get('recipe')
    const categories = params.get('categories')

    if (recipeId) {
      const categoryId = recipeId.split('-')[0]
      const category = recipesData[categoryId as keyof typeof recipesData]
      if (category) {
        const recipe = category.items.find((item) => item.id === recipeId)
        if (recipe) {
          setSelectedRecipe(recipe as Recipe)
        }
      }
    }

    if (categories) {
      setSelectedCategories(categories.split(','))
    }
  }, [])

  // Update URL when recipe is selected/deselected
  const handleRecipeSelect = (recipe: Recipe | null) => {
    setSelectedRecipe(recipe)
    const params = new URLSearchParams(window.location.search)

    if (recipe) {
      params.set('recipe', recipe.id)
    } else {
      params.delete('recipe')
    }

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    )
  }

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    let newCategories: string[]

    if (selectedCategories.includes(categoryId)) {
      // Remove category if already selected
      newCategories = selectedCategories.filter((id) => id !== categoryId)
    } else {
      // Add category if not selected
      newCategories = [...selectedCategories, categoryId]
    }

    setSelectedCategories(newCategories)
    const params = new URLSearchParams(window.location.search)

    if (newCategories.length > 0) {
      params.set('categories', newCategories.join(','))
    } else {
      params.delete('categories')
    }

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    )
  }

  // Clear all selected categories
  const handleClearCategories = () => {
    setSelectedCategories([])
    const params = new URLSearchParams(window.location.search)
    params.delete('categories')
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    )
  }

  // Filter recipes based on search term and selected category
  const filteredRecipes = recipes
    .filter(
      (category) => selectedCategories.length === 0 || selectedCategories.includes(category.id)
    )
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0)

  return (
    <>
      <NextSeo
        title="The Supabase Cookbook"
        description="Quickly add functionality to your existing project or spin up new projects based on an existing recipe."
      />
      <DefaultLayout>
        <SectionContainer className="!py-0 sm:!px-0">
          <div className="border border-muted rounded-xl bg-alternative my-4 px-6 py-8 md:py-10 lg:px-16 lg:py-20 xl:px-20">
            <motion.div
              className="mx-auto sm:max-w-xl text-center flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
            >
              <h1 className="h1 text-foreground !m-0">The Supabase cookbook</h1>
              <p className="text-foreground-light text-base">
                Quickly add functionality to your existing project or spin up new projects based on
                an existing recipe.
              </p>
            </motion.div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="max-w-md mx-auto w-full">
                <Input
                  icon={<Search size="14" />}
                  size="small"
                  autoComplete="off"
                  type="search"
                  placeholder="Search recipes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full [&_input]:text-base [&_input]:md:text-sm [&_input]:!leading-4"
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {selectedCategories.length > 0 && (
                  <Button
                    type="default"
                    size="tiny"
                    onClick={handleClearCategories}
                    icon={<X size={12} />}
                  >
                    Clear filters
                  </Button>
                )}
                {recipes.map((category) => (
                  <Button
                    key={category.id}
                    type={selectedCategories.includes(category.id) ? 'primary' : 'default'}
                    size="tiny"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.title}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-12">
              {filteredRecipes.map((category) => (
                <div key={category.id}>
                  <div className="mb-6">
                    <h2 className="text-xl text-foreground mb-1">{category.title}</h2>
                    <p className="text-sm text-foreground-light">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.items.map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => handleRecipeSelect(recipe)}
                        className="text-left w-full focus-visible:ring-2 focus-visible:ring-foreground-lighter outline-none"
                      >
                        <Panel>
                          <div className="flex flex-col gap-3 p-5 h-full">
                            <div className="flex items-center justify-between">
                              <div className="p-2 bg-alternative rounded">
                                {recipe.type === 'edge-function' ? (
                                  <Code size={20} strokeWidth={1.5} />
                                ) : (
                                  <Database size={20} strokeWidth={1.5} />
                                )}
                              </div>
                              <div className="text-xs uppercase text-foreground-lighter">
                                {recipe.type === 'edge-function' ? 'Edge Function' : 'Query'}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-foreground mb-1">
                                {recipe.title}
                              </h3>
                              <p className="text-sm text-foreground-light">{recipe.description}</p>
                            </div>
                          </div>
                        </Panel>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>

        <RecipeDialog recipe={selectedRecipe} onClose={() => handleRecipeSelect(null)} />
      </DefaultLayout>
    </>
  )
}

export default CookbookPage
