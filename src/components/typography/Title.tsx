import React from 'react';
import { cn } from '@/lib/utils';

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level 1-6 */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Title component that maps heading levels to our design‑system font sizes.
 * Uses the `--font-heading` token defined in designTokens.css.
 */
export const Title: React.FC<TitleProps> = ({
  level = 1,
  className = '',
  children,
  ...rest
}) => {
  const Tag = `h${level}` as React.ElementType;
  const sizeClass = {
    1: 'text-5xl',
    2: 'text-4xl',
    3: 'text-3xl',
    4: 'text-2xl',
    5: 'text-xl',
    6: 'text-lg',
  }[level];
  return (
    <Tag className={cn('font-heading font-medium tracking-tight', sizeClass, className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Title;
