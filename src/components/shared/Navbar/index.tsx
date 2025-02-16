"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SheetTrigger, SheetContent, SheetHeader, SheetDescription, Sheet } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AuthDialog from '../AuthDialog';
import { useNavbarStore } from '@/components/store/navbarStore';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import AddPhoneDialog from '../AddPhoneDialog';

type NavbarProps = {
  variant?: 'FIXED' | 'SCROLL';
  isAuthRequired?: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ variant = 'FIXED', isAuthRequired = false }) => {
  const { isAuthDialogOpen, setIsAuthDialogOpen, setIsAddPhoneDialogOpen, isAddPhoneDialogOpen } = useNavbarStore();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleTicketsClick = () => {
    if (!isAuthenticated) {
      setIsAuthDialogOpen(true);
    } else {
      router.push("/my-tickets");
    }
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  const handleLogoutClick = async () => {
    try {
      const res = await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    window.location.href = window.location.href
    } catch (error) {
      console.log(error)
    }
  };

  const checkAndInsertUser = async (user: any): Promise<{
    id: string;
    email: string | null;
    display_name: string | null;
    phone_num: string | null;
    role: string | null;
  } | null> => {
    const { data: existingUser, error: fetchError } = await supabase
      .from('user')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return null;
    }
    if (existingUser) {
      setIsAdmin(existingUser.role === 'ADMIN');
      return existingUser;
    } else {
      const newUser = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata.full_name || null,
        phone_num: user.user_metadata.phone || null,
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from('user')
        .insert(newUser)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return null;
      }

      setIsAdmin(insertedUser.role === 'ADMIN');
      return insertedUser;
    }
  };

  useEffect(() => {
   // console.log("YOOO>>>")
    let isMounted = true;
    let previousSession: Session | null = null;
    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;
     // console.log("YOOOO>>>2")
      setIsAuthenticated(!!session);
      if (isAuthRequired && !session) {
        setIsAuthDialogOpen(true);
      } else {
        setIsAuthDialogOpen(false);
        if (event === 'SIGNED_IN' && session && !previousSession) {
          const dbUser = await checkAndInsertUser(session.user);
          if (dbUser) {
            if (isMounted) {
              toast({ description: `Welcome, ${dbUser.display_name || dbUser.email}!` });
              if (!dbUser.phone_num) {
                setIsAddPhoneDialogOpen(true);
              }
            }
          } else if (isMounted) {
            toast({ description: "An error occurred while processing your account.", variant: "destructive" });
          }
        }
     //   console.log("YOOO>>>3 eventName: ", event)
      }
      previousSession = session;
    };
  
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        previousSession = session;
        await checkAndInsertUser(session.user);
      }
    };
  
    initializeAuth().then(() => {
      if (isMounted) {
        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
        return () => {
          isMounted = false;
          authListener.subscription.unsubscribe();
        };
      }
    });
  
  }, [isAuthRequired]);

  const handleAddPhoneNum = async (phoneNum: string) => {
    try {
      const response = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("user")
        .update({ phone_num: phoneNum })
        .eq("id", response.data.user?.id ?? "");

      if (error) throw error;

      toast({ description: "Phone number added successfully!" });
      setIsAddPhoneDialogOpen(false);
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({ description: "Failed to add phone number. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className={`${variant === 'FIXED' ? 'fixed' : ''} top-0 left-0 z-30 w-screen min-h-12 bg-white flex flex-col py-4 px-4 md:px-8`}>
      <AuthDialog isOpen={isAuthDialogOpen} setIsOpen={setIsAuthDialogOpen} />
      <AddPhoneDialog isOpen={isAddPhoneDialogOpen} setIsOpen={setIsAddPhoneDialogOpen} onAddPhone={handleAddPhoneNum} />
      <div className='flex items-center w-full max-w-7xl mx-auto'>
        <a href='https://gohype.id'>
          <img src="/logo.svg" className="w-20 md:w-24 h-auto" alt="Logo" />
        </a>
        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger><Menu /></SheetTrigger>
            <SheetContent className='pb-4' side={"top"}>
              <SheetHeader>
                <SheetDescription>
                  <div className="flex flex-col space-y-6 font-semibold text-primary -mt-2">
                    <img src="/logo.svg" className="w-24 h-auto" alt="Logo" />
                    {isAuthenticated && (
                      <>
                        {isAdmin ? (
                          <Button onClick={handleDashboardClick} className="bg-primary">Dashboard</Button>
                        ) : (
                          <Button onClick={handleTicketsClick} className="bg-primary">Tickets</Button>
                        )}
                        <Button onClick={handleLogoutClick} className="bg-primary">Logout</Button>
                      </>
                    )}
                    {!isAuthenticated && <Button onClick={handleTicketsClick} className="bg-primary">Tickets</Button>}
                  </div>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
        <div className="ml-auto hidden md:flex items-center space-x-6 font-semibold text-primary">
          {isAuthenticated && (
            <>
              {isAdmin ? (
                <Button onClick={handleDashboardClick} className="bg-primary">Dashboard</Button>
              ) : (
                <Button onClick={handleTicketsClick} className="bg-primary">Tickets</Button>
              )}
              <Button onClick={handleLogoutClick} className="bg-primary">Logout</Button>
            </>
          )}
          {!isAuthenticated && <Button onClick={handleTicketsClick} className="bg-primary">Tickets</Button>}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
