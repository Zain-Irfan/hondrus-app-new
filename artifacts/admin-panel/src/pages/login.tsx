import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, Store } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function Login() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(password, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Brand Identity */}
      <div className="hidden lg:flex w-1/2 bg-primary relative flex-col justify-between overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-black/60 z-0"></div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl z-0 pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl z-0 pointer-events-none"></div>

        <div className="relative z-10 p-12 flex flex-col h-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
              <Store className="w-6 h-6 text-secondary" />
            </div>
            <span className="font-bold text-2xl tracking-tight">Sabores de Honduras</span>
          </div>

          <div className="mt-auto mb-12 max-w-lg space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Gestiona tu tienda con <span className="text-secondary">precisión.</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              El panel de control diseñado para administrar productos, procesar pedidos y rastrear el crecimiento de tu negocio de forma centralizada.
            </p>
          </div>
          
          <div className="flex items-center text-sm text-primary-foreground/60 font-medium">
            &copy; {new Date().getFullYear()} Sabores de Honduras LLC.
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Header */}
          <div className="flex lg:hidden flex-col items-center justify-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <Store className="w-8 h-8 text-secondary transform -rotate-3" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sabores de Honduras</h1>
              <p className="text-gray-500 mt-2">Panel de Administración</p>
            </div>
          </div>

          <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl">
            <div className="h-1.5 bg-gradient-to-r from-primary via-blue-600 to-secondary w-full"></div>
            <CardHeader className="space-y-2 pb-6 pt-8 px-8">
              <CardTitle className="text-2xl font-bold">Acceso Restringido</CardTitle>
              <CardDescription className="text-base">Ingresa tu clave maestra para entrar al centro de mando.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {login.isError && (
                  <Alert variant="destructive" className="bg-red-50 text-red-600 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      {login.error?.message || "Clave incorrecta"}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="password" 
                      placeholder="Clave de acceso" 
                      className="pl-11 h-12 text-base rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 transition-all bg-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={login.isPending}
                      autoFocus
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
                  disabled={login.isPending || !password}
                >
                  {login.isPending ? "Verificando identidad..." : "Ingresar al Sistema"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-gray-400 font-medium">
            Uso exclusivo para administradores autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
