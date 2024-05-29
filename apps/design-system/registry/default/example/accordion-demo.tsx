import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
} from 'ui'

export default function AccordionDemo() {
  return (
    <Accordion_Shadcn_ type="single" collapsible className="w-full">
      <AccordionItem_Shadcn_ value="item-1">
        <AccordionTrigger_Shadcn_>Is it accessible?</AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
      <AccordionItem_Shadcn_ value="item-2">
        <AccordionTrigger_Shadcn_>Is it styled?</AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_>
          Yes. It comes with default styles that matches the other components&apos; aesthetic.
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
      <AccordionItem_Shadcn_ value="item-3">
        <AccordionTrigger_Shadcn_>Is it animated?</AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_>
          Yes. Its animated by default, but you can disable it if you prefer.
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}
