import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { User, Package, MapPin, Settings, LogOut, Heart, Edit2, Shield, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useUser } from "@/hooks/use-user";

function GuestView({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden bg-primary mb-8 p-10 text-center text-white">
            <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[10rem] leading-none flex items-center justify-center font-serif">🇭🇳</div>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white/80" />
              </div>
              <h1 className="text-3xl font-serif font-bold mb-2">{t.account?.title ?? "My Account"}</h1>
              <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto">
                {t.auth?.accountPageDesc ?? "Sign in to track orders, save your shipping address, and check out faster."}
              </p>
            </div>
          </div>

          {/* Sign-in CTA */}
          <div className="bg-card rounded-3xl border shadow-sm p-8 mb-6 text-center">
            <h2 className="text-xl font-serif font-bold mb-2">{t.auth?.signInTitle ?? "Sign In / Register"}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {t.auth?.signInDesc ?? "Sign in or create your account in seconds with Google or your email."}
            </p>
            <Button
              type="button"
              className="h-12 px-8 rounded-full text-base font-bold"
              onClick={onSignIn}
            >
              {t.auth?.signIn ?? "Sign In"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "📦", title: t.auth?.benefit1Title ?? "Order History", desc: t.auth?.benefit1Desc ?? "View all your past orders in one place." },
              { icon: "📍", title: t.auth?.benefit2Title ?? "Saved Address", desc: t.auth?.benefit2Desc ?? "Store your shipping address for faster checkout." },
              { icon: "⚡", title: t.auth?.benefit3Title ?? "Fast Checkout", desc: t.auth?.benefit3Desc ?? "Pre-filled forms so you can check out in seconds." },
            ].map((b) => (
              <div key={b.title} className="bg-card rounded-2xl border p-5 text-center">
                <div className="text-3xl mb-3">{b.icon}</div>
                <div className="font-bold text-sm mb-1">{b.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Account() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const { email, logout } = useUser();
  const dateLocale = lang === "en" ? enUS : es;

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "", phone: "", line1: "", line2: "", city: "", state: "", zipCode: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        line1: profile.defaultAddress?.line1 || "",
        line2: profile.defaultAddress?.line2 || "",
        city: profile.defaultAddress?.city || "",
        state: profile.defaultAddress?.state || "",
        zipCode: profile.defaultAddress?.zipCode || ""
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      data: {
        name: formData.name,
        phone: formData.phone,
        defaultAddress: { fullName: formData.name, phone: formData.phone, line1: formData.line1, line2: formData.line2, city: formData.city, state: formData.state, zipCode: formData.zipCode }
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        setIsEditing(false);
        toast({ title: t.account.toastTitle, description: t.account.toastDesc });
      }
    });
  };

  // Show sign-in gate if not logged in
  if (!email) {
    return <GuestView onSignIn={() => {}} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20 container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4 lg:col-span-3"><Skeleton className="h-96 w-full rounded-2xl" /></div>
            <div className="md:col-span-8 lg:col-span-9"><Skeleton className="h-[600px] w-full rounded-2xl" /></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-10">
            <h1 className="text-4xl font-serif font-bold text-foreground">{t.account.title}</h1>
            <p className="text-muted-foreground mt-2">{t.account.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 lg:gap-10">
            <div className="md:col-span-4 lg:col-span-3 space-y-6">
              <div className="bg-card rounded-3xl border shadow-sm p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-primary/10"></div>
                <div className="relative z-10 w-24 h-24 bg-background border-4 border-background shadow-md rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-serif font-bold text-primary">
                  {profile?.name?.charAt(0)?.toUpperCase() || <User className="w-10 h-10 text-muted-foreground" />}
                </div>
                <h2 className="font-serif font-bold text-2xl mb-1 truncate px-2">{profile?.name || t.account.user}</h2>
                <p className="text-sm text-muted-foreground mb-4 truncate px-2">{profile?.email}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  {t.account.memberSince} {profile?.joinedAt ? format(new Date(profile.joinedAt), lang === "en" ? "MMM yyyy" : "MMM yyyy", { locale: dateLocale }) : t.account.recently}
                </div>
              </div>

              <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-3">
                <nav className="flex flex-col gap-1">
                  <button onClick={() => setActiveTab('profile')} className={cn("flex items-center gap-3 w-full p-4 rounded-2xl text-left font-medium transition-all", activeTab === 'profile' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted/60 text-foreground")}>
                    <User className="w-5 h-5" /> {t.account.myProfile}
                  </button>
                  <Link href="/orders" className="flex items-center justify-between w-full p-4 rounded-2xl text-left font-medium hover:bg-muted/60 text-foreground transition-all group">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /> {t.account.myOrders}
                    </div>
                    <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {profile?.orderCount || 0}
                    </div>
                  </Link>
                  <button className="flex items-center gap-3 w-full p-4 rounded-2xl text-left font-medium hover:bg-muted/60 text-foreground transition-all text-muted-foreground">
                    <Heart className="w-5 h-5" /> {t.account.favorites} <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full ml-auto">{t.account.favoritesComingSoon}</span>
                  </button>
                  <button className="flex items-center gap-3 w-full p-4 rounded-2xl text-left font-medium hover:bg-muted/60 text-foreground transition-all text-muted-foreground">
                    <Settings className="w-5 h-5" /> {t.account.settings}
                  </button>
                </nav>
                <div className="mt-2 pt-2 border-t">
                  <button onClick={logout} className="flex items-center gap-3 w-full p-4 rounded-2xl text-left font-medium text-destructive hover:bg-destructive/10 transition-all">
                    <LogOut className="w-5 h-5" /> {t.account.logout}
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9">
              <div className="bg-card rounded-3xl border shadow-sm overflow-hidden h-full">
                <div className="p-8 border-b bg-muted/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">{t.account.personalInfo}</h2>
                    <p className="text-muted-foreground mt-1">{t.account.personalInfoSub}</p>
                  </div>
                  {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full shadow-sm gap-2">
                      <Edit2 className="w-4 h-4" /> {t.account.editBtn}
                    </Button>
                  )}
                </div>

                <div className="p-8">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> {t.account.basicData}</h3>
                        <div className="grid sm:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-dashed">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold">{t.account.fullName}</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-12 bg-background shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-bold">{t.account.phone}</Label>
                            <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 bg-background shadow-sm" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {t.account.defaultAddress}</h3>
                        <div className="space-y-5 bg-muted/20 p-6 rounded-2xl border border-dashed">
                          <div className="space-y-2">
                            <Label htmlFor="line1" className="text-sm font-bold">{t.account.address}</Label>
                            <Input id="line1" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} className="h-12 bg-background shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="line2" className="text-sm font-bold text-muted-foreground">{t.account.apt}</Label>
                            <Input id="line2" value={formData.line2} onChange={e => setFormData({...formData, line2: e.target.value})} className="h-12 bg-background shadow-sm" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-5">
                            <div className="space-y-2 col-span-2 sm:col-span-3">
                              <Label htmlFor="city" className="text-sm font-bold">{t.account.city}</Label>
                              <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 bg-background shadow-sm" />
                            </div>
                            <div className="space-y-2 col-span-1 sm:col-span-1">
                              <Label htmlFor="state" className="text-sm font-bold">{t.account.state}</Label>
                              <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="h-12 bg-background shadow-sm" placeholder={t.account.stateHint} />
                            </div>
                            <div className="space-y-2 col-span-1 sm:col-span-2">
                              <Label htmlFor="zipCode" className="text-sm font-bold">{t.account.zip}</Label>
                              <Input id="zipCode" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} className="h-12 bg-background shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 rounded-full px-8">{t.account.cancel}</Button>
                        <Button type="submit" disabled={updateProfile.isPending} className="h-12 rounded-full px-8 shadow-md">
                          {updateProfile.isPending ? t.account.saving : t.account.save}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted-foreground"><User className="w-5 h-5" /> {t.account.basicData}</h3>
                        <div className="grid sm:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-2xl border">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.account.fullName}</div>
                            <div className="font-bold text-lg">{profile?.name || "—"}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.account.phone}</div>
                            <div className="font-bold text-lg">{profile?.phone || "—"}</div>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t.account.emailLabel}</div>
                            <div className="font-bold text-lg">{profile?.email || "—"}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted-foreground"><MapPin className="w-5 h-5" /> {t.account.shippingAddress}</h3>
                        <div className="bg-muted/10 p-6 rounded-2xl border">
                          {profile?.defaultAddress?.line1 ? (
                            <div className="space-y-2 text-lg">
                              <div className="font-bold">{profile.defaultAddress.fullName || profile.name}</div>
                              <div>{profile.defaultAddress.line1}</div>
                              {profile.defaultAddress.line2 && <div>{profile.defaultAddress.line2}</div>}
                              <div>{profile.defaultAddress.city}, {profile.defaultAddress.state} {profile.defaultAddress.zipCode}</div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
                              <p>{t.account.noAddress}</p>
                              <Button variant="link" onClick={() => setIsEditing(true)} className="text-primary mt-2">{t.account.addAddress}</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
