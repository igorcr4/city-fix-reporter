import { useState, useCallback, type FormEvent, type ChangeEvent } from "react";
import type { ReportCategory, CreateReportRequest } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Send } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

interface ReportFormProps {
  initialData?: {
    title: string;
    description: string;
    category: ReportCategory;
    latitude?: number;
    longitude?: number;
  };
  onSubmit: (data: CreateReportRequest) => void;
  loading?: boolean;
  submitLabel?: string;
}

const categories: ReportCategory[] = ["DRUM", "ILUMINAT", "GUNOI", "VANDALISM", "ALTELE"];

export function ReportForm({ initialData, onSubmit, loading, submitLabel = "Trimite raport" }: ReportFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState<ReportCategory>(initialData?.category ?? "DRUM");
  const [image, setImage] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || latitude === null || longitude === null) return;
    onSubmit({ title: title.trim(), description: description.trim(), category, latitude, longitude, image });
  };

  const isValid = title.trim() && description.trim() && latitude !== null && longitude !== null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titlu</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Groapă pe strada Eminescu"
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descriere</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrie problema pe scurt..."
          rows={4}
          maxLength={1000}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Categorie</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onChange={handleLocationChange}
      />

      <div className="space-y-1.5">
        <Label>Fotografie</Label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Camera className="h-5 w-5" />
          {image ? image.name : "Adaugă o fotografie"}
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
        </label>
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 h-40 w-full rounded-lg object-cover" />
        )}
      </div>

      <Button type="submit" size="lg" disabled={loading || !isValid} className="mt-2 gap-2 text-base">
        <Send className="h-4 w-4" />
        {loading ? "Se trimite..." : submitLabel}
      </Button>
    </form>
  );
}
