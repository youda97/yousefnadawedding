import React from 'react'

export const Card: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => (
  <div
    className={
      'rounded-tl-[90px] rounded-br-[90px] relative bg-[rgba(159,121,100,0.8)] p-8 md:p-14 border border-white/60 shadow-xl ' +
      (className || '')
    }
  >
    {children}
  </div>
)

export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="text-center mb-10 md:mb-16">
    <h2 className='font-["Great_Vibes",cursive] text-4xl md:text-6xl text-white drop-shadow-sm'>
      {title}
    </h2>
    {subtitle && <p className="text-white/80 mt-2">{subtitle}</p>}
  </div>
)

export const Label: React.FC<React.PropsWithChildren<{ htmlFor?: string }>> = ({
  htmlFor,
  children,
}) => (
  <label htmlFor={htmlFor} className="block text-white/90 text-sm mb-1">
    {children}
  </label>
)

export const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = (props) => (
  <input
    {...props}
    className={
      'w-full h-12 mt-2 px-3 bg-transparent text-white placeholder-white/60 rounded-md border border-white/30 outline-none focus:ring-2 focus:ring-white/50 ' +
      (props.className || '')
    }
  />
)

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ className, children, ...props }) => (
  <button
    {...props}
    className={
      'text-white cursor-pointer px-5 py-2 rounded-[15px_/_5px] border border-white/30 hover:bg-white/10 focus:ring-2 focus:ring-white/50 disabled:opacity-50 ' +
      (className || '')
    }
  >
    {children}
  </button>
)
