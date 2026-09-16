import { useState, useEffect } from 'react';
import { Folder, CornerDownRight } from 'lucide-react';
import { cn } from './Sidebar';
import { LUCIDE_ICONS_MAP } from './iconRegistry';

interface CategoryIconProps {
  icon?: string | null;
  name?: string;
  isSubcategory?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xs';
  className?: string;
  isActive?: boolean;
}

export function CategoryIcon({
  icon,
  name,
  isSubcategory = false,
  size = 'md',
  className = '',
  isActive = false,
}: CategoryIconProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error when icon prop changes
  useEffect(() => {
    setHasError(false);
  }, [icon]);

  const sizeClasses = {
    xs: 'w-3.5 h-3.5 min-w-[14px]',
    sm: 'w-4 h-4 min-w-[16px]',
    md: 'w-4 h-4 min-w-[16px]',
    lg: 'w-6 h-6 min-w-[24px]',
  };

  const iconSizes = {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 20,
  };

  const cleanIcon = icon?.trim();

  // Check if it is a Lucide icon identifier (e.g. "lucide:Code" or "Code")
  if (cleanIcon) {
    let lucideKey = cleanIcon.startsWith('lucide:') ? cleanIcon.replace('lucide:', '') : '';
    
    // If not prefixed with lucide: but is in our map (and not a URL)
    if (!lucideKey && !cleanIcon.startsWith('http://') && !cleanIcon.startsWith('https://') && !cleanIcon.startsWith('data:') && LUCIDE_ICONS_MAP[cleanIcon]) {
      lucideKey = cleanIcon;
    }

    if (lucideKey && LUCIDE_ICONS_MAP[lucideKey]) {
      const LucideComp = LUCIDE_ICONS_MAP[lucideKey];
      return (
        <LucideComp 
          size={iconSizes[size]} 
          className={cn(
            "shrink-0",
            isActive ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500/80 dark:text-indigo-400/80",
            className
          )} 
        />
      );
    }

    // Image URL rendering
    if ((cleanIcon.startsWith('http://') || cleanIcon.startsWith('https://') || cleanIcon.startsWith('data:')) && !hasError) {
      return (
        <div 
          className={cn(
            "inline-flex items-center justify-center shrink-0 rounded overflow-hidden",
            sizeClasses[size],
            className
          )}
        >
          <img
            src={cleanIcon}
            alt={name ? `${name} icon` : 'icon'}
            className="w-full h-full object-contain rounded"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        </div>
      );
    }
  }

  // Fallback default icons
  if (isSubcategory) {
    return (
      <CornerDownRight 
        size={iconSizes[size]} 
        className={cn(
          "shrink-0",
          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 opacity-80",
          className
        )} 
      />
    );
  }

  return (
    <Folder 
      size={iconSizes[size]} 
      className={cn(
        "shrink-0",
        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 opacity-80",
        className
      )} 
    />
  );
}
