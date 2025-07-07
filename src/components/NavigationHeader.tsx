
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Database, DollarSign, User, LogOut } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useAppStore } from '@/store';
import { useCallback, useMemo } from 'react';
import React from 'react';

const NavigationHeaderComponent = () => {
  const location = useLocation();
  
  // Use stable selectors to prevent infinite re-renders
  const user = useAppStore(state => state.user);
  const signOut = useAppStore(state => state.signOut);

  // Memoize the sign out handler to prevent recreating it on every render
  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Memoize the navigation menu items to prevent re-creation
  const navigationItems = useMemo(() => [
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings'
    },
    {
      href: '/knowledge-base',
      icon: Database,
      label: 'Knowledge Base'
    },
    {
      href: '/pricing',
      icon: DollarSign,
      label: 'Pricing'
    }
  ], []);

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b border-green-200 px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-green-700 hover:text-green-800">
          Form Builder
        </Link>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-black hover:text-green-700">
                <User className="w-4 h-4 mr-2" />
                Account
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-48 p-2 bg-white">
                  {navigationItems.map((item) => (
                    <NavigationMenuLink asChild key={item.href}>
                      <Link 
                        to={item.href}
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-green-50 hover:text-green-700 rounded-md"
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  ))}
                  <div className="border-t border-green-200 my-1"></div>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 rounded-md text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export const NavigationHeader = React.memo(NavigationHeaderComponent);
