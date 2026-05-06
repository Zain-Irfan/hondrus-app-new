import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { setGuestTokenGetter } from "@workspace/api-client-react";
import { getGuestId } from "@/lib/guestId";
import { CustomSignUp } from "@/components/auth/custom-sign-up";
import { CustomSignIn } from "@/components/auth/custom-sign-in";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { UserProvider } from "@/hooks/use-user";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Account from "@/pages/account";
import Brands from "@/pages/brands";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import Shipping from "@/pages/shipping";
import Contact from "@/pages/contact";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#002B7F",
    colorForeground: "#0a0f1f",
    colorMutedForeground: "#5b6478",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0a0f1f",
    colorNeutral: "#d6dae3",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-full sm:w-[440px] max-w-[440px] mx-auto overflow-hidden shadow-xl border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#002B7F] font-serif text-2xl font-bold",
    headerSubtitle: "text-gray-600",
    socialButtonsBlockButtonText: "text-gray-800 font-semibold",
    formFieldLabel: "text-gray-700 font-semibold text-sm",
    footerActionLink: "text-[#002B7F] font-semibold hover:text-[#C9A84C]",
    footerActionText: "text-gray-600",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-[#002B7F]",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-rose-700",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 rounded-lg",
    formButtonPrimary: "bg-[#002B7F] hover:bg-[#001f5f] text-white font-semibold rounded-lg",
    formFieldInput: "border border-gray-300 rounded-lg focus:border-[#002B7F] focus:ring-[#002B7F]/20",
    footerAction: "text-sm",
    dividerLine: "bg-gray-200",
    alert: "bg-rose-50 border border-rose-200 rounded-lg",
    otpCodeFieldInput: "border border-gray-300 rounded-lg",
    formFieldRow: "space-y-1.5",
    main: "gap-5",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#002B7F]/5 via-white to-[#C9A84C]/5 px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px]">
        <CustomSignIn />
      </div>
    </div>
  );
}

function SignInSsoCallbackPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#002B7F]/5 via-white to-[#C9A84C]/5 px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px]">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#002B7F]/5 via-white to-[#C9A84C]/5 px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px]">
        <CustomSignUp />
      </div>
    </div>
  );
}

function SignUpSsoCallbackPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#002B7F]/5 via-white to-[#C9A84C]/5 px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px]">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/account" component={Account} />
      <Route path="/brands" component={Brands} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/contact" component={Contact} />
      <Route path="/sign-in/sso-callback" component={SignInSsoCallbackPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/sso-callback" component={SignUpSsoCallbackPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Register the guest token header injector once at module init so it's
// already in place before the first generated-client call fires.
setGuestTokenGetter(() => {
  try { return getGuestId(); } catch { return null; }
});

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={basePath || "/"}
      signUpFallbackRedirectUrl={basePath || "/"}
      localization={{
        signIn: {
          start: {
            title: "Bienvenido de vuelta",
            subtitle: "Inicia sesión para acceder a tu cuenta",
          },
        },
        signUp: {
          start: {
            title: "Crea tu cuenta",
            subtitle: "Únete a Sabores de Honduras",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <LanguageProvider>
          <UserProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </UserProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
