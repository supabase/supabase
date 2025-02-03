import {
  forwardRef,
  createElement,
  ReactSVG,
  SVGProps,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import defaultAttributes from './defaultAttributes';

export type IconNode = [elementName: keyof ReactSVG, attrs: Record<string, string>][];

export type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ComponentAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;

export interface LucideProps extends ComponentAttributes {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}

export type LucideIcon = ForwardRefExoticComponent<LucideProps>;
/**
 * Converts string to KebabCase
 * Copied from scripts/helper. If anyone knows how to properly import it here
 * then please fix it.
 *
 * @param {string} string
 * @returns {string} A kebabized string
 */
export const toKebabCase = (string: string) =>
  string
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .trim();

const createLucideIcon = (iconName: string, iconNode: IconNode): LucideIcon => {
  const Component = forwardRef<SVGSVGElement, LucideProps>(
    (
      {
        color = 'currentColor',
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth,
        className = '',
        children,
        ...rest
      },
      ref,
    ) => {
      return createElement(
        'svg',
        {
          ref,
          ...defaultAttributes,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth,
          className: ['lucide', `lucide-${toKebabCase(iconName)}`, className].join(' '),
          ...rest,
        },
        [
          ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
          ...(Array.isArray(children) ? children : [children]),
        ],
      );
    },
  );

  Component.displayName = `${iconName}`;

  return Component;
};

export default createLucideIcon;
