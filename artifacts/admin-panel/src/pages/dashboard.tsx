import { Layout } from "@/components/layout";
import { useStats } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, Tags, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function Dashboard() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <Layout title="Resumen del Negocio">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout title="Resumen del Negocio">
        <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-xl shadow-sm font-medium">Error al cargar estadísticas. Revisa tu conexión o la clave de acceso.</div>
      </Layout>
    );
  }

  const stockPercentage = Math.max(0, 100 - (stats.outOfStock / Math.max(1, stats.totalProducts)) * 100);

  return (
    <Layout title="Resumen del Negocio">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Ingresos Totales" 
            value={`$${stats.totalRevenue?.toFixed(2) || '0.00'}`} 
            icon={DollarSign} 
            trend="+12.5%"
            trendUp={true}
            gradient="from-blue-600 to-blue-800"
            iconBg="bg-blue-500/20"
            iconColor="text-white"
          />
          <MetricCard 
            title="Pedidos Totales" 
            value={stats.totalOrders} 
            icon={ShoppingCart} 
            trend="+8.2%"
            trendUp={true}
            gradient="from-emerald-500 to-emerald-700"
            iconBg="bg-emerald-400/20"
            iconColor="text-white"
          />
          <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Package className="w-24 h-24 transform rotate-12" />
            </div>
            <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Inventario</p>
                  <h3 className="text-3xl font-bold tracking-tight mt-1">{stats.totalProducts} <span className="text-lg font-normal text-white/80">ítems</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-white/90">Nivel de Stock</span>
                  <span className="text-white">{Math.round(stockPercentage)}%</span>
                </div>
                <Progress value={stockPercentage} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                {stats.outOfStock > 0 && (
                  <p className="text-xs text-white/80 mt-3 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-2 animate-pulse"></span>
                    {stats.outOfStock} agotados - requieren atención
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <MetricCard 
            title="Categorías" 
            value={stats.totalCategories} 
            icon={Tags} 
            gradient="from-purple-600 to-purple-800"
            iconBg="bg-purple-500/20"
            iconColor="text-white"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-md border-gray-100 rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 py-5">
                <CardTitle className="text-lg font-bold text-gray-900">Pedidos Recientes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentOrders?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow className="border-gray-100">
                          <TableHead className="font-semibold text-gray-600">Orden</TableHead>
                          <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                          <TableHead className="font-semibold text-gray-600">Total</TableHead>
                          <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recentOrders.map((order: any, idx: number) => (
                          <TableRow key={order.id} className={`border-gray-50 hover:bg-gray-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <TableCell className="font-bold text-gray-900">{order.orderNumber}</TableCell>
                            <TableCell className="font-medium text-gray-700">{order.customerName}</TableCell>
                            <TableCell className="font-bold text-gray-900">${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 font-medium">No hay pedidos recientes.</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-md border-gray-100 rounded-2xl">
              <CardHeader className="border-b border-gray-100 py-5">
                <CardTitle className="text-lg font-bold text-gray-900">Distribución de Estados</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {Object.entries(stats.statusCounts || {}).length > 0 ? (
                  Object.entries(stats.statusCounts || {}).map(([status, count]) => {
                    const totalOrders = stats.totalOrders || 1;
                    const percent = Math.round((Number(count) / totalOrders) * 100);
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <StatusBadge status={status} />
                          <span className="font-bold text-gray-900">{String(count)} <span className="text-gray-400 font-medium text-sm ml-1">({percent}%)</span></span>
                        </div>
                        <Progress value={percent} className="h-1.5 bg-gray-100" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 font-medium text-sm">Sin datos de distribución.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon: Icon, gradient, iconBg, iconColor, trend, trendUp }: any) {
  return (
    <Card className={`shadow-lg border-0 rounded-2xl bg-gradient-to-br ${gradient} text-white overflow-hidden relative group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
        <Icon className="w-24 h-24 transform -rotate-12" />
      </div>
      <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-4xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${iconBg} backdrop-blur-md shadow-inner`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm font-medium">
            <div className={`flex items-center px-2 py-1 rounded-md ${trendUp ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'}`}>
              <TrendingUp className={`w-3.5 h-3.5 mr-1 ${trendUp ? '' : 'rotate-180'}`} />
              {trend}
            </div>
            <span className="text-white/70 ml-2 text-xs">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, cls: string, dot: string }> = {
    'pending': { label: 'Pendiente', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    'confirmed': { label: 'Confirmado', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    'processing': { label: 'En proceso', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    'shipped': { label: 'Enviado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    'delivered': { label: 'Entregado', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    'cancelled': { label: 'Cancelado', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
  };
  
  const mapped = map[status] || { label: status, cls: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${mapped.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${mapped.dot}`}></span>
      {mapped.label}
    </span>
  );
}
