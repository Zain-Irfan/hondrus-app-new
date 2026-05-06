import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api/admin";

function getHeaders() {
  const key = localStorage.getItem("adminKey") || "";
  return { "Content-Type": "application/json", "x-admin-key": key };
}

type StripeStatus = {
  configured: boolean;
  source: "admin" | "integration" | "none";
  publishableKeyMasked: string;
  secretKeySet: boolean;
};

type FreeShippingStatus = { threshold: number };

export function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("");

  const { data: freeShipping, isLoading: freeShippingLoading } = useQuery<FreeShippingStatus>({
    queryKey: ["admin", "settings", "freeShipping"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/settings/free-shipping`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Error al cargar el umbral");
      return res.json();
    },
  });

  useEffect(() => {
    if (typeof freeShipping?.threshold === "number") {
      setThresholdInput(String(freeShipping.threshold));
    }
  }, [freeShipping?.threshold]);

  const saveThreshold = useMutation({
    mutationFn: async (threshold: number) => {
      const res = await fetch(`${API_BASE}/settings/free-shipping`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ threshold }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Error al guardar");
      return data as FreeShippingStatus;
    },
    onSuccess: (data) => {
      toast({ title: "Umbral guardado", description: `Envío gratis a partir de $${data.threshold.toFixed(2)}.`, className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      qc.invalidateQueries({ queryKey: ["admin", "settings", "freeShipping"] });
    },
    onError: (err: any) => {
      toast({ title: "Error al guardar", description: err?.message ?? "Intenta de nuevo", variant: "destructive" });
    },
  });

  function handleSaveThreshold(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(thresholdInput);
    if (!Number.isFinite(n) || n < 0) {
      toast({ title: "Valor inválido", description: "Ingresa un número mayor o igual a 0.", variant: "destructive" });
      return;
    }
    saveThreshold.mutate(n);
  }

  const { data: status, isLoading } = useQuery<StripeStatus>({
    queryKey: ["admin", "settings", "stripe"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/settings/stripe`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Error al cargar configuración");
      return res.json();
    },
  });

  useEffect(() => {
    if (status?.source === "admin" && status.publishableKeyMasked) {
      setPublishableKey(status.publishableKeyMasked);
    }
  }, [status]);

  const saveKeys = useMutation({
    mutationFn: async (payload: { publishableKey: string; secretKey: string }) => {
      const res = await fetch(`${API_BASE}/settings/stripe`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Error al guardar");
      return data as StripeStatus;
    },
    onSuccess: () => {
      toast({ title: "Claves de Stripe guardadas", description: "Los pagos ahora usarán estas claves.", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      setSecretKey("");
      qc.invalidateQueries({ queryKey: ["admin", "settings", "stripe"] });
    },
    onError: (err: any) => {
      toast({ title: "Error al guardar", description: err?.message ?? "Intenta de nuevo", variant: "destructive" });
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const pk = publishableKey.trim();
    const sk = secretKey.trim();
    if (!pk || !sk) {
      toast({ title: "Completa ambos campos", description: "Necesitas la clave pública y la secreta.", variant: "destructive" });
      return;
    }
    if (pk.includes("…")) {
      toast({ title: "Pega la clave pública completa", description: "Estás viendo la versión enmascarada.", variant: "destructive" });
      return;
    }
    saveKeys.mutate({ publishableKey: pk, secretKey: sk });
  }

  return (
    <Layout title="Configuración">
      <div className="max-w-3xl space-y-6">
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Envío gratis</h2>
              <p className="text-white/80 text-sm">Define el monto mínimo del pedido que activa envío gratis.</p>
            </div>
          </div>
          <CardContent className="p-6">
            {freeShippingLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <form onSubmit={handleSaveThreshold} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Monto mínimo (USD)</Label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border-gray-300 focus:border-primary rounded-lg h-11 pl-7 font-mono text-sm"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      placeholder="75"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Pedidos cuyo subtotal alcance este monto recibirán <strong>envío gratis</strong> automáticamente. Sube el monto (por ejemplo, <code className="bg-gray-100 px-1.5 py-0.5 rounded">9999</code>) si quieres que <strong>nunca</strong> se aplique. Usa <code className="bg-gray-100 px-1.5 py-0.5 rounded">0</code> sólo si quieres ofrecer envío gratis en <strong>todos</strong> los pedidos.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={saveThreshold.isPending}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg h-11 px-6 font-medium shadow-sm"
                >
                  {saveThreshold.isPending ? "Guardando..." : "Guardar umbral"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Pagos con Stripe</h2>
              <p className="text-white/80 text-sm">Configura las claves API para procesar pagos en tu tienda.</p>
            </div>
          </div>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  {status?.configured ? (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-900">Stripe está activo</p>
                        <p className="text-emerald-700 mt-0.5">
                          {status.source === "admin"
                            ? "Usando claves configuradas desde este panel."
                            : "Usando claves de la integración de Replit."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">Stripe aún no está configurado</p>
                        <p className="text-amber-700 mt-0.5">Tus clientes no podrán pagar hasta que agregues las claves abajo.</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Clave Pública (Publishable Key)</Label>
                    <Input
                      className="border-gray-300 focus:border-primary rounded-lg h-11 font-mono text-sm"
                      value={publishableKey}
                      onChange={(e) => setPublishableKey(e.target.value)}
                      placeholder="pk_live_… o pk_test_…"
                      spellCheck={false}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500">Empieza con <code className="bg-gray-100 px-1.5 py-0.5 rounded">pk_live_</code> (producción) o <code className="bg-gray-100 px-1.5 py-0.5 rounded">pk_test_</code> (pruebas).</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Clave Secreta (Secret Key)</Label>
                    <div className="relative">
                      <Input
                        type={showSecret ? "text" : "password"}
                        className="border-gray-300 focus:border-primary rounded-lg h-11 font-mono text-sm pr-11"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder={status?.secretKeySet ? "•••••••• (deja en blanco para mantener)" : "sk_live_… o sk_test_…"}
                        spellCheck={false}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Empieza con <code className="bg-gray-100 px-1.5 py-0.5 rounded">sk_live_</code> o <code className="bg-gray-100 px-1.5 py-0.5 rounded">sk_test_</code>. Por seguridad, no se muestra después de guardar.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={saveKeys.isPending}
                      className="bg-primary hover:bg-primary/90 text-white rounded-lg h-11 px-6 font-medium shadow-sm"
                    >
                      {saveKeys.isPending ? "Guardando..." : "Guardar claves"}
                    </Button>
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-4"
                    >
                      Obtener claves en Stripe <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">¿Dónde encuentro mis claves?</h3>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-decimal pl-5">
                    <li>Inicia sesión en tu cuenta de Stripe.</li>
                    <li>Ve a <strong>Developers → API keys</strong> en el menú lateral.</li>
                    <li>Copia la <em>Publishable key</em> y la <em>Secret key</em> (revela la secreta haciendo click).</li>
                    <li>Para cobros reales usa las claves <strong>live</strong>; para pruebas usa <strong>test</strong>.</li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
