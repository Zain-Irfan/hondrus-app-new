import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tags, Package, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";

const EMPTY_FORM = { name: "", slug: "", description: "", imageUrl: "" };

export function Categories() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(cat: any) {
    setEditId(String(cat.id));
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
    });
    setDialogOpen(true);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) {
        await updateCategory.mutateAsync({ id: editId, data: form });
        toast({ title: "Categoría actualizada correctamente", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      } else {
        await createCategory.mutateAsync(form);
        toast({ title: "Categoría creada exitosamente", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error al guardar la categoría", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Categoría eliminada", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  const actions = (
    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm h-10 px-5 rounded-lg">
      <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
    </Button>
  );

  if (isLoading) {
    return (
      <Layout title="Categorías del Catálogo" actions={actions}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Categorías del Catálogo" actions={actions}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(categories as any[]).map((cat: any) => (
            <Card key={cat.id} className="overflow-hidden shadow-md border-0 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white">
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Tags className="w-14 h-14 text-primary/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(cat)}
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(String(cat.id))}
                      className="w-8 h-8 rounded-full bg-red-500/70 backdrop-blur-sm border border-red-400/30 flex items-center justify-center text-white hover:bg-red-600/80 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{cat.name}</h3>
                    <div className="bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center border border-white/30">
                      <Package className="w-3 h-3 text-white mr-1" />
                      <span className="text-white font-bold text-xs">{cat.productCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <code className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100 font-mono inline-block mb-2">{cat.slug}</code>
                {cat.description ? (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{cat.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin descripción.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(categories as any[]).length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Tags className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay categorías</h3>
            <p className="text-gray-500 mb-4">Crea la primera categoría para organizar tu catálogo.</p>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 gap-0 border-0 shadow-2xl">
          <div className="bg-primary px-6 py-4">
            <DialogTitle className="text-white text-lg font-bold flex items-center">
              <Tags className="w-5 h-5 mr-2 opacity-80" />
              {editId ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {editId ? "Edita los datos de la categoría." : "Completa el formulario para crear una nueva categoría."}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white" translate="no">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Nombre</Label>
              <Input
                className="border-gray-300 focus:border-primary rounded-lg h-10"
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({ ...f, name, slug: editId ? f.slug : autoSlug(name) }));
                }}
                required
                spellCheck={false}
                data-gramm="false"
                placeholder="Ej. Cafés de Especialidad"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Slug (URL amigable)</Label>
              <Input
                className="border-gray-300 focus:border-primary rounded-lg h-10 font-mono text-sm"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                required
                spellCheck={false}
                data-gramm="false"
                placeholder="cafes-de-especialidad"
              />
              <p className="text-xs text-gray-400">Solo letras minúsculas, números y guiones.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Descripción</Label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción de esta categoría..."
                spellCheck={false}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Imagen de Portada</Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              />
            </div>
            <DialogFooter className="pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">Cancelar</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className="bg-primary hover:bg-primary/90 rounded-lg font-medium shadow-sm">
                {editId ? "Guardar cambios" : "Crear categoría"}
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
            <DialogTitle className="text-xl font-bold mb-2">¿Eliminar categoría?</DialogTitle>
            <DialogDescription className="text-gray-600 text-base mb-6">
              Esta acción es irreversible. Los productos asociados a esta categoría no serán eliminados, pero perderán su clasificación.
            </DialogDescription>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteCategory.isPending}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
