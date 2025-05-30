import { Heading_Shadcn_ as Heading } from 'ui'

export default function HeadingDemo() {
  return (
    <div className="flex flex-col gap-12 p-6">
      {/* Heading Variants */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Heading Variants
        </Heading>
        <div className="space-y-4">
          <Heading variant="title">The quick brown fox jumps over the lazy dog</Heading>
          <Heading variant="section">The quick brown fox jumps over the lazy dog</Heading>
          <Heading variant="subSection">The quick brown fox jumps over the lazy dog</Heading>
          <Heading variant="default">The quick brown fox jumps over the lazy dog</Heading>
          <Heading variant="compact">The quick brown fox jumps over the lazy dog</Heading>
          <Heading variant="meta">The quick brown fox jumps over the lazy dog</Heading>
        </div>
      </div>

      {/* Semantic HTML */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Semantic HTML Elements
        </Heading>
        <div className="space-y-4">
          <Heading variant="title" is="h1">
            H1 with title variant
          </Heading>
          <Heading variant="section" is="h2">
            H2 with section variant
          </Heading>
          <Heading variant="subSection" is="h3">
            H3 with subSection variant
          </Heading>
          <Heading variant="default" is="h4">
            H4 with default variant
          </Heading>
          <Heading variant="compact" is="h5">
            H5 with compact variant
          </Heading>
          <Heading variant="meta" is="h6">
            H6 with meta variant
          </Heading>
        </div>
      </div>

      {/* Size Overrides */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Size Overrides
        </Heading>
        <div className="space-y-4">
          <Heading variant="default" size="xs">
            Default heading with xs size override
          </Heading>
          <Heading variant="default" size="sm">
            Default heading with sm size override
          </Heading>
          <Heading variant="default" size="base">
            Default heading with base size override
          </Heading>
          <Heading variant="default" size="lg">
            Default heading with lg size override
          </Heading>
          <Heading variant="default" size="xl">
            Default heading with xl size override
          </Heading>
          <Heading variant="default" size="2xl">
            Default heading with 2xl size override
          </Heading>
        </div>
      </div>

      {/* Weight Overrides */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Weight Overrides
        </Heading>
        <div className="space-y-4">
          <Heading variant="default" weight="regular">
            Default heading with regular weight override
          </Heading>
          <Heading variant="default" weight="medium">
            Default heading with medium weight override
          </Heading>
        </div>
      </div>

      {/* As Links */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          As Links
        </Heading>
        <div className="space-y-4">
          <Heading variant="section" asLink>
            Section heading styled as a clickable link
          </Heading>
          <Heading variant="title" asLink>
            Title heading styled as a clickable link
          </Heading>
          <Heading variant="default" asLink>
            Default heading styled as a clickable link
          </Heading>
        </div>
      </div>

      {/* Combined Examples */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Combined Examples
        </Heading>
        <div className="space-y-4">
          <Heading variant="title" is="h1" weight="regular">
            Large H1 title with regular weight
          </Heading>
          <Heading variant="section" is="h2" size="lg" asLink>
            H2 section heading with large size as link
          </Heading>
          <Heading variant="compact" size="base" weight="medium">
            Compact heading with base size and medium weight
          </Heading>
        </div>
      </div>
    </div>
  )
}
