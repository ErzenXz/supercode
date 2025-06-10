'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ProjectsLoadingSkeleton() {
  const skeletonItems = Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${Date.now()}-${i}` }))
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletonItems.map((item) => (
        <Card key={item.id} className="animate-pulse">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              </div>
              <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
