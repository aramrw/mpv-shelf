import React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Video } from '@prisma/client';
import NameFromPath from '../../../../../../lib/hooks/name-from-path';

export default function RecentCard({ item }: { item: Video }) {
  return (
    <HoverCard closeDelay={20}>
      <HoverCardTrigger className="p-1 rounded-sm font-medium shadow-sm outline outline-zinc-100 text-sm">
        {NameFromPath({ path: item.path })}
      </HoverCardTrigger>
      <HoverCardContent className="p-4 bg-white rounded-lg shadow-lg">
        <div className="text-sm text-zinc-700 flex flex-row justify-center items-center">
          <p><strong>Watched:</strong> {item.watched ? 'Yes' : 'No'}</p>
          {/* item.lastWatchedAt && (
            <p><strong>Last Updated:</strong> {new Date(item.lastWatchedAt).toLocaleDateString()}</p>
          ) */}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

