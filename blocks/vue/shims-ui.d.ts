// Shims to resolve IDE type check errors for shadcn-vue UI components
// that do not exist locally in the blocks registry but will exist in the target projects.

declare module '@/components/ui/button' {
  import { DefineComponent } from 'vue'
  export const Button: DefineComponent<any, any, any>
}

declare module '@/components/ui/button.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/Button.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/card' {
  import { DefineComponent } from 'vue'
  export const Card: DefineComponent<any, any, any>
  export const CardHeader: DefineComponent<any, any, any>
  export const CardTitle: DefineComponent<any, any, any>
  export const CardDescription: DefineComponent<any, any, any>
  export const CardContent: DefineComponent<any, any, any>
  export const CardFooter: DefineComponent<any, any, any>
}

declare module '@/components/ui/card.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/input' {
  import { DefineComponent } from 'vue'
  export const Input: DefineComponent<any, any, any>
}

declare module '@/components/ui/input.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/Input.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/label' {
  import { DefineComponent } from 'vue'
  export const Label: DefineComponent<any, any, any>
}

declare module '@/components/ui/label.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/avatar' {
  import { DefineComponent } from 'vue'
  export const Avatar: DefineComponent<any, any, any>
  export const AvatarImage: DefineComponent<any, any, any>
  export const AvatarFallback: DefineComponent<any, any, any>
}

declare module '@/components/ui/avatar/Avatar.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/avatar/AvatarImage.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/avatar/AvatarFallback.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/tooltip' {
  import { DefineComponent } from 'vue'
  export const Tooltip: DefineComponent<any, any, any>
  export const TooltipTrigger: DefineComponent<any, any, any>
  export const TooltipContent: DefineComponent<any, any, any>
  export const TooltipProvider: DefineComponent<any, any, any>
}

declare module '@/components/ui/tooltip/Tooltip.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/tooltip/TooltipContent.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

declare module '@/components/ui/tooltip/TooltipTrigger.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}
