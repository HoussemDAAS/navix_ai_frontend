import React from 'react';

type IconicButtonVariant = 'primary' | 'secondary' | 'outline';

interface IconicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconicButtonVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function IconicButton({ 
  variant = 'primary', 
  children, 
  icon,
  className = '', 
  ...props 
}: IconicButtonProps) {
  
  const baseClasses = "group flex h-14 items-center gap-4 rounded-full pl-6 pr-2 font-semibold text-sm transition-all";
  
  let variantClasses = "";
  let textContainerClasses = "relative z-10 transition-colors duration-300";
  let iconContainerClasses = "relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all duration-300 group-hover:translate-x-1";

  switch (variant) {
    case 'primary':
      variantClasses = "btn-pill-fill bg-primary text-primary-foreground shadow-lg shadow-primary/20";
      textContainerClasses += " group-hover:text-primary";
      iconContainerClasses += " text-primary group-hover:bg-primary group-hover:text-white";
      break;
    case 'secondary':
      variantClasses = "btn-pill-fill bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20";
      textContainerClasses += " group-hover:text-secondary";
      iconContainerClasses += " text-secondary group-hover:bg-secondary group-hover:text-white";
      break;
    case 'outline':
      variantClasses = "btn-pill-fill-outline border-2 border-border bg-transparent text-foreground";
      textContainerClasses += " group-hover:text-white";
      iconContainerClasses += " text-primary group-hover:bg-transparent group-hover:text-white group-hover:border-2 group-hover:border-white shadow-sm";
      break;
  }

  // Default arrow icon if none provided
  const targetIcon = icon || (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7"/>
    </svg>
  );

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <span className={textContainerClasses}>
        {children}
      </span>
      <div className={iconContainerClasses}>
        {targetIcon}
      </div>
    </button>
  );
}
