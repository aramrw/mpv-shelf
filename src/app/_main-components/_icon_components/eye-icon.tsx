import { SettingSchema } from '@/app/settings/page'
import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
import React from 'react'

export default function CustomEyeIcon({
  userSettings,
  className,
  ...props
}: {
  userSettings: SettingSchema | undefined,
  className?: string
}) {
  return (
    <Eye
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

