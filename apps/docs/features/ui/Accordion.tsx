'use client'

import { Accordion as AccordionPrimitive } from 'ui'

/**
 * This makes the component work in MDX files, which otherwise would error on
 * "trying to dot into a Client Component".
 */

const Accordion = AccordionPrimitive
const AccordionItem = AccordionPrimitive.Item

export { Accordion, AccordionItem }
