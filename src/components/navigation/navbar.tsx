'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code, Settings, Home, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Projects', href: '/', icon: Home },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-6"> {/* Adjusted padding from px-8 to px-6 */}
        <div className="flex h-16 items-center justify-between"> {/* Adjusted height from h-20 to h-16 */}
          <div className="flex items-center gap-8"> {/* Adjusted gap from 10 to 8 */}
            <Link href="/" className="flex items-center gap-3 group"> {/* Adjusted gap from 4 to 3 */}
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md ring-1 ring-blue-500/20"> {/* Simplified size, bg, rounded, shadow, ring, removed hover anim */}
                <Code className="h-5 w-5 text-white" /> {/* Adjusted icon size */}
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-slate-50 tracking-tight"> {/* Simplified font, size, color */}
                Code Index
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost" // Simplified variant logic, active state handled by className
                      size="sm"
                      className={cn(
                        'flex items-center gap-2 transition-colors duration-200 rounded-md px-4 py-2 font-medium text-sm', // Adjusted gap, padding, font, rounded
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' // Simplified active state
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100' // Simplified hover
                      )}
                    >
                      <Icon className="h-4 w-4" /> {/* Adjusted icon size */}
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"> {/* Simplified badge */}
              <div className="w-2 h-2 bg-green-500 rounded-full"></div> {/* Removed pulse, adjusted size */}
              <span className="font-medium">AI-Powered Analysis</span> {/* Adjusted font */}
            </div>

            <div className="flex items-center"> {/* Removed gap-3, rely on button margin if needed */}
              <Button
                variant="ghost" // Changed to ghost for a simpler look
                size="sm"
                className="hidden sm:flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md px-3 py-2" // Simplified classes, removed shadows, scale, backdrop
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-1.5" /> {/* Adjusted icon size and margin */}
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
