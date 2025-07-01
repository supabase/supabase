import React, { useEffect, useRef, useState } from 'react'
import { NextSeo } from 'next-seo'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

import { Button, cn } from 'ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui/src/components/shadcn/ui/chart'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

// Data for charts - State of Startups 2025
const roleData = [
  { name: 'Founder / Co-founder', value: 76.2, color: '#3b82f6' },
  { name: 'Engineer', value: 18.2, color: '#10b981' },
  { name: 'Other', value: 2.6, color: '#f59e0b' },
  { name: 'Product Management', value: 1.9, color: '#ef4444' },
  { name: 'Marketing', value: 0.6, color: '#8b5cf6' },
  { name: 'Sales', value: 0.5, color: '#06b6d4' },
]

const ageData = [
  { name: '22–29', value: 36.4, color: '#3b82f6' },
  { name: '30–39', value: 24.7, color: '#10b981' },
  { name: '18–21', value: 21.3, color: '#f59e0b' },
  { name: '40–49', value: 11.5, color: '#ef4444' },
  { name: '50–59', value: 4.8, color: '#8b5cf6' },
  { name: '60+', value: 1.2, color: '#06b6d4' },
]

const fundingData = [
  { name: 'Bootstrapped', value: 66.3, color: '#3b82f6' },
  { name: 'Pre-seed', value: 12.5, color: '#10b981' },
  { name: 'Seed', value: 9.3, color: '#f59e0b' },
  { name: 'Series A', value: 2.5, color: '#ef4444' },
  { name: 'Series B', value: 1.1, color: '#8b5cf6' },
  { name: 'Series C', value: 0.6, color: '#06b6d4' },
  { name: 'Series D or later', value: 0.8, color: '#ec4899' },
  { name: 'Other', value: 6.0, color: '#64748b' },
]

const teamSizeData = [
  { name: '1–10', value: 91.1, color: '#3b82f6' },
  { name: '11–50', value: 6.3, color: '#10b981' },
  { name: '51–100', value: 1.2, color: '#f59e0b' },
  { name: '101–250', value: 0.8, color: '#ef4444' },
  { name: '250+', value: 0.6, color: '#8b5cf6' },
]

const companyAgeData = [
  { name: 'Less than 1 year', value: 66.0, color: '#3b82f6' },
  { name: '1-2 years', value: 22.8, color: '#10b981' },
  { name: '3-5 years', value: 8.4, color: '#f59e0b' },
  { name: '5+ years', value: 2.8, color: '#ef4444' },
]

const databaseData = [
  { name: 'PostgreSQL', value: 78.4, color: '#336791' },
  { name: 'MySQL', value: 15.2, color: '#4479a1' },
  { name: 'MongoDB', value: 12.8, color: '#47a248' },
  { name: 'SQLite', value: 8.9, color: '#003b57' },
  { name: 'Redis', value: 7.3, color: '#dc382d' },
  { name: 'Other', value: 6.1, color: '#64748b' },
]

const cloudPlatformData = [
  { name: 'Supabase', value: 62.1, color: '#3ecf8e' },
  { name: 'Vercel', value: 37.0, color: '#000000' },
  { name: 'AWS', value: 26.5, color: '#ff9900' },
  { name: 'Cloudflare', value: 21.4, color: '#f38020' },
  { name: 'GCP', value: 12.6, color: '#4285f4' },
  { name: 'Azure', value: 8.8, color: '#0078d4' },
  { name: 'Render', value: 6.2, color: '#46e3b7' },
  { name: 'Railway', value: 5.1, color: '#0b0d0e' },
  { name: 'Fly.io', value: 2.8, color: '#8b5cf6' },
]

const aiUsageData = [
  { name: 'Using AI in production', value: 53.2, color: '#10b981' },
  { name: 'Planning to use AI', value: 21.4, color: '#f59e0b' },
  { name: 'Experimenting with AI', value: 18.7, color: '#3b82f6' },
  { name: 'No AI plans', value: 6.7, color: '#64748b' },
]

