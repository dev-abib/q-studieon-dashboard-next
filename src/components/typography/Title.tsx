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
    1: 'text-3xl',
    2: 'text-2xl',
    3: 'text-xl',
    4: 'text-lg',
    5: 'text-base',
    6: 'text-sm',
  }[level];
  return (
    <Tag className={cn('font-heading font-semibold tracking-tight', sizeClass, className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Title;
