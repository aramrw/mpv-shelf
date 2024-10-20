import { SettingSchema } from '@/app/settings/page'
import { cn } from '@/lib/utils'
import React from 'react'

export default function DynTextSpan({
  userSettings,
  text,
  className,
  ...props
}: {
  text?: string,
  userSettings: SettingSchema | undefined,
  className?: string
}) {
  return (
    <span
      {...props}
      className={cn("font-medium",
        userSettings?.fontSize === "Medium" && 'text-base',
        userSettings?.fontSize === "Large" && 'text-lg',
        userSettings?.fontSize === "XLarge" && 'text-xl',
        className,
      )}>{text}</span>
  )
}

