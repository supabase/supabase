import { Card, Space, Typography } from '@supabase/ui'
import { Partner } from '~/types/partners'

export default function TileGrid({
  partnersByCategory,
}: {
  partnersByCategory: { [category: string]: Partner[] }
}) {
  return (
    <>
      {Object.keys(partnersByCategory).map((category) => (
        <div key={category} id={category.toLowerCase()} className="space-y-8">
          <Typography.Title level={2}>{category}</Typography.Title>
          <div className="grid max-w-lg gap-5 mx-auto lg:grid-cols-3 lg:max-w-none">
            {partnersByCategory[category].map((p) => (
              <a href={`/partners/${p.slug}`} key={p.slug}>
                <Card key={`partner_${p.slug}`} hoverable>
                  <Space className="justify-between h-30" direction="vertical">
                    <div className="flex justify-between w-full space-x-6">
                      <div>
                        <Typography.Text small type="secondary">
                          {p.category}
                        </Typography.Text>
                        <Typography.Title level={3}>{p.title}</Typography.Title>
                      </div>
                      <img
                        className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full"
                        src={p.logo}
                        alt={p.title}
                      />
                    </div>
                    <Typography.Text type="default">{p.description}</Typography.Text>
                  </Space>
                </Card>
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
