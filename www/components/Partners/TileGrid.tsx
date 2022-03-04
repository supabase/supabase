import { Card, Space, Typography } from '@supabase/ui'
import { Partner } from '~/types/partners'

export default function TileGrid({
  partnersByCategory,
}: {
  partnersByCategory: { [category: string]: Partner[] }
}) {
  return (
    <>
      {Object.keys(partnersByCategory).map((cat) => (
        <div id={cat.toLowerCase()} key={cat}>
          <Typography.Title level={2}>{cat}</Typography.Title>
          <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            {partnersByCategory[cat].map((p) => (
              <a href={`/partners/${p.slug}`} key={p.slug}>
                <Card key={`partner_${p.slug}`} hoverable>
                  <Space className="justify-between h-30" direction="vertical">
                    <div className="w-full flex justify-between space-x-6">
                      <div>
                        <Typography.Text small type="secondary">
                          {p.category}
                        </Typography.Text>
                        <Typography.Title level={3}>{p.title}</Typography.Title>
                      </div>
                      <img
                        className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"
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
