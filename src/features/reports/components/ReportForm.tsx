import {
  useState,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  useEffect,
  useRef,
} from "react";
import { getCities, getCountries, getStates } from "@/core/api/geography";
import type { ReportCategory, CreateReportRequest, UpdateReportRequest } from "@/shared/types";
import type { GeographyCity, GeographyCountry, GeographyState } from "@/shared/types";
import { CATEGORY_LABELS } from "@/shared/types";
import { getMyReports, reverseGeocodeLocationDetails } from "@/core/api/api";
import {
  getAdministrativeMatchKey,
  getLocalityMatchKey,
} from "@/core/location/administrativeLocation";
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
import { Camera, Send, Film, Trash2, RefreshCcw, Loader2, Sparkles } from "lucide-react";
import { LocationPicker } from "@/features/reports/components/LocationPicker";
import { useAuth } from "@/core/auth/AuthContext";
import {
  canRequestMapGeolocation,
  recordMapGeolocationOutcome,
} from "@/features/reports/helpers/reportMapState";
import { extractImageGpsLocation } from "@/features/reports/helpers/imageExifLocation";

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

export function ReportForm({
  initialData,
  onSubmit,
  loading,
  submitLabel = "Trimite raport",
}: ReportFormProps) {
  const isEditMode = !!initialData;
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressEditedManuallyRef = useRef(false);
  const latitudeRef = useRef<number | null>(null);
  const longitudeRef = useRef<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("ROAD");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [fallbackCenter, setFallbackCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [locationDetailsLoading, setLocationDetailsLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [detectedState, setDetectedState] = useState("");
  const [detectedCity, setDetectedCity] = useState("");
  // Selecția administrativă se ține direct în coduri CSC, nu în denumiri:
  // aceeași reprezentare pentru orice țară.
  const [countryIso2, setCountryIso2] = useState("");
  const [stateIso2, setStateIso2] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  // Țara detectată de geocoder. Cât timp selecția e în aceeași țară, orașul
  // detectat rămâne un candidat valid — inclusiv dacă regiunea a fost aleasă
  // manual. Dacă utilizatorul trece în altă țară, nu mai e relevant.
  const [detectedCountryIso2, setDetectedCountryIso2] = useState("");
  const [countries, setCountries] = useState<GeographyCountry[]>([]);
  const [states, setStates] = useState<GeographyState[]>([]);
  const [cities, setCities] = useState<GeographyCity[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [geographyError, setGeographyError] = useState<string | null>(null);
  const [locationDetailsError, setLocationDetailsError] = useState<string | null>(
    null
  );
  const [addressEditedManually, setAddressEditedManually] = useState(false);

  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [locationFromPhoto, setLocationFromPhoto] = useState(false);

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
    setCountryIso2("");
    setStateIso2("");
    setSelectedCityId(null);
    setDetectedCountryIso2("");
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
        setCountryIso2("");
        setStateIso2("");
        setSelectedCityId(null);
        setDetectedCountryIso2("");
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
        // Valorile rămân brute: servesc doar la găsirea opțiunii CSC potrivite.
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
          // Codurile ISO din Nominatim corespund direct cu iso2 din CSC,
          // pentru orice țară. Orașul nu are cod — se potrivește după nume,
          // iar dacă nu se potrivește, utilizatorul alege din dropdown.
          setCountryIso2(details.countryIso2 ?? "");
          setStateIso2(details.stateIso2 ?? "");
          setSelectedCityId(null);
          setDetectedCountryIso2(details.countryIso2 ?? "");
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
          setCountryIso2("");
          setStateIso2("");
          setSelectedCityId(null);
          setDetectedCountryIso2("");
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    if (preview) URL.revokeObjectURL(preview);

    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setRemoveImage(false);
    setLocationFromPhoto(false);

    // Bonus: dacă poza are coordonate GPS în EXIF, pre-completăm locația.
    // Doar la creare; nu suprascriem locația unui raport în editare.
    if (!isEditMode && nextFile.type.startsWith("image/")) {
      const gps = await extractImageGpsLocation(nextFile);
      if (gps) {
        setLatitude(gps.latitude);
        setLongitude(gps.longitude);
        setLocationFromPhoto(true);
      }
    }
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    // Ajustarea manuală pe hartă înseamnă că locația nu mai vine din poză.
    setLocationFromPhoto(false);
  }, []);

  // Ținem refs sincronizate ca să citim ultima locație în callback-uri async.
  useEffect(() => {
    latitudeRef.current = latitude;
    longitudeRef.current = longitude;
  }, [latitude, longitude]);

  // La deschiderea formularului de creare, centrăm harta pe locația curentă a
  // utilizatorului și plasăm acolo punctul. Dacă geolocația eșuează (refuzată /
  // indisponibilă), centrăm pe orașul ultimului raport al utilizatorului.
  useEffect(() => {
    if (isEditMode) return;

    let cancelled = false;

    const centerOnLastReport = async () => {
      try {
        const myReports = await getMyReports();
        if (cancelled || myReports.length === 0) return;

        const latest = myReports.reduce((mostRecent, report) =>
          new Date(report.createdAt).getTime() >
          new Date(mostRecent.createdAt).getTime()
            ? report
            : mostRecent
        );

        if (
          typeof latest.latitude === "number" &&
          typeof latest.longitude === "number" &&
          latitudeRef.current === null &&
          longitudeRef.current === null
        ) {
          setFallbackCenter({ lat: latest.latitude, lng: latest.longitude });
        }
      } catch {
        // Fără ultim raport disponibil — rămâne centrul implicit (București).
      }
    };

    const token = user?.token;

    // Dacă geolocația nu e disponibilă sau am atins limita de cereri (refuzat /
    // prea multe erori), nu mai întrebăm — centrăm direct pe ultimul raport.
    if (!navigator.geolocation || !token || !canRequestMapGeolocation(token)) {
      void centerOnLastReport();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        recordMapGeolocationOutcome(token, "success");
        // Nu suprascrie dacă între timp s-a setat deja o locație (poză / hartă).
        if (latitudeRef.current !== null && longitudeRef.current !== null) {
          return;
        }
        handleLocationChange(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        if (cancelled) return;
        recordMapGeolocationOutcome(
          token,
          err.code === err.PERMISSION_DENIED ? "denied" : "error"
        );
        void centerOnLastReport();
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );

    return () => {
      cancelled = true;
    };
  }, [isEditMode, handleLocationChange, user?.token]);

  const handleAddressChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAddress(e.target.value);
    setAddressEditedManually(true);
    addressEditedManuallyRef.current = true;
  };

  // Identitatea vine din codurile CSC. Selecția utilizatorului și prefill-ul
  // din reverse-geocode ajung amândouă aici sub formă de iso2 — aceeași
  // reprezentare pentru orice țară.
  const matchedCountry =
    countries.find((item) => item.iso2 === countryIso2) ?? null;
  const matchedState = states.find((item) => item.iso2 === stateIso2) ?? null;

  // Orașul nu are cod ISO, deci se potrivește după nume — dar doar în lista
  // regiunii deja fixate, unde candidații sunt puțini. Prefill-ul se aplică
  // numai dacă selecția e încă în țara detectată de geocoder.
  const isDetectedCityApplicable =
    !!detectedCity && !!detectedCountryIso2 && countryIso2 === detectedCountryIso2;

  const detectedCityKey = getAdministrativeMatchKey(detectedCity);
  const detectedCityLocalityKey = getLocalityMatchKey(detectedCity);

  const matchedCity =
    (selectedCityId !== null
      ? cities.find((item) => item.id === selectedCityId)
      : undefined) ??
    (isDetectedCityApplicable
      ? // Întâi potrivire exactă, apoi ignorând termenii administrativi
        // ("Chișinău Municipality" ↔ "Chișinău").
        cities.find(
          (item) => getAdministrativeMatchKey(item.name) === detectedCityKey
        ) ??
        cities.find(
          (item) => getLocalityMatchKey(item.name) === detectedCityLocalityKey
        )
      : undefined) ??
    null;

  /**
   * Identitatea geografică trimisă backendului. `null` cât timp țara, regiunea
   * sau orașul nu sunt rezolvate din opțiunile CSC — atunci submit-ul e blocat.
   */
  const canonicalLocation =
    matchedCountry && matchedState && matchedCity
      ? {
          countryIso2: matchedCountry.iso2,
          stateIso2: matchedState.iso2,
          cscCityId: matchedCity.id,
          countryName: matchedCountry.name,
          stateName: matchedState.name,
          cityName: matchedCity.name,
        }
      : null;

  // În creare secțiunea e mereu vizibilă: avem nevoie garantat de cscCityId,
  // iar geocoderul nu e sursă de identitate.
  const shouldShowAdministrativeSection =
    !isEditMode && latitude !== null && longitude !== null;

  const autoDetectedDetails = [
    detectedCountry ? `Țară: ${detectedCountry}` : null,
    detectedState ? `Regiune: ${detectedState}` : null,
    detectedCity ? `Oraș: ${detectedCity}` : null,
  ].filter((detail): detail is string => !!detail);

  // Un nivel care nu s-a putut mapa rămâne pe manual și e marcat vizual, fără
  // să blocheze nivelurile care S-AU mapat.
  const needsCountryConfirmation =
    shouldShowAdministrativeSection &&
    !locationDetailsLoading &&
    !countriesLoading &&
    countries.length > 0 &&
    !matchedCountry;
  const needsStateConfirmation =
    shouldShowAdministrativeSection &&
    !!matchedCountry &&
    !statesLoading &&
    states.length > 0 &&
    !matchedState;
  const needsCityConfirmation =
    shouldShowAdministrativeSection &&
    !!matchedState &&
    !citiesLoading &&
    cities.length > 0 &&
    !matchedCity;

  useEffect(() => {
    if (
      isEditMode ||
      latitude === null ||
      longitude === null ||
      locationDetailsLoading ||
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
    isEditMode,
    latitude,
    longitude,
    locationDetailsLoading,
  ]);

  useEffect(() => {
    if (
      isEditMode ||
      latitude === null ||
      longitude === null ||
      locationDetailsLoading ||
      !countryIso2
    ) {
      setStates([]);
      setStatesLoading(false);
      return;
    }

    let cancelled = false;

    setStates([]);
    setStatesLoading(true);
    setGeographyError(null);

    getStates(countryIso2)
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
  }, [
    isEditMode,
    latitude,
    longitude,
    locationDetailsLoading,
    countryIso2,
  ]);

  useEffect(() => {
    if (
      isEditMode ||
      latitude === null ||
      longitude === null ||
      locationDetailsLoading ||
      !countryIso2 ||
      !stateIso2
    ) {
      setCities([]);
      setSelectedCityId(null);
      setCitiesLoading(false);
      return;
    }

    let cancelled = false;

    // Lista se schimbă → un id ales anterior nu mai e valid.
    setCities([]);
    setSelectedCityId(null);
    setCitiesLoading(true);
    setGeographyError(null);

    getCities(countryIso2, stateIso2)
      .then((data) => {
        if (cancelled) return;
        setCities(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setCities([]);
        setGeographyError(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca lista de orașe pentru regiunea selectată."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setCitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isEditMode,
    latitude,
    longitude,
    locationDetailsLoading,
    countryIso2,
    stateIso2,
  ]);

  const restoreDetectedAddress = () => {
    setAddress(detectedAddress);
    setAddressEditedManually(false);
    addressEditedManuallyRef.current = false;
  };

  const handleCountrySelect = (nextCountryIso2: string) => {
    setCountryIso2(nextCountryIso2);
    setStateIso2("");
    setSelectedCityId(null);
  };

  const handleStateSelect = (nextStateIso2: string) => {
    setStateIso2(nextStateIso2);
    setSelectedCityId(null);
  };

  const handleCitySelect = (cityId: string) => {
    const nextCity = cities.find((item) => String(item.id) === cityId);
    setSelectedCityId(nextCity?.id ?? null);
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
    setLocationFromPhoto(false);

    if (existingImageUrl) {
      setRemoveImage(true);
    }
  };

  const hasAnyMedia = (!removeImage && existingImageUrl) || !!preview;

  const isVideo = file?.type.startsWith("video/");
  const isImage = file?.type.startsWith("image/");
  const administrativeLocationLoading =
    !isEditMode && (countriesLoading || statesLoading || citiesLoading);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Adresa e proper noun: se trimite exact cum e, în limba locală.
    const trimmedAddress = address.trim();
    const isCreateMediaMissing = !isEditMode && !file;

    if (
      !title.trim() ||
      !description.trim() ||
      latitude === null ||
      longitude === null ||
      isCreateMediaMissing ||
      (!isEditMode && administrativeLocationLoading) ||
      // Fără identitate canonică (în special cscCityId) nu trimitem nimic.
      (!isEditMode && !canonicalLocation)
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
        address: trimmedAddress || undefined,
        file,
        removeImage: removeImage ? true : undefined,
      });
      return;
    }

    // Garantat non-null: verificat mai sus pentru create.
    if (!canonicalLocation) return;

    const payload: CreateReportRequest = {
      title: title.trim(),
      description: description.trim(),
      category,
      latitude,
      longitude,
      address: trimmedAddress || undefined,
      ...canonicalLocation,
      file,
      removeImage: removeImage ? true : undefined,
    };

    if (import.meta.env.DEV) {
      console.info("[ReportForm] create report payload", {
        detectedAdministrativeLocation: {
          country: detectedCountry,
          state: detectedState,
          city: detectedCity,
        },
        payload: {
          ...payload,
          file: file ? { name: file.name, type: file.type, size: file.size } : null,
        },
      });
    }

    onSubmit(payload);
  };

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const isCreateMediaMissing = !isEditMode && !file;
  const isCanonicalLocationMissing = !isEditMode && !canonicalLocation;
  const initialTitle = initialData?.title.trim() ?? "";
  const initialDescription = initialData?.description.trim() ?? "";
  const initialCategory = initialData?.category ?? "ROAD";
  const initialLatitude =
    typeof initialData?.latitude === "number" ? initialData.latitude : null;
  const initialLongitude =
    typeof initialData?.longitude === "number" ? initialData.longitude : null;
  const initialAddress = initialData?.address?.trim() ?? "";
  const hasFieldChanges =
    trimmedTitle !== initialTitle ||
    trimmedDescription !== initialDescription ||
    category !== initialCategory ||
    latitude !== initialLatitude ||
    longitude !== initialLongitude ||
    address.trim() !== initialAddress;
  const hasMediaChanges = !!file || removeImage;
  const hasChanges = !isEditMode || hasFieldChanges || hasMediaChanges;
  const isValid =
    trimmedTitle.length > 0 &&
    trimmedDescription.length > 0 &&
    latitude !== null &&
    longitude !== null &&
    !locationDetailsLoading &&
    !administrativeLocationLoading &&
    !isCreateMediaMissing &&
    !isCanonicalLocationMissing;
  const submitBlockReason = !trimmedTitle.length
    ? "Completează titlul raportului."
    : !trimmedDescription.length
      ? "Completează descrierea raportului."
      : latitude === null || longitude === null
        ? "Alege locația raportului pe hartă."
        : locationDetailsLoading
          ? "Se procesează locația aleasă. Mai încearcă în câteva secunde."
          : administrativeLocationLoading
            ? "Se verifică datele administrative ale locației."
            : !isEditMode && !matchedCountry
              ? "Selectează țara din listă."
              : !isEditMode && !matchedState
                ? "Selectează regiunea / județul din listă."
                : !isEditMode && !matchedCity
                  ? "Selectează orașul din listă. Primăria este identificată după orașul ales, nu după adresă."
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
        fallbackCenter={fallbackCenter}
      />

      {locationFromPhoto && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          Locație detectată automat din poză. O poți ajusta pe hartă dacă e
          nevoie.
        </p>
      )}

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

      {shouldShowAdministrativeSection && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label>Locație administrativă</Label>
            <p className="text-xs text-muted-foreground">
              Primăria responsabilă este identificată după orașul ales de aici,
              nu după adresa scrisă. Verifică valorile completate automat.
            </p>
            {!!autoDetectedDetails.length && (
              <p className="text-xs text-muted-foreground">
                Detectate automat: {autoDetectedDetails.join(" / ")}.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">Țară</Label>
              <Select
                value={countryIso2 || undefined}
                onValueChange={handleCountrySelect}
                disabled={
                  loading ||
                  locationDetailsLoading ||
                  countriesLoading ||
                  countries.length === 0
                }
              >
                <SelectTrigger id="country">
                  <SelectValue
                    placeholder={
                      countriesLoading
                        ? "Se încarcă țările..."
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
              {needsCountryConfirmation && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Confirmă țara din listă.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">Regiune / Județ</Label>
              <Select
                value={stateIso2 || undefined}
                onValueChange={handleStateSelect}
                disabled={
                  loading ||
                  locationDetailsLoading ||
                  statesLoading ||
                  !countryIso2 ||
                  states.length === 0
                }
              >
                <SelectTrigger id="state">
                  <SelectValue
                    placeholder={
                      statesLoading
                        ? "Se încarcă regiunile..."
                        : !countryIso2
                          ? "Alege întâi țara"
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
              {needsStateConfirmation && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Confirmă regiunea din listă.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">Oraș</Label>
              <Select
                value={matchedCity ? String(matchedCity.id) : undefined}
                onValueChange={handleCitySelect}
                disabled={
                  loading ||
                  locationDetailsLoading ||
                  citiesLoading ||
                  !stateIso2 ||
                  cities.length === 0
                }
              >
                <SelectTrigger id="city">
                  <SelectValue
                    placeholder={
                      citiesLoading
                        ? "Se încarcă orașele..."
                        : !stateIso2
                          ? "Alege întâi regiunea"
                          : "Selectează orașul"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((cityOption) => (
                    <SelectItem
                      key={cityOption.id}
                      value={String(cityOption.id)}
                    >
                      {cityOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsCityConfirmation && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              {detectedCity
                ? `Orașul detectat automat (${detectedCity}) nu a putut fi asociat unei localități din listă. Confirmă orașul din listă.`
                : "Confirmă orașul din listă."}
            </p>
          )}

          {(countriesLoading || statesLoading || citiesLoading) && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {citiesLoading
                ? "Se încarcă orașele pentru regiunea selectată..."
                : statesLoading
                  ? "Se încarcă regiunile pentru țara selectată..."
                  : "Se încarcă lista de țări..."}
            </p>
          )}

          {geographyError && (
            <p className="text-xs text-destructive">{geographyError}</p>
          )}
        </div>
      )}

      {!isValid && submitBlockReason && (
        <p className="text-sm text-destructive">{submitBlockReason}</p>
      )}

      <div className="space-y-1.5">
        <Label>{isEditMode ? "Fișier media" : "Fișier media *"}</Label>

        <div className="flex flex-col gap-2">
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

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
