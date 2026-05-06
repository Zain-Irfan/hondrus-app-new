import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useOrders } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronDown, ChevronUp, Truck, MapPin, Package, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function Orders() {
  const { data: orders = [], isLoading } = useOrders();

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = (orders as any[]).filter((o: any) => {
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <Layout title="Control de Pedidos">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Control de Pedidos">
      <div className="space-y-6">
        <Card className="shadow-md border-gray-100 rounded-2xl overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por # de orden, cliente, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-primary/20 bg-white"
                spellCheck={false}
                data-gramm="false"
              />
            </div>
            <div className="text-sm font-medium text-gray-500 hidden sm:block">
              {filtered.length} {filtered.length === 1 ? "pedido" : "pedidos"}
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                    <TableHead className="w-12 text-center"></TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">ID Orden</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Cliente</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Fecha</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Total</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Método de Envío</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o: any, idx: number) => (
                    <React.Fragment key={o.id}>
                      <TableRow
                        className={`cursor-pointer hover:bg-blue-50/40 transition-colors border-gray-100 ${expandedId === o.id ? 'bg-blue-50/20' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                      >
                        <TableCell className="pl-4 text-gray-400">
                          {expandedId === o.id ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5" />}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm tracking-wide">{o.orderNumber}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm font-bold text-gray-900">{o.customerName}</div>
                          <div className="text-xs font-medium text-gray-500 mt-0.5">{o.customerEmail}</div>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {o.createdAt ? format(new Date(o.createdAt), "d MMM, yyyy", { locale: es }) : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-bold text-gray-900">${Number(o.total).toFixed(2)}</TableCell>
                        <TableCell className="py-4">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-lg border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-800">
                            <Truck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            {o.shippingCarrier || "Estándar"}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === o.id && (
                        <TableRow className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">

                              {/* Left: Products */}
                              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center mb-4 pb-2 border-b border-gray-100">
                                  <Package className="w-5 h-5 text-secondary mr-2" />
                                  <h4 className="font-bold text-gray-900">Artículos del Pedido</h4>
                                </div>
                                <div className="space-y-3">
                                  {(o.items || []).map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm group">
                                      <div className="flex items-center">
                                        <span className="font-bold text-gray-500 mr-2 bg-gray-100 w-6 h-6 flex items-center justify-center rounded">{item.quantity}x</span>
                                        <span className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{item.productName}</span>
                                      </div>
                                      <span className="font-bold text-gray-900">${Number(item.subtotal).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                                  <span className="font-medium text-gray-500">Costo de Envío ({o.shippingCarrier || "Estándar"})</span>
                                  <span className="font-bold text-gray-900">${Number(o.shippingCost).toFixed(2)}</span>
                                </div>
                                <div className="mt-2 pt-2 flex justify-between text-base">
                                  <span className="font-bold text-gray-900">Total</span>
                                  <span className="font-bold text-primary">${Number(o.total).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Right: Shipping */}
                              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center mb-4 pb-2 border-b border-gray-100">
                                  <MapPin className="w-5 h-5 text-secondary mr-2" />
                                  <h4 className="font-bold text-gray-900">Información de Entrega</h4>
                                </div>
                                {o.shippingAddress ? (
                                  <div className="space-y-2">
                                    <p className="font-bold text-gray-900">{o.shippingAddress.fullName}</p>
                                    <p className="text-gray-600 text-sm">{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}</p>
                                    <p className="text-gray-600 text-sm">{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zipCode}</p>
                                    <p className="text-gray-600 text-sm mt-2 pt-2 border-t border-gray-50"><span className="font-medium text-gray-500 mr-1">Tel:</span> {o.shippingAddress.phone}</p>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                                    Información de envío incompleta o no disponible.
                                  </div>
                                )}

                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
                                  <Truck className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Método de Envío Seleccionado</p>
                                    <p className="text-sm font-medium text-blue-900">{o.shippingCarrier || "Estándar"}</p>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-lg font-medium text-gray-900">No se encontraron pedidos</p>
                          <p className="text-sm">Ajusta los términos de búsqueda.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
