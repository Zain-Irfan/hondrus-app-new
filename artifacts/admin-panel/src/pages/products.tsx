import { useState } from "react";
import { Layout } from "@/components/layout";
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, Search, Filter, AlertTriangle, Package } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  name: "", slug: "", description: "", price: "", imageUrl: "",
  categoryId: "", categoryName: "", origin: "Olancho, Honduras",
  isBestseller: false, isFeatured: false, inStock: true,
  stockQuantity: "100", weight: "0.50", tags: "[]",
};

export function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = (products as any[])
    .filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => b.id - a.id);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(product: any) {
    setEditId(String(product.id));
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      categoryId: String(product.categoryId),
      categoryName: product.categoryName,
      origin: product.origin,
      isBestseller: product.isBestseller,
      isFeatured: product.isFeatured,
      inStock: product.inStock,
      stockQuantity: String(product.stockQuantity),
      weight: String(product.weight ?? "0.50"),
      tags: "[]",
    });
    setDialogOpen(true);
  }

  function handleCategoryChange(catId: string) {
    const cat = (categories as any[]).find((c: any) => String(c.id) === catId);
    setForm(f => ({ ...f, categoryId: catId, categoryName: cat?.name ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price),
      categoryId: Number(form.categoryId),
      stockQuantity: Number(form.stockQuantity),
      weight: parseFloat(form.weight),
      tags: form.tags || "[]",
    };
    try {
      if (editId) {
        await updateProduct.mutateAsync({ id: editId, data: payload });
        toast({ title: "Producto actualizado correctamente", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      } else {
        await createProduct.mutateAsync(payload);
        toast({ title: "Producto creado exitosamente", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error al guardar el producto", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Producto eliminado", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  const actions = (
    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm h-10 px-5 rounded-lg">
      <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
    </Button>
  );

  if (isLoading) {
    return (
      <Layout title="Productos" actions={actions}>
        <div className="space-y-4">
          <Skeleton className="h-14 w-full max-w-md rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Productos" actions={actions}>
      <div className="space-y-6">
        <Card className="shadow-md border-gray-100 rounded-2xl overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos, categorías..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-primary/20 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
              <Filter className="w-4 h-4" />
              <span className="font-medium text-gray-900">{filtered.length}</span> ítems
            </div>
          </div>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                    <TableHead className="w-20 py-4 font-semibold text-gray-600">Imagen</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Producto</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Categoría</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Precio</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Inventario</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600">Estado</TableHead>
                    <TableHead className="text-right py-4 font-semibold text-gray-600 pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any, idx: number) => (
                    <TableRow key={p.id} className={`hover:bg-blue-50/30 transition-colors border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <TableCell className="py-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
                          {p.imageUrl ? (
                            <img loading="lazy" src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{p.origin}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-medium">
                          {p.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 font-bold text-gray-900">${Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${p.inStock && Number(p.stockQuantity) > 10 ? 'bg-emerald-500' : p.inStock ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                          <span className="font-medium text-gray-700">
                            {p.inStock ? `${p.stockQuantity} unid.` : "Agotado"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          {p.isBestseller && <Badge className="text-[10px] uppercase tracking-wider px-2 py-0 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Más vendido</Badge>}
                          {p.isFeatured && <Badge className="text-[10px] uppercase tracking-wider px-2 py-0 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Destacado</Badge>}
                          {!p.isBestseller && !p.isFeatured && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="icon" className="h-8 w-8 text-gray-600 border-gray-200 hover:text-primary hover:border-primary/30 hover:bg-primary/5 rounded-md" onClick={() => openEdit(p)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-100 hover:text-red-700 hover:bg-red-50 hover:border-red-200 rounded-md" onClick={() => setDeleteConfirmId(String(p.id))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-lg font-medium text-gray-900">No se encontraron resultados</p>
                          <p className="text-sm">Intenta con otros términos de búsqueda.</p>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 gap-0 border-0 shadow-2xl">
          <div className="bg-primary px-6 py-4 flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-bold flex items-center">
              <Package className="w-5 h-5 mr-2 opacity-80" />
              {editId ? "Editar Producto" : "Registrar Nuevo Producto"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {editId ? "Edita los datos del producto existente." : "Completa el formulario para registrar un nuevo producto en el catálogo."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white" translate="no">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Nombre del Producto</Label>
                <Input className="border-gray-300 focus:border-primary rounded-lg h-10" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required spellCheck={false} data-gramm="false" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Slug (URL amigable)</Label>
                <Input className="border-gray-300 focus:border-primary rounded-lg h-10 font-mono text-sm" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required placeholder="ej-cafe-de-palo" spellCheck={false} data-gramm="false" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Descripción Completa</Label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe los detalles, ingredientes y modo de preparación..."
                spellCheck={false}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Precio (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <Input className="pl-7 border-gray-300 rounded-lg h-10" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required spellCheck={false} data-gramm="false" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Categoría</Label>
                <Select value={form.categoryId} onValueChange={handleCategoryChange} required>
                  <SelectTrigger className="border-gray-300 rounded-lg h-10">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Unidades en Stock</Label>
                <Input className="border-gray-300 rounded-lg h-10" type="number" min="0" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} spellCheck={false} data-gramm="false" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Origen / Región</Label>
                <Input className="border-gray-300 rounded-lg h-10" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="Ej. Copán, Honduras" spellCheck={false} data-gramm="false" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Peso (lbs)</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">lbs</span>
                  <Input className="pr-10 border-gray-300 rounded-lg h-10" type="number" step="0.01" min="0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.50" spellCheck={false} data-gramm="false" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Fotografía del Producto</Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.inStock} onCheckedChange={v => setForm(f => ({ ...f, inStock: v }))} id="inStock" className="data-[state=checked]:bg-emerald-500" />
                <Label htmlFor="inStock" className="cursor-pointer font-medium text-gray-700">Disponible</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isBestseller} onCheckedChange={v => setForm(f => ({ ...f, isBestseller: v }))} id="isBestseller" className="data-[state=checked]:bg-amber-500" />
                <Label htmlFor="isBestseller" className="cursor-pointer font-medium text-gray-700">Más Vendido</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isFeatured} onCheckedChange={v => setForm(f => ({ ...f, isFeatured: v }))} id="isFeatured" className="data-[state=checked]:bg-blue-500" />
                <Label htmlFor="isFeatured" className="cursor-pointer font-medium text-gray-700">Destacado</Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">Cancelar</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="bg-primary hover:bg-primary/90 rounded-lg font-medium shadow-sm">
                {editId ? "Guardar cambios" : "Publicar producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md sm:rounded-2xl">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold mb-2">¿Eliminar producto?</DialogTitle>
            <DialogDescription className="text-gray-600 text-base mb-6">
              Esta acción es irreversible. El producto será removido permanentemente del catálogo de la tienda y no podrá recuperarse.
            </DialogDescription>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl h-11 font-medium" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 rounded-xl h-11 font-medium bg-red-600 hover:bg-red-700" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteProduct.isPending}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
