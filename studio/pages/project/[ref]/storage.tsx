import StorageLayout from 'components/layouts/StorageLayout'
import { StorageContext } from 'context/StorageContext'
import { Typography, Card, Button } from '@supabase/ui'

export default function Storage() {
  return (
    <StorageLayout title="Storage">
      <StorageContext.Consumer>
        {({ openBucketModal }) => {
          return (
            <div className="flex items-center justify-center h-full">
              <Card title="Storage" className="flex flex-col w-96 h-60">
                <Typography.Text>
                  Create buckets to store and serve any type of digital content. Make your buckets
                  private or public depending on your security preference.
                </Typography.Text>
                <div className="flex flex-row mt-4">
                  <Button type="primary" className="mr-2" onClick={openBucketModal}>
                    Create a new bucket
                  </Button>
                  <Button type="link">About storage</Button>
                </div>
              </Card>
            </div>
          )
        }}
      </StorageContext.Consumer>
    </StorageLayout>
  )
}
