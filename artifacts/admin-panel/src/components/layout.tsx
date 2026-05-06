import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@/hooks/use-api";
import { LayoutDashboard, Package, ShoppingCart, Tags, LogOut, Store, Menu, X, User, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, actions }: LayoutProps) {
  const [location] = useLocation();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
    { href: "/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/products", label: "Productos", icon: Package },
    { href: "/categories", label: "Categorías", icon: Tags },
    { href: "/settings", label: "Configuración", icon: SettingsIcon },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3 shadow-md">
          <Store className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-white">Sabores de Honduras</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4">Menú Principal</p>
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center px-3 py-2.5 rounded-md transition-all text-sm font-medium border-l-4 ${
              isActive 
                ? "bg-sidebar-accent text-white border-secondary shadow-sm" 
                : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white"
            }`}>
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-secondary' : 'opacity-80'}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
        <div className="flex items-center px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center mr-3 border border-sidebar-border">
            <User className="w-4 h-4 text-sidebar-foreground/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Administrador</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">admin@sabores.com</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/80 border border-transparent hover:border-sidebar-border transition-colors" onClick={logout}>
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2 -ml-2 text-gray-600" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            {title && <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
