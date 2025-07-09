import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const MainHeader = () => {
  const { user, signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  const userInitials = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="text-xl font-bold tracking-wide">
              <span className="text-red-500">M</span>
              <span className="text-yellow-500">o</span>
              <span className="text-green-500">d</span>
              <span className="text-red-500">F</span>
              <span className="text-yellow-500">o</span>
              <span className="text-green-500">r</span>
              <span className="text-red-500">m</span>
              <span className="text-yellow-500">s</span>
            </div>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};