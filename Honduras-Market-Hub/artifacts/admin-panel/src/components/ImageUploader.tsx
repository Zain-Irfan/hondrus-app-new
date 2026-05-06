import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

function getAdminKey() {
  return localStorage.getItem("adminKey") || "";
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 10 MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(10);

    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) throw new Error("No se pudo obtener la URL de carga.");
      const { uploadURL, objectPath } = await urlRes.json();

      setProgress(40);

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Error al subir el archivo.");

      setProgress(100);
      const servingUrl = `/api/storage${objectPath}`;
      onChange(servingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  const hasImage = value && (value.startsWith("/api/storage") || value.startsWith("http") || value.startsWith("/images"));

  return (
    <div className="space-y-3">
      {hasImage && (
        <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm" style={{ height: 160 }}>
          <img src={value} alt="Foto del producto" className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> Cambiar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 text-xs"
              onClick={() => onChange("")}
              disabled={isUploading}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Quitar
            </Button>
          </div>
        </div>
      )}

      {!hasImage && (
        <div
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer p-6
            ${dragOver ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/3"}`}
          style={{ minHeight: 140 }}
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">Subiendo imagen...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Arrastra una imagen aquí o <span className="text-primary underline underline-offset-2">selecciona un archivo</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — máximo 10 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {isUploading && hasImage && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Subiendo imagen...</span>
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[120px]">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">o ingresa URL manualmente</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <input
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="/images/products/... o https://..."
        spellCheck={false}
        data-gramm="false"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
