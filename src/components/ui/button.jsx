import React from 'react'
import { cn } from '../../lib/utils'

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      default:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600',
      secondary:
        'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-200',
      outline:
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      default: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-base',
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
