import { cn } from '../../lib/utils/cn'

/**
 * A loading line component that displays a horizontal loading indicator.
 * @param {object} props - The component props.
 * @param {boolean} props.loading - If `true`, the loading line will be animated.
 * @returns {React.ReactElement} The loading line component.
 */
export const LoadingLine = ({ loading }: { loading: boolean }) => {
  return (
    <div className="relative overflow-hidden w-full h-px bg-border m-auto">
      <span
        className={cn(
          'absolute w-[80px] h-px ml-auto mr-auto left-0 right-0 text-center block top-0',
          'transition-all',
          'line-loading-bg-light dark:line-loading-bg',
          loading && 'animate-line-loading-slower opacity-100',
          loading ? 'opacity-100' : 'opacity-0'
        )}
      ></span>
    </div>
  )
}
