import { Text, Heading_Shadcn_ as Heading } from 'ui'

export default function TextDemo() {
  return (
    <div className="flex flex-col gap-12 p-6">
      {/* Text Variants */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Text Variants
        </Heading>
        <div className="space-y-4">
          <Text variant="default">
            The quick brown fox jumps over the lazy dog. This is the default text variant used for
            regular content throughout the application.
          </Text>
          <Text variant="subTitle">
            The quick brown fox jumps over the lazy dog. This is a subtitle variant with larger text
            for emphasis.
          </Text>
          <Text variant="compact">
            The quick brown fox jumps over the lazy dog. This is compact text for dense layouts and
            smaller content areas.
          </Text>
        </div>
      </div>

      {/* Size Overrides */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Size Overrides
        </Heading>
        <div className="space-y-4">
          <Text variant="default" size="xs">
            Default text with xs size override
          </Text>
          <Text variant="default" size="sm">
            Default text with sm size override
          </Text>
          <Text variant="default" size="base">
            Default text with base size override
          </Text>
          <Text variant="default" size="lg">
            Default text with lg size override
          </Text>
          <Text variant="default" size="xl">
            Default text with xl size override
          </Text>
          <Text variant="default" size="2xl">
            Default text with 2xl size override
          </Text>
        </div>
      </div>

      {/* Weight Overrides */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Weight Overrides
        </Heading>
        <div className="space-y-4">
          <Text variant="default" weight="regular">
            Default text with regular weight override
          </Text>
          <Text variant="default" weight="semibold">
            Default text with semibold weight override
          </Text>
        </div>
      </div>

      {/* As Links */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          As Links
        </Heading>
        <div className="space-y-4">
          <Text variant="default" asLink>
            Default text styled as a clickable link
          </Text>
          <Text variant="subTitle" asLink>
            Subtitle text styled as a clickable link
          </Text>
          <Text variant="compact" asLink>
            Compact text styled as a clickable link
          </Text>
        </div>
      </div>

      {/* Combined Examples */}
      <div className="space-y-4">
        <Heading variant="meta" className="text-foreground-lighter">
          Combined Examples
        </Heading>
        <div>
          <Heading variant="title" className="mb-1 mt-6">
            Page Title
          </Heading>
          <Text variant="subTitle" className="text-foreground-light mb-6">
            This is a description of the page
          </Text>
          <Heading variant="section" is="h2" className="mb-2">
            Section Heading
          </Heading>
          <Text className="text-foreground-light">
            A versatile component that provides consistent typography styling across your
            application, with support for various text styles, weights, and interactive states.
          </Text>
        </div>
      </div>
    </div>
  )
}
