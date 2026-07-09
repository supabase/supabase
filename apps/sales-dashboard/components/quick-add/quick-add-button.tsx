'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ui'

import { ActivityForm } from '@/components/quick-add/activity-form'
import { LeadForm } from '@/components/quick-add/lead-form'
import { QuoteForm } from '@/components/quick-add/quote-form'

interface QuickAddButtonProps {
  leadOptions: { id: string; name: string; company: string | null }[]
}

export function QuickAddButton({ leadOptions }: QuickAddButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        rounded
        className="fixed bottom-20 right-4 z-20 h-14 w-14 shadow-lg"
        icon={<Plus size={22} />}
        aria-label="Quick add"
      />
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Quick add</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="lead" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="quote">Quote</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="lead" className="pt-4">
            <LeadForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="quote" className="pt-4">
            <QuoteForm leadOptions={leadOptions} onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="activity" className="pt-4">
            <ActivityForm leadOptions={leadOptions} onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