const aiUseCaseData = [
  { name: 'Summarization / content generation', value: 45.7 },
  { name: 'Recommendations / personalization', value: 44.0 },
  { name: 'Workflow / agent-based automation', value: 42.9 },
  { name: 'Search / semantic search', value: 28.9 },
  { name: 'Customer support automation', value: 27.7 },
  { name: 'Other', value: 11.2 },
]

const aiModelData = [
  { name: 'OpenAI', value: 69.4, color: '#10a37f' },
  { name: 'Anthropic / Claude', value: 37.9, color: '#d97706' },
  { name: 'Other', value: 20.9, color: '#64748b' },
  { name: 'Hugging Face', value: 17.2, color: '#ffcc02' },
  { name: 'Custom models', value: 16.1, color: '#8b5cf6' },
  { name: 'Mistral', value: 6.6, color: '#ff6b35' },
  { name: 'Bedrock', value: 3.6, color: '#ff9900' },
  { name: 'SageMaker', value: 2.3, color: '#ff9900' },
  { name: 'Cohere', value: 2.0, color: '#39c5bb' },
]

const chartConfig = {
  value: {
    label: "Percentage",
    color: "#3b82f6",
  },
}

function StateOfStartups2025Page() {
  return (
    <>
      <NextSeo
        title="State of Startups 2025 - Survey Results"
        description="Discover what's powering modern startups: their stacks, their go-to-market motion, and their approach to AI. Built for builders."
        openGraph={{
          title: "State of Startups 2025 - Survey Results",
          description: "Discover what's powering modern startups: their stacks, their go-to-market motion, and their approach to AI. Built for builders.",
          url: `https://supabase.com/state-of-startups-2025`,
          images: [
            {
              url: '/images/state-of-startups/2025/state-of-startups-og.png',
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative">
        <HeroSection />
        <FounderBasicsSection />
        <ProductMarketSection />
        <TechStackSection />
        <CloudPlatformSection />
        <AIAgentsSection />
        <CommunitySection />
        <GoToMarketSection />
        <OutlookSection />
      </DefaultLayout>
    </>
  )
}

const HeroSection = () => {
  return (
    <SectionContainer className="py-16 md:py-24">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground-light bg-clip-text text-transparent">
            State of Startups 2025
          </h1>
          <p className="text-xl md:text-2xl text-foreground-light mb-8">
            We surveyed over 1,800 startup founders and builders to uncover what's powering modern startups: their stacks, their go-to-market motion, and their approach to AI.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
          <div className="p-6 bg-surface-100 rounded-lg border">
            <div className="text-3xl font-bold text-brand mb-2">1,800+</div>
            <h3 className="text-lg font-semibold mb-2">Survey Responses</h3>
            <p className="text-foreground-light text-sm">Startup founders and builders worldwide</p>
          </div>
          <div className="p-6 bg-surface-100 rounded-lg border">
            <div className="text-3xl font-bold text-brand mb-2">76%</div>
            <h3 className="text-lg font-semibold mb-2">Are Founders</h3>
            <p className="text-foreground-light text-sm">Building the next generation of startups</p>
          </div>
          <div className="p-6 bg-surface-100 rounded-lg border">
            <div className="text-3xl font-bold text-brand mb-2">53%</div>
            <h3 className="text-lg font-semibold mb-2">Using AI in Production</h3>
            <p className="text-foreground-light text-sm">Real AI adoption, not just experimentation</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-surface-100 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">What's in a modern startup stack?</h3>
            <p className="text-foreground-light text-sm">Postgres, React, Node.js, and Supabase lead the way</p>
          </div>
          <div className="p-6 bg-surface-100 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Where is AI delivering real product value?</h3>
            <p className="text-foreground-light text-sm">Agents, search, and content generation dominate</p>
          </div>
          <div className="p-6 bg-surface-100 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">How do technical founders think about growth?</h3>
            <p className="text-foreground-light text-sm">Personal networks and communities drive first users</p>
          </div>
        </div>
        <p className="text-lg text-brand mt-8 font-medium">This report is built for builders.</p>
      </div>
    </SectionContainer>
  )
}

const FounderBasicsSection = () => {
  return (
    <SectionContainer className="py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Founder and Company Basics</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Today's startup ecosystem is dominated by young, technical builders shipping fast with lean teams.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Role Distribution</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Age Distribution</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Funding Stage</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={fundingData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Team Size</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={teamSizeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Company Age Distribution</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={companyAgeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {companyAgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="space-y-6">
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">82%</div>
                <div className="text-sm text-foreground-light">Under 40 years old</div>
              </div>
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">66%</div>
                <div className="text-sm text-foreground-light">Company less than 1 year old</div>
              </div>
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">91%</div>
                <div className="text-sm text-foreground-light">Teams of 10 or fewer</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• 76% of respondents are founders or co-founders, showing high leadership representation</li>
            <li>• 82% are under the age of 40, with 36% in the 22-29 age range</li>
            <li>• 66% of startups are less than 1 year old, indicating early-stage focus</li>
            <li>• 91% of teams have 10 or fewer employees, typical of lean startup methodology</li>
            <li>• 66% are bootstrapped, showing self-funded growth preference</li>
            <li>• Only 12% have raised institutional funding (pre-seed through Series A+)</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const ProductMarketSection = () => {
  const monetizationData = [
    { name: 'No', value: 57.7, color: '#ef4444' },
    { name: 'Yes', value: 36.5, color: '#10b981' },
    { name: 'No plans to monetize', value: 5.8, color: '#64748b' },
  ]

  const pivotData = [
    { name: 'Never', value: 41.5 },
    { name: 'Once', value: 28.4 },
    { name: 'Twice', value: 14.0 },
    { name: 'More than twice', value: 16.1 },
  ]

  return (
    <SectionContainer className="py-16 bg-surface-75">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Product and Market</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Startups are building a diverse mix of software products, iterating quickly, and pursuing monetization selectively.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Is your startup monetizing today?</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={monetizationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {monetizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Pivot Frequency</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={pivotData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• 36.5% are monetizing today</li>
            <li>• 57.7% are pre-revenue</li>
            <li>• 5.8% have no plans to monetize</li>
            <li>• Over half have pivoted at least once</li>
            <li>• Nearly one-third have been through an accelerator</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const TechStackSection = () => {
  const frontendData = [
    { name: 'React', value: 55.0 },
    { name: 'Next.js', value: 49.5 },
    { name: 'Native mobile', value: 15.1 },
    { name: 'Flutter', value: 12.4 },
    { name: 'Other', value: 11.7 },
    { name: 'Vue', value: 6.3 },
    { name: 'Svelte', value: 4.8 },
  ]

  const backendData = [
    { name: 'Node.js', value: 60.5 },
    { name: 'Python', value: 32.1 },
    { name: 'Other', value: 19.0 },
    { name: 'Java / Spring', value: 10.8 },
    { name: 'PHP', value: 6.1 },
    { name: 'Go', value: 5.6 },
    { name: '.NET', value: 4.4 },
    { name: 'Rust', value: 2.9 },
    { name: 'Ruby on Rails', value: 1.7 },
  ]

  return (
    <SectionContainer className="py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tech Stack</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            The modern stack centers around open tools, modular infrastructure, and developer experience.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Frontend Frameworks</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={frontendData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Backend Frameworks</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={backendData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Database Preferences</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={databaseData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#336791" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="space-y-6">
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">78%</div>
                <div className="text-sm text-foreground-light">Choose PostgreSQL as their database</div>
              </div>
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">55%</div>
                <div className="text-sm text-foreground-light">Use React for frontend development</div>
              </div>
              <div className="p-4 bg-surface-100 rounded-lg border">
                <div className="text-2xl font-bold text-brand mb-1">60%</div>
                <div className="text-sm text-foreground-light">Build backends with Node.js</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• PostgreSQL dominates database choice at 78%, far ahead of MySQL (15%)</li>
            <li>• React ecosystem leads frontend: React (55%) + Next.js (49.5%)</li>
            <li>• JavaScript dominates backend: Node.js (60.5%) leads, Python second (32%)</li>
            <li>• Mobile development split between native (15%) and Flutter (12%)</li>
            <li>• Modern frameworks like Svelte gaining traction but still niche (4.8%)</li>
            <li>• Stack choices prioritize developer experience and rapid prototyping</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const CloudPlatformSection = () => {
  return (
    <SectionContainer className="py-16 bg-surface-75">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Cloud Platform Choice</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Startups in 2025 are building on a mix of hyperscale clouds and developer-friendly platforms.
          </p>
        </div>
        
        <div className="mb-12">
          <ChartContainer config={chartConfig} className="h-96">
            <BarChart data={cloudPlatformData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#3ecf8e" />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• Supabase leads for managed backends (62%)</li>
            <li>• Vercel is the top choice for frontend deployment (37%)</li>
            <li>• AWS remains popular for infrastructure (27%)</li>
            <li>• Cloudflare used tactically for CDN and edge (21%)</li>
            <li>• Developer experience drives platform choice</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const AIAgentsSection = () => {
  const agentUseCaseData = [
    { name: 'Workflow automation', value: 27.5 },
    { name: 'Personalization', value: 20.5 },
    { name: 'Data analysis', value: 19.7 },
    { name: 'Content generation', value: 19.5 },
    { name: 'Customer support', value: 17.1 },
    { name: 'Education', value: 13.4 },
    { name: 'Sales & lead gen', value: 13.2 },
    { name: 'Research assistance', value: 11.9 },
  ]

  return (
    <SectionContainer className="py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">AI and Agents</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            AI is a core product capability, not an afterthought. Over half of startups are using AI in production.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">AI Adoption Status</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={aiUsageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {aiUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">AI Model Providers</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={aiModelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10a37f" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">AI Use Cases</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={aiUseCaseData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Agent Use Cases</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={agentUseCaseData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• 53% of startups are using AI in production, with 21% planning adoption</li>
            <li>• OpenAI dominates model choice (69.4%), followed by Anthropic (37.9%)</li>
            <li>• Top AI use cases: summarization (45.7%), personalization (44%), automation (42.9%)</li>
            <li>• 1 in 3 startups are building AI agents, primarily for workflow automation</li>
            <li>• Agent use cases span workflow automation, personalization, and data analysis</li>
            <li>• AI adoption is strategic, not experimental - it's core to product value</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const CommunitySection = () => {
  const newsletterData = [
    { name: 'TLDR', value: 6.6 },
    { name: 'Other', value: 5.4 },
    { name: "Lenny's Newsletter", value: 4.3 },
    { name: 'The Pragmatic Engineer', value: 3.0 },
    { name: 'Platformer', value: 1.9 },
    { name: 'Every', value: 1.8 },
    { name: 'Stratechery', value: 1.7 },
    { name: "Ben's Bites", value: 1.6 },
  ]

  const podcastData = [
    { name: 'The Diary of a CEO', value: 14.1 },
    { name: 'Founders Podcast', value: 10.3 },
    { name: 'Other', value: 9.9 },
    { name: 'My First Million', value: 8.6 },
    { name: "Lenny's Podcast", value: 7.5 },
    { name: 'The All-In Podcast', value: 7.5 },
    { name: 'Software Engineering Daily', value: 6.9 },
    { name: 'Acquired', value: 6.2 },
    { name: 'The AI Breakdown', value: 5.8 },
  ]

  return (
    <SectionContainer className="py-16 bg-surface-75">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Community and Influence</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Communities are the learning engine behind every early-stage startup.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Top Newsletters</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={newsletterData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Top Podcasts</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={podcastData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• Most-cited newsletters: Lenny's, TLDR, Ben's Bites</li>
            <li>• Popular podcasts: Acquired, MFM, AI Breakdown</li>
            <li>• Most used social: Twitter/X, Discord, GitHub</li>
            <li>• 44.6% identify as lurkers online</li>
            <li>• Tool discovery happens through peer recommendations</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const GoToMarketSection = () => {
  const acquisitionData = [
    { name: 'Personal/professional network', value: 18.6 },
    { name: 'Inbound from social media', value: 10.6 },
    { name: 'Cold outreach or sales', value: 10.0 },
    { name: 'Content (blog, newsletter, SEO)', value: 8.1 },
    { name: 'Developer communities', value: 4.7 },
    { name: 'Accelerators/incubators', value: 3.2 },
    { name: 'Open source conversions', value: 3.2 },
    { name: 'Hacker News or Product Hunt', value: 3.0 },
  ]

  const pricingData = [
    { name: 'Still experimenting', value: 12.4 },
    { name: 'Flat-rate plans', value: 10.9 },
    { name: 'Usage-based pricing', value: 8.4 },
    { name: 'Custom pricing for enterprise', value: 7.7 },
    { name: 'Tiered feature plans', value: 7.0 },
    { name: 'Other', value: 2.1 },
  ]

  return (
    <SectionContainer className="py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Go-To-Market</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Startups start selling through networks and dev communities, then layer in more structured growth.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">First User Acquisition</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={acquisitionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Pricing Strategies</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={pricingData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• Top first user sources: warm intros, PH, HN, Discord</li>
            <li>• Sales often starts with the founder</li>
            <li>• Most popular pricing: usage-based and tiered</li>
            <li>• Low CRM adoption: Google Sheets still leads</li>
            <li>• Product-led growth is the preferred strategy</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

const OutlookSection = () => {
  const challengeData = [
    { name: 'Customer acquisition', value: 32.3 },
    { name: 'Technical complexity', value: 23.9 },
    { name: 'Fundraising', value: 19.4 },
    { name: 'Product-market fit', value: 19.4 },
    { name: 'Hiring', value: 5.0 },
  ]

  const outlookData = [
    { role: 'Founder / Co-founder', optimistic: 60.7, neutral: 25.6, pessimistic: 13.8 },
    { role: 'Engineer', optimistic: 50.1, neutral: 32.8, pessimistic: 17.1 },
    { role: 'Marketing', optimistic: 50.0, neutral: 33.3, pessimistic: 16.7 },
    { role: 'Other', optimistic: 41.8, neutral: 41.8, pessimistic: 16.4 },
  ]

  return (
    <SectionContainer className="py-16 bg-surface-75">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Outlook and Challenges</h2>
          <p className="text-xl text-foreground-light max-w-3xl mx-auto">
            Founders are optimistic, but tired. Employees feel more uncertainty.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Biggest Business Challenges</h3>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={challengeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ChartContainer>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Outlook by Role</h3>
            <div className="space-y-4">
              {outlookData.map((item, index) => (
                <div key={index} className="p-4 bg-surface-100 rounded-lg">
                  <div className="font-medium mb-2">{item.role}</div>
                  <div className="flex h-6 rounded overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${item.optimistic}%` }}
                      title={`Optimistic: ${item.optimistic}%`}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${item.neutral}%` }}
                      title={`Neutral: ${item.neutral}%`}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${item.pessimistic}%` }}
                      title={`Pessimistic: ${item.pessimistic}%`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-foreground-light mt-1">
                    <span>Optimistic: {item.optimistic}%</span>
                    <span>Neutral: {item.neutral}%</span>
                    <span>Pessimistic: {item.pessimistic}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-surface-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
          <ul className="space-y-2 text-foreground-light">
            <li>• Top challenges: fundraising, hiring, PMF</li>
            <li>• Top tools: Supabase, Cursor, Copilot, Stripe</li>
            <li>• Missing tools: onboarding flows, agent frameworks, analytics</li>
            <li>• Founders more optimistic than employees</li>
            <li>• Teams want easier observability and AI agents that deliver</li>
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

export default StateOfStartups2025Page