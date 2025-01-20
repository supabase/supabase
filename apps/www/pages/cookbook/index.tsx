import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { motion } from 'framer-motion'
import { Search, Database, Code, Clock } from 'lucide-react'

import { Button, Input, Card, CardContent } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import RecipeDialog from '~/components/RecipeDialog'
import recipesData from '~/data/recipes.json'

type RecipeType = 'query' | 'edge-function' | 'cron'

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
        <SectionContainer className="!pb-0 flex items-center">
          <motion.div className="w-1/2">
            <span className="text-brand-600 dark:text-brand font-mono uppercase block mb-4">
              Supabase Cookbook
            </span>
            <h1 className="text-3xl md:text-5xl tracking-[-.5px] max-w-lg mb-4">
              Add functionality to your project
            </h1>
            <p className="text-foreground-light block lg:text-lg mb-8">
              Quickly add functionality to your existing project or spin up new projects based on an
              existing recipe.
            </p>
            <Input
              icon={<Search size="14" />}
              size="large"
              autoComplete="off"
              type="search"
              placeholder="Search recipes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </motion.div>
          <svg
            className="h-auto w-full max-w-[360px] md:max-w-[488px] mx-auto mb-16 -rotate-45 py-16 pt-32 translate-y-12"
            viewBox="0 0 475 152"
            fill="none"
          >
            <path
              d="m391.957 146.204-35.176-65.911a8.743 8.743 0 0 1 0-8.281l35.176-65.911c1.663-3.116 5.051-5.083 8.756-5.083h28.012c3.705 0 7.092 1.967 8.756 5.083l35.176 65.911a8.743 8.743 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.756 5.083h-28.012c-3.705 0-7.092-1.967-8.756-5.083Z"
              fill="#080808"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="m395.445 149.833 39.724-73.683-39.724-73.683m77.347 73.68h-37.625"
              stroke="#333"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 4"
            ></path>
            <path
              d="m316.99 146.204-35.176-65.911a8.743 8.743 0 0 1 0-8.281L316.99 6.101c1.663-3.116 5.051-5.083 8.756-5.083h28.013c3.704 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.755 5.083h-28.013c-3.705 0-7.092-1.967-8.756-5.083Z"
              fill="#040404"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="m320.473 149.833 39.724-73.683-39.724-73.683m77.346 73.68h-37.625"
              stroke="#333"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 4"
            ></path>
            <path
              d="m187.149 146.187-35.176-65.912a8.738 8.738 0 0 1 0-8.28l35.176-65.912C188.811 2.967 192.2 1 195.904 1h82.052c3.705 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.281l-35.176 65.912c-1.662 3.116-5.05 5.083-8.755 5.083h-82.052c-3.704 0-7.092-1.967-8.755-5.083Z"
              fill="#080808"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <mask
              id=":S1:"
              style={{ maskType: 'alpha' }}
              maskUnits="userSpaceOnUse"
              x="191"
              y="76"
              width="133"
              height="76"
            >
              <path
                d="m230.357 76.14-38.243 70.927c-1.078 1.998.37 4.423 2.64 4.423h81.741a13 13 0 0 0 11.52-6.976l34.988-66.916a1 1 0 0 0-.886-1.463l-91.76.004Z"
                fill="#333"
              ></path>
            </mask>
            <g mask="url(#:S1:)" stroke="#111">
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -13.924 264.465)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -17.347 272.73)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -20.768 280.988)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -24.192 289.253)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -27.615 297.519)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -31.035 305.775)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -34.457 314.035)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -37.88 322.3)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -41.3 330.556)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -44.722 338.819)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -48.147 347.086)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -51.57 355.35)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -54.987 363.6)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -58.413 371.871)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -61.832 380.125)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -65.253 388.384)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -68.677 396.65)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -72.096 404.906)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -75.518 413.166)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -78.946 421.441)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -82.364 429.693)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -85.786 437.956)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -89.21 446.22)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -92.633 454.485)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -96.05 462.737)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -99.474 471.002)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -102.898 479.267)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -106.32 487.528)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -109.742 495.789)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -113.164 504.05)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -116.585 512.312)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -120.007 520.572)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -123.429 528.833)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -126.85 537.091)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -130.272 545.354)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -133.695 553.618)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -137.116 561.877)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -140.538 570.138)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -143.963 578.408)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -147.381 586.66)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -150.804 594.922)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -154.229 603.19)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -157.65 611.452)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -161.07 619.708)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -164.49 627.964)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -167.916 636.234)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -171.336 644.49)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -174.758 652.753)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -178.18 661.014)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -181.602 669.275)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -185.023 677.534)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -188.445 685.795)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -191.865 694.053)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -195.29 702.321)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -198.716 710.591)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -202.134 718.845)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -205.554 727.101)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -208.981 735.375)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -212.4 743.63)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -215.82 751.884)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -219.246 760.157)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -222.665 768.41)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -226.089 776.676)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -229.512 784.94)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -232.934 793.2)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -236.353 801.457)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -239.777 809.722)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -243.198 817.98)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -246.62 826.241)"
                d="M0-.5h497.768"
              ></path>
              <path
                transform="scale(-1.02975 -.96934) rotate(-45 -250.043 834.507)"
                d="M0-.5h497.768"
              ></path>
            </g>
            <path
              d="m190.631 149.822 39.724-73.684-39.724-73.683M322.76 76.134h-92.408"
              stroke="#333"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 4"
            ></path>
            <path
              d="m187.149 146.187-35.176-65.912a8.738 8.738 0 0 1 0-8.28l35.176-65.912C188.811 2.967 192.2 1 195.904 1h82.052c3.705 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.281l-35.176 65.912c-1.662 3.116-5.05 5.083-8.755 5.083h-82.052c-3.704 0-7.092-1.967-8.755-5.083Z"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="M112.184 146.204 77.008 80.293a8.74 8.74 0 0 1 0-8.281l35.176-65.911c1.662-3.116 5.051-5.083 8.755-5.083h28.013c3.704 0 7.092 1.967 8.755 5.083l35.177 65.911a8.743 8.743 0 0 1 0 8.28l-35.177 65.912c-1.662 3.116-5.051 5.083-8.755 5.083h-28.013c-3.704 0-7.092-1.967-8.755-5.083Z"
              fill="#040404"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="M115.666 149.833 155.39 76.15 115.666 2.467m77.346 73.68h-37.625"
              stroke="#333"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 4"
            ></path>
            <path
              d="M37.219 146.204 2.043 80.293a8.74 8.74 0 0 1 0-8.281L37.219 6.101c1.663-3.116 5.051-5.083 8.755-5.083h28.013c3.705 0 7.092 1.967 8.756 5.083l35.176 65.911a8.743 8.743 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.756 5.083H45.975c-3.705 0-7.093-1.967-8.756-5.083Z"
              fill="#080808"
              stroke="#333"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="m40.707 149.829 39.724-73.683L40.707 2.463m77.346 73.68H80.428"
              stroke="#333"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 4"
            ></path>
          </svg>
        </SectionContainer>

        <SectionContainer>
          <div>
            {/* <div>
              <div className="flex flex-wrap gap-2 justify-center my-8">
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
            </div> */}

            {filteredRecipes.map((category) => (
              <div key={category.id} className="mb-16 grid grid-cols-4 gap-8">
                <div className="mb-6 col-span-1">
                  <h2 className="text-xl text-foreground mb-1">{category.title}</h2>
                  <p className="text-sm text-foreground-light">{category.description}</p>
                </div>
                <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch justify-items-stretch">
                  {category.items.map((recipe) => (
                    <div
                      className="rounded border bg-surface-100/50 hover:bg-surface-100 cursor-pointer flex flex-col justify-between px-5 py-4"
                      onClick={() => handleRecipeSelect(recipe)}
                    >
                      <div className="text-foreground-muted font-mono text-xs flex items-center gap-2 justify-end mb-4">
                        {recipe.type === 'edge-function' ? (
                          <Code size={16} strokeWidth={1.5} />
                        ) : recipe.type === 'cron' ? (
                          <Clock size={16} strokeWidth={1.5} />
                        ) : (
                          <Database size={16} strokeWidth={1.5} />
                        )}
                        <span className="text-foreground-muted">{recipe.type}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-1">{recipe.title}</h3>
                        <p className="text-sm text-foreground-light">{recipe.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>

        <RecipeDialog recipe={selectedRecipe} onClose={() => handleRecipeSelect(null)} />
      </DefaultLayout>
    </>
  )
}

export default CookbookPage
