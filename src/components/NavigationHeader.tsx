
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
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const NavigationHeader = () => {
  const location = useLocation();
  const { user, signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b border-green-200 px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <div className="modforms-text text-2xl font-bold" style={{ fontWeight: 700, letterSpacing: '0.1em', display: 'inline-block' }}>
            <span className="letter" style={{ display: 'inline-block', color: '#ef4444', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>M</span>
            <span className="letter" style={{ display: 'inline-block', color: '#fbbf24', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>o</span>
            <span className="letter" style={{ display: 'inline-block', color: '#22c55e', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>d</span>
            <span className="letter" style={{ display: 'inline-block', color: '#ef4444', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>F</span>
            <span className="letter" style={{ display: 'inline-block', color: '#fbbf24', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>o</span>
            <span className="letter" style={{ display: 'inline-block', color: '#22c55e', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>r</span>
            <span className="letter" style={{ display: 'inline-block', color: '#ef4444', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>m</span>
            <span className="letter" style={{ display: 'inline-block', color: '#fbbf24', textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>s</span>
          </div>
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
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-3 py-2 text-sm text-black hover:bg-green-50 hover:text-green-700 rounded-md"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/knowledge-base" 
                      className="flex items-center px-3 py-2 text-sm text-black hover:bg-green-50 hover:text-green-700 rounded-md"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Knowledge Base
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/pricing" 
                      className="flex items-center px-3 py-2 text-sm text-black hover:bg-green-50 hover:text-green-700 rounded-md"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pricing
                    </Link>
                  </NavigationMenuLink>
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
