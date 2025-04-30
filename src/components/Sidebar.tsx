import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, PlusCircle, List, Settings, LogOut, HelpCircle } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Logo } from "./Logo";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      title: "Início",
      icon: Home,
      href: "/",
    },
    {
      title: "Criar Demanda",
      icon: PlusCircle,
      href: "/builder",
    },
    {
      title: "Demandas",
      icon: List,
      href: "/prompts",
    },
    {
      title: "Ajuda",
      icon: HelpCircle,
      href: "/guide",
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/settings",
    },
  ];

  // Fecha o menu ao mudar de rota em telas menores
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      <div className="flex-1 py-4">
        <div className="px-3 py-2">
          <div className="flex flex-col items-center mb-6 pt-2">
            <Logo size="lg" className="mb-2" />
          </div>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
              >
                <Button
                  variant={location.pathname === item.href ? undefined : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.href &&
                      "h-12 bg-gradient-to-r from-[#61CE70] to-[#58FF0F] hover:from-[#58FF0F] hover:to-[#61CE70] text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[240px] border-r border-border">
        <SidebarContent />
      </aside>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px] bg-background">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
} 