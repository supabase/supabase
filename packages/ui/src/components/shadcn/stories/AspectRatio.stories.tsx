import { Meta } from '@storybook/react'
import { AspectRatio } from '../ui/aspect-ratio'

const meta: Meta<typeof AspectRatio> = {
  title: 'shadcn/AspectRatio',
  component: AspectRatio,
}

export const Default = () => (
  <AspectRatio ratio={16 / 9} className="bg-overlay p-3 border-overlay rounded-lg">
    <img
      src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
      alt="Photo by Drew Beamer"
      className="rounded-md"
    />
    {/* 
    
    You could also use Next/Image in here like this:

    <Image
      src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
      alt="Photo by Drew Beamer"
      fill
      className="rounded-md object-cover"
    /> 
    
    */}
  </AspectRatio>
)

export default meta
