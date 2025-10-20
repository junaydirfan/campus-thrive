/**
 * CampusThrive Main Layout Component
 * 
 * Provides responsive navigation and layout structure for:
 * - Mobile-first design with bottom navigation
 * - Desktop sidebar navigation
 * - Clean header with privacy indicators
 * - Smooth transitions and accessibility features
 */

'use client';

import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { ErrorBoundary as AppErrorBoundary } from './ErrorBoundary';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { 
  Home, 
  BarChart3, 
  Grid3X3, 
  Download,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Loader2
} from 'lucide-react';

/**
 * Sidebar Context for managing sidebar state
 */
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

/**
 * Navigation item interface
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

/**
 * Navigation configuration
 */
const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'checkin',
    label: 'Check-in',
    icon: Home,
    href: '/',
    description: 'Daily mood and wellness tracking'
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: BarChart3,
    href: '/trends',
    description: 'View your wellness trends and patterns'
  },
  {
    id: 'patterns',
    label: 'Patterns',
    icon: Grid3X3,
    href: '/patterns',
    description: 'Discover insights and correlations'
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    href: '/export',
    description: 'Download your data securely'
  }
];

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading CampusThrive...</p>
      </div>
    </div>
  );
}

/**
 * Privacy Indicator Component
 */
function PrivacyIndicator() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <ShieldCheck className="w-4 h-4 text-green-600" />
      <span className="hidden sm:inline">Data stays local</span>
      <span className="sm:hidden">Local</span>
    </div>
  );
}

/**
 * Mobile Bottom Navigation Component
 */
function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="grid grid-cols-4 h-16">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.description}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Desktop Sidebar Navigation Component
 */
function DesktopSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <aside className={`hidden md:flex md:flex-col bg-card border-r border-border transition-all duration-300 ${
      isCollapsed ? 'md:w-16' : 'md:w-64 lg:w-72'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">CampusThrive</h1>
                <p className="text-xs text-muted-foreground">Student Wellness</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={isCollapsed ? item.description : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              )}
            </a>
          );
        })}
      </nav>

      {/* Privacy Indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <PrivacyIndicator />
        </div>
      )}
    </aside>
  );
}

/**
 * Main Header Component
 */
function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CampusThrive</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Student Wellness Tracker</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <PrivacyIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/**
 * Main Layout Component Props
 */
interface LayoutProps {
  children: ReactNode;
  isLoading?: boolean;
}

/**
 * Main Layout Component
 */
export function Layout({ children, isLoading = false }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AppErrorBoundary>
      <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
        <div className="min-h-screen bg-background">
          {/* Desktop Layout */}
          <div className="hidden md:flex min-h-screen">
            <DesktopSidebar />
            <main className={`flex-1 flex flex-col transition-all duration-300 ${
              isCollapsed ? 'ml-2' : 'ml-6'
            }`}>
              <Header />
              <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-6 py-6 max-w-7xl">
                  {children}
                </div>
              </div>
            </main>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden min-h-screen">
            <Header />
            <main className="pb-16">
              <div className="container mx-auto px-4 py-6">
                {children}
              </div>
            </main>
            <MobileBottomNav />
          </div>
        </div>
      </SidebarContext.Provider>
    </AppErrorBoundary>
  );
}

/**
 * Page Container Component for consistent spacing
 */
export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <AppErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {children}
      </div>
    </AppErrorBoundary>
  );
}

/**
 * Section Component for content organization
 */
export function Section({ 
  children, 
  title, 
  description, 
  className = '' 
}: { 
  children: ReactNode; 
  title?: string; 
  description?: string; 
  className?: string; 
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Card Component for consistent styling
 */
export function Card({ 
  children, 
  className = '', 
  padding = 'default' 
}: { 
  children: ReactNode; 
  className?: string; 
  padding?: 'default' | 'none' | 'sm' | 'lg'; 
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-card border border-border rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Button Component with consistent styling
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'default', 
  className = '', 
  ...props 
}: { 
  children: ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; 
  size?: 'sm' | 'default' | 'lg'; 
  className?: string; 
  [key: string]: unknown; 
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
