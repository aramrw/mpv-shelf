import React from 'react';
import { LucideIcon } from 'lucide-react';
import { SettingSchema } from '@/app/settings/page';
import { cn } from '@/lib/utils';

interface CustomIconProps {
  Icon: LucideIcon; // Accepts any Lucide icon component
  userSettings: SettingSchema | undefined;
  className?: string;
  [key: string]: any; // Allows passing any other props
}

export default function DynCustomIcon({
  Icon,
  userSettings,
  className,
  ...props
}: CustomIconProps) {
  return (
    <Icon
      {...props}
      className={cn(
        'h-auto w-4 stroke-[2.1px]',
        userSettings?.fontSize === "Medium" && 'h-auto w-5',
        userSettings?.fontSize === "Large" && 'h-auto w-6',
        userSettings?.fontSize === "XLarge" && 'h-auto w-7',
        className // Append additional className here
      )}
    />
  );
}

