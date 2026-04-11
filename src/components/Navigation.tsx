import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { User, LogOut, Library, Menu } from 'lucide-react';

export function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Branding */}
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Shynese
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/manage">
                <Button variant="ghost" size="sm">
                  <Library className="w-4 h-4 mr-2" />
                  Characters
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.user_metadata?.name || user.email}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <div className="flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500 truncate">
                      {user.user_metadata?.name || user.email}
                    </div>
                    <Link to="/manage" onClick={close}>
                      <Button variant="ghost" className="w-full justify-start min-h-[44px]">
                        <Library className="w-4 h-4 mr-2" />
                        Characters
                      </Button>
                    </Link>
                    <Link to="/account" onClick={close}>
                      <Button variant="ghost" className="w-full justify-start min-h-[44px]">
                        <User className="w-4 h-4 mr-2" />
                        Account
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start min-h-[44px]"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={close}>
                      <Button variant="ghost" className="w-full justify-start min-h-[44px]">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={close}>
                      <Button className="w-full min-h-[44px]">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
