import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'chip' | 'icon' | 'link' | 'square';
}

const Button = ({ children, variant = 'primary', className, ...props }: ButtonProps): React.JSX.Element => {
  const baseStyles =
    'border rounded-full px-4 h-10 flex justify-center items-center whitespace-nowrap transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-primary text-background hover:bg-primary/70 font-semibold !border-transparent',
    secondary: 'hover:bg-primary/15 bg-primary/10 border-primary/20 hover:text-text-light',
    chip: 'text-xs px-2 h-6 font-semibold select-none pointer-events-none hover:bg-primary/15 bg-primary/10 border-primary/20 hover:text-text-light',
    icon: 'h-10 w-10 p-0 hover:bg-primary/15 bg-primary/10 border-primary/20 hover:text-text-light',
    link: 'text-text-light hover:underline h-fit px-0 py-0 border-transparent',
    square: 'h-8 w-8 p-0 hover:bg-primary/15 bg-primary/10 border-primary/20 hover:text-text-light rounded-lg'
  };

  const buttonProps = {
    ...props,
    ...(variant === 'chip' ? { tabIndex: -1 } : {})
  };

  return (
    <button className={twMerge(baseStyles, variantStyles[variant], className)} {...buttonProps}>
      {children}
    </button>
  );
};

export default Button;
