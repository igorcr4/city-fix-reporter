import {
  useState,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  useEffect,
  useRef,
} from "react";
import { getCountries, getStates } from "@/core/api/geography";
import type { ReportCategory, CreateReportRequest, UpdateReportRequest } from "@/shared/types";
import type { GeographyCountry, GeographyState } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { reverseGeocodeLocationDetails } from "@/core/api/api";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Camera, Send, Film, Trash2, RefreshCcw, Loader2 } from "lucide-react";
import { LocationPicker } from "@/features/reports/components/LocationPicker";

interface ReportFormProps {
  initialData?: {
    title: string;
    description: string;
    category: ReportCategory;
    latitude?: number;
    longitude?: number;
    address?: string;
    imageUrl?: string;
  };
  onSubmit: (data: CreateReportRequest | UpdateReportRequest) => void;
  loading?: boolean;
  submitLabel?: string;
}

const categories: ReportCategory[] = [
  "ROAD",
  "LIGHTING",
  "WASTE",
  "VANDALISM",
  "OTHER",
];

function normalizeGeographyLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function ReportForm({
  initialData,
  onSubmit,
  loading,
  submitLabel = "Trimite raport",
}: ReportFormProps) {
  const isEditMode = !!initialData;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressEditedManuallyRef = useRef(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("ROAD");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [locationDetailsLoading, setLocationDetailsLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [detectedState, setDetectedState] = useState("");
  const [detectedCity, setDetectedCity] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [countries, setCountries] = useState<GeographyCountry[]>([]);
  const [states, setStates] = useState<GeographyState[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [geographyError, setGeographyError] = useState<string | null>(null);
  const [locationDetailsError, setLocationDetailsError] = useState<string | null>(
    null
  );
  const [addressEditedManually, setAddressEditedManually] = useState(false);

  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!initialData) return;

    setTitle(initialData.title ?? "");
    setDescription(initialData.description ?? "");
    setCategory(initialData.category ?? "ROAD");

    setLatitude(
      typeof initialData.latitude === "number" ? initialData.latitude : null
    );
    setLongitude(
      typeof initialData.longitude === "number" ? initialData.longitude : null
    );
    setAddress(initialData.address ?? "");
    setDetectedAddress(initialData.address ?? "");
    setDetectedCountry("");
    setDetectedState("");
    setDetectedCity("");
    setCountry("");
    setState("");
    setCity("");
    setLocationDetailsError(null);
    setAddressEditedManually(false);
    addressEditedManuallyRef.current = false;

    setExistingImageUrl(initialData.imageUrl ?? null);
    setRemoveImage(false);

    setFile(undefined);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setLocationDetailsLoading(false);
      setLocationDetailsError(null);
      setDetectedAddress("");
      setDetectedCountry("");
      setDetectedState("");
      setDetectedCity("");
      setAddressEditedManually(false);
      addressEditedManuallyRef.current = false;
      if (!isEditMode) {
        setAddress("");
        setCountry("");
        setState("");
        setCity("");
      }
      return;
    }

    const initialLatitude =
      typeof initialData?.latitude === "number" ? initialData.latitude : null;
    const initialLongitude =
      typeof initialData?.longitude === "number" ? initialData.longitude : null;
    const matchesInitialLocation =
      latitude === initialLatitude && longitude === initialLongitude;

    if (matchesInitialLocation && initialData?.address) {
      setAddress(initialData.address);
      setDetectedAddress(initialData.address);
      setLocationDetailsLoading(false);
      return;
    }

    let cancelled = false;

    setLocationDetailsLoading(true);
    setLocationDetailsError(null);
    setAddressEditedManually(false);
    addressEditedManuallyRef.current = false;

    reverseGeocodeLocationDetails(latitude, longitude)
      .then((details) => {
        if (cancelled) return;
        const nextDetectedAddress = details.address ?? "";
        const nextDetectedCountry = details.country ?? "";
        const nextDetectedState = details.state ?? "";
        const nextDetectedCity = details.city ?? "";

        setDetectedAddress(nextDetectedAddress);
        setDetectedCountry(nextDetectedCountry);
        setDetectedState(nextDetectedState);
        setDetectedCity(nextDetectedCity);

        if (!addressEditedManuallyRef.current) {
          setAddress(nextDetectedAddress);
        }

        if (!isEditMode) {
          setCountry(nextDetectedCountry);
          setState(nextDetectedState);
          setCity(nextDetectedCity);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("REVERSE GEOCODE ERROR:", error);
        setDetectedAddress("");
        setDetectedCountry("");
        setDetectedState("");
        setDetectedCity("");
        if (!addressEditedManuallyRef.current) {
          setAddress("");
        }
        if (!isEditMode) {
          setCountry("");
          setState("");
          setCity("");
          setLocationDetailsError(
            "Nu s-au putut identifica automat țara, regiunea și orașul pentru punctul ales."
          );
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLocationDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    initialData?.address,
    initialData?.latitude,
    initialData?.longitude,
    latitude,
    longitude,
    isEditMode,
  ]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    if (preview) URL.revokeObjectURL(preview);

    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setRemoveImage(false);
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleAddressChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAddress(e.target.value);
    setAddressEditedManually(true);
    addressEditedManuallyRef.current = true;
  };

  const handleCountryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCountry(e.target.value);
  };

  const handleStateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setState(e.target.value);
  };

  const handleCityChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
  };

  const isDetectedCountryComplete = detectedCountry.trim().length > 0;
  const isDetectedStateComplete = detectedState.trim().length > 0;
  const isDetectedCityComplete = detectedCity.trim().length > 0;
  const hasDetectedAdministrativeDetails =
    isDetectedCountryComplete &&
    isDetectedStateComplete &&
    isDetectedCityComplete;
  const shouldShowAdministrativeFallback =
    !isEditMode &&
    latitude !== null &&
    longitude !== null &&
    !locationDetailsLoading &&
    !hasDetectedAdministrativeDetails;

  const matchedCountry =
    countries.find(
      (item) =>
        normalizeGeographyLabel(item.name) === normalizeGeographyLabel(country)
    ) ?? null;
  const selectedCountryIso2 = matchedCountry?.iso2 ?? "";
  const matchedState =
    states.find(
      (item) =>
        normalizeGeographyLabel(item.name) === normalizeGeographyLabel(state)
    ) ?? null;
  const selectedStateIso2 = matchedState?.iso2 ?? "";

  const shouldShowCountryFallback =
    shouldShowAdministrativeFallback &&
    (!isDetectedCountryComplete ||
      (!isDetectedStateComplete && !selectedCountryIso2));
  const shouldShowStateFallback =
    shouldShowAdministrativeFallback && !isDetectedStateComplete;
  const shouldShowCityFallback =
    shouldShowAdministrativeFallback && !isDetectedCityComplete;

  const autoDetectedDetails = [
    isDetectedCountryComplete ? `Țară: ${detectedCountry}` : null,
    isDetectedStateComplete ? `Regiune: ${detectedState}` : null,
    isDetectedCityComplete ? `Oraș: ${detectedCity}` : null,
  ].filter((detail): detail is string => !!detail);

  useEffect(() => {
    if (!shouldShowAdministrativeFallback) {
      setGeographyError(null);
      setStates([]);
      setStatesLoading(false);
      return;
    }
  }, [shouldShowAdministrativeFallback]);

  useEffect(() => {
    if (
      !shouldShowAdministrativeFallback ||
      (!shouldShowCountryFallback && !shouldShowStateFallback) ||
      countries.length > 0
    ) {
      return;
    }

    let cancelled = false;

    setCountriesLoading(true);
    setGeographyError(null);

    getCountries()
      .then((data) => {
        if (cancelled) return;
        setCountries(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setCountries([]);
        setGeographyError(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca lista de țări."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setCountriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    countries.length,
    shouldShowAdministrativeFallback,
    shouldShowCountryFallback,
    shouldShowStateFallback,
  ]);

  useEffect(() => {
    if (!shouldShowStateFallback || !selectedCountryIso2) {
      setStates([]);
      setStatesLoading(false);
      return;
    }

    let cancelled = false;

    setStates([]);
    setStatesLoading(true);
    setGeographyError(null);

    getStates(selectedCountryIso2)
      .then((data) => {
        if (cancelled) return;
        setStates(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setStates([]);
        setGeographyError(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca lista de regiuni pentru țara selectată."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setStatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCountryIso2, shouldShowStateFallback]);

  const restoreDetectedAddress = () => {
    setAddress(detectedAddress);
    setAddressEditedManually(false);
    addressEditedManuallyRef.current = false;
  };

  const handleCountrySelect = (countryIso2: string) => {
    const nextCountry = countries.find((item) => item.iso2 === countryIso2);
    setCountry(nextCountry?.name ?? "");
    setState("");
  };

  const handleStateSelect = (stateIso2: string) => {
    const nextState = states.find((item) => item.iso2 === stateIso2);
    setState(nextState?.name ?? "");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setFile(undefined);

    if (existingImageUrl) {
      setRemoveImage(true);
    }
  };

  const hasAnyMedia = (!removeImage && existingImageUrl) || !!preview;

  const isVideo = file?.type.startsWith("video/");
  const isImage = file?.type.startsWith("image/");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedCountry = country.trim();
    const trimmedState = state.trim();
    const trimmedCity = city.trim();
    const isCreateMediaMissing = !isEditMode && !file;

    if (
      !title.trim() ||
      !description.trim() ||
      latitude === null ||
      longitude === null ||
      isCreateMediaMissing ||
      (!isEditMode && (!trimmedCountry || !trimmedState || !trimmedCity))
    ) {
      return;
    }

    if (isEditMode) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        latitude,
        longitude,
        address: address || undefined,
        file,
        removeImage: removeImage ? true : undefined,
      });
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      latitude,
      longitude,
      address: address.trim() || undefined,
      country: trimmedCountry,
      state: trimmedState,
      city: trimmedCity,
      file,
      removeImage: removeImage ? true : undefined,
    });
  };

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const trimmedCountry = country.trim();
  const trimmedState = state.trim();
  const trimmedCity = city.trim();
  const isCreateMediaMissing = !isEditMode && !file;
  const areAdministrativeFieldsMissing =
    !trimmedCountry || !trimmedState || !trimmedCity;
  const initialTitle = initialData?.title.trim() ?? "";
  const initialDescription = initialData?.description.trim() ?? "";
  const initialCategory = initialData?.category ?? "ROAD";
  const initialLatitude =
    typeof initialData?.latitude === "number" ? initialData.latitude : null;
  const initialLongitude =
    typeof initialData?.longitude === "number" ? initialData.longitude : null;
  const hasFieldChanges =
    trimmedTitle !== initialTitle ||
    trimmedDescription !== initialDescription ||
    category !== initialCategory ||
    latitude !== initialLatitude ||
    longitude !== initialLongitude;
  const hasMediaChanges = !!file || removeImage;
  const hasChanges = !isEditMode || hasFieldChanges || hasMediaChanges;
  const isValid =
    trimmedTitle.length > 0 &&
    trimmedDescription.length > 0 &&
    latitude !== null &&
    longitude !== null &&
    !locationDetailsLoading &&
    !isCreateMediaMissing &&
    (isEditMode || !areAdministrativeFieldsMissing);
  const submitBlockReason = !trimmedTitle.length
    ? "Completează titlul raportului."
    : !trimmedDescription.length
      ? "Completează descrierea raportului."
      : latitude === null || longitude === null
        ? "Alege locația raportului pe hartă."
        : locationDetailsLoading
          ? "Se procesează locația aleasă. Mai încearcă în câteva secunde."
          : null;

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
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ReportCategory)}
        >
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="address">Adresă</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={restoreDetectedAddress}
            disabled={
              loading ||
              locationDetailsLoading ||
              !detectedAddress ||
              address === detectedAddress
            }
          >
            <RefreshCcw className="h-4 w-4" />
            Completează din locație
          </Button>
        </div>
        <Textarea
          id="address"
          value={address}
          onChange={handleAddressChange}
          placeholder="Poți scrie manual adresa exactă dacă o cunoști."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Adresa este completată automat din punctul ales pe hartă, dar o poți
          edita manual dacă vrei mai multă precizie.
        </p>
        {locationDetailsLoading && (
          <p className="text-xs text-muted-foreground">
            Se caută adresa pentru locația aleasă...
          </p>
        )}
        {!isEditMode && locationDetailsError && (
          <p className="text-xs text-destructive">{locationDetailsError}</p>
        )}
        {addressEditedManually && detectedAddress && (
          <p className="text-xs text-muted-foreground">
            Ai modificat manual adresa. Poți reveni la varianta detectată cu
            butonul de mai sus.
          </p>
        )}
      </div>

      {shouldShowAdministrativeFallback && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label>Completează Doar Ce Lipsește</Label>
            <p className="text-xs text-muted-foreground">
              Nu am putut identifica complet automat toate detaliile
              administrative pentru punctul ales. Completează doar câmpurile
              lipsă de mai jos.
            </p>
            {!!autoDetectedDetails.length && (
              <p className="text-xs text-muted-foreground">
                Detectate automat: {autoDetectedDetails.join(" / ")}.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {shouldShowCountryFallback && (
              <div className="space-y-1.5">
                <Label htmlFor="country">Țară</Label>
                {countries.length > 0 ? (
                  <Select
                    value={selectedCountryIso2 || undefined}
                    onValueChange={handleCountrySelect}
                    disabled={loading || locationDetailsLoading || countriesLoading}
                  >
                    <SelectTrigger id="country">
                      <SelectValue
                        placeholder={
                          countriesLoading
                            ? "Se încarcă țările..."
                            : country
                              ? `Țara detectată: ${country}`
                              : "Selectează țara"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((countryOption) => (
                        <SelectItem
                          key={countryOption.iso2}
                          value={countryOption.iso2}
                        >
                          {countryOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="country"
                    value={country}
                    onChange={handleCountryChange}
                    placeholder="Ex: România"
                    maxLength={100}
                    disabled={loading || locationDetailsLoading || countriesLoading}
                    required
                  />
                )}
              </div>
            )}

            {shouldShowStateFallback && (
              <div className="space-y-1.5">
                <Label htmlFor="state">Regiune / Județ</Label>
                {selectedCountryIso2 && states.length > 0 ? (
                  <Select
                    value={selectedStateIso2 || undefined}
                    onValueChange={handleStateSelect}
                    disabled={loading || locationDetailsLoading || statesLoading}
                  >
                    <SelectTrigger id="state">
                      <SelectValue
                        placeholder={
                          statesLoading
                            ? "Se încarcă regiunile..."
                            : "Selectează regiunea"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((stateOption) => (
                        <SelectItem key={stateOption.iso2} value={stateOption.iso2}>
                          {stateOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="state"
                    value={state}
                    onChange={handleStateChange}
                    placeholder={
                      countriesLoading
                        ? "Se încarcă țările..."
                        : statesLoading
                          ? "Se încarcă regiunile..."
                          : selectedCountryIso2
                            ? "Scrie regiunea dacă lista nu este disponibilă"
                            : "Alege întâi țara"
                    }
                    maxLength={100}
                    disabled={
                      loading ||
                      locationDetailsLoading ||
                      statesLoading ||
                      (shouldShowCountryFallback &&
                        countries.length > 0 &&
                        !selectedCountryIso2)
                    }
                    required
                  />
                )}
              </div>
            )}

            {shouldShowCityFallback && (
              <div className="space-y-1.5">
                <Label htmlFor="city">Oraș</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={handleCityChange}
                  placeholder="Ex: București"
                  maxLength={100}
                  disabled={loading || locationDetailsLoading}
                  required
                />
              </div>
            )}
          </div>

          {(countriesLoading || statesLoading) && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {statesLoading
                ? "Se încarcă regiunile pentru țara selectată..."
                : "Se încarcă lista de țări..."}
            </p>
          )}

          {geographyError && (
            <p className="text-xs text-muted-foreground">{geographyError}</p>
          )}
        </div>
      )}

      {!isValid && submitBlockReason && (
        <p className="text-sm text-destructive">{submitBlockReason}</p>
      )}

      <div className="space-y-1.5">
        <Label>{isEditMode ? "Fișier media" : "Fișier media *"}</Label>

        <div className="flex flex-col gap-2">
          {/* ✅ Butoanele apar DOAR când există media */}
          {hasAnyMedia && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={openFilePicker}
              >
                <RefreshCcw className="h-4 w-4" />
                Schimbă fișierul
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={handleRemoveMedia}
              >
                <Trash2 className="h-4 w-4" />
                Șterge
              </Button>
            </div>
          )}

          {/* input hidden */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Preview: fișier nou */}
          {!removeImage && preview && isImage && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          )}

          {!removeImage && preview && isVideo && (
            <video
              src={preview}
              controls
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          )}

          {/* Preview: imagine existentă */}
          {!removeImage && !preview && existingImageUrl && (
            <div className="mt-2 overflow-hidden rounded-lg bg-muted">
              <img
                src={existingImageUrl}
                alt="Imagine existentă"
                className="max-h-[240px] w-full object-contain"
              />
            </div>
          )}

          {removeImage && (
            <p className="text-sm text-muted-foreground">
              Imaginea va fi ștearsă la salvare.
            </p>
          )}

          {/* ✅ Când NU există media, rămâne doar zona mare ca înainte */}
          {!hasAnyMedia && (
            <label
              onClick={openFilePicker}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Camera className="h-5 w-5" />
              Adaugă o fotografie sau un video
              <span className="sr-only">Upload</span>
            </label>
          )}

          {!isEditMode && (
            <p className="text-xs text-muted-foreground">
              Pentru un raport nou este obligatoriu să adaugi o fotografie sau
              un video.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Momentan backend-ul suportă un singur fișier per raport.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading || !isValid || !hasChanges}
        className="mt-2 gap-2 text-base"
      >
        <Send className="h-4 w-4" />
        {loading ? "Se trimite..." : submitLabel}
      </Button>
    </form>
  );
}
