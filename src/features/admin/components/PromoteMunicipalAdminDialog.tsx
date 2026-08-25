import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { getCities, getCountries, getStates } from "@/core/api/geography";
import type {
  AdminUser,
  PromoteMunicipalAdminPayload,
} from "@/features/admin/types";
import type { GeographyCity, GeographyCountry, GeographyState } from "@/shared/types";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/utils/utils";

interface PromoteMunicipalAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Subiectul promovării — folosit doar pentru textul descrierii. */
  user: Pick<AdminUser, "username"> | null;
  loading: boolean;
  onConfirm: (payload: PromoteMunicipalAdminPayload) => Promise<void> | void;
}

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectFieldProps {
  label: string;
  value: string;
  placeholder: string;
  emptyLabel: string;
  searchPlaceholder: string;
  options: SearchableOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

function SearchableSelectField({
  label,
  value,
  placeholder,
  emptyLabel,
  searchPlaceholder,
  options,
  open,
  onOpenChange,
  onValueChange,
  disabled = false,
}: SearchableSelectFieldProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-foreground">{label}</p>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value);
                      onOpenChange(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function PromoteMunicipalAdminDialog({
  open,
  onOpenChange,
  user,
  loading,
  onConfirm,
}: PromoteMunicipalAdminDialogProps) {
  const [countries, setCountries] = useState<GeographyCountry[]>([]);
  const [states, setStates] = useState<GeographyState[]>([]);
  const [cities, setCities] = useState<GeographyCity[]>([]);
  const [selectedCountryIso2, setSelectedCountryIso2] = useState("");
  const [selectedStateIso2, setSelectedStateIso2] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedCountryIso2("");
      setSelectedStateIso2("");
      setSelectedCityName("");
      setCountryOpen(false);
      setStateOpen(false);
      setCityOpen(false);
      setStates([]);
      setCities([]);
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadCountries = async () => {
      setCountriesLoading(true);
      setErrorMessage(null);

      try {
        const data = await getCountries();
        if (active) {
          setCountries(data);
        }
      } catch (error) {
        if (active) {
          setCountries([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nu s-a putut încărca lista de țări."
          );
        }
      } finally {
        if (active) {
          setCountriesLoading(false);
        }
      }
    };

    loadCountries();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !selectedCountryIso2) return;

    let active = true;

    const loadStates = async () => {
      setStatesLoading(true);
      setErrorMessage(null);
      setSelectedStateIso2("");
      setSelectedCityName("");
      setStates([]);
      setCities([]);

      try {
        const data = await getStates(selectedCountryIso2);
        if (active) {
          setStates(data);
        }
      } catch (error) {
        if (active) {
          setStates([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nu s-a putut încărca lista de regiuni."
          );
        }
      } finally {
        if (active) {
          setStatesLoading(false);
        }
      }
    };

    loadStates();

    return () => {
      active = false;
    };
  }, [open, selectedCountryIso2]);

  useEffect(() => {
    if (!open || !selectedCountryIso2 || !selectedStateIso2) return;

    let active = true;

    const loadCities = async () => {
      setCitiesLoading(true);
      setErrorMessage(null);
      setSelectedCityName("");
      setCities([]);

      try {
        const data = await getCities(selectedCountryIso2, selectedStateIso2);
        if (active) {
          setCities(data);
        }
      } catch (error) {
        if (active) {
          setCities([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nu s-a putut încărca lista de orașe."
          );
        }
      } finally {
        if (active) {
          setCitiesLoading(false);
        }
      }
    };

    loadCities();

    return () => {
      active = false;
    };
  }, [open, selectedCountryIso2, selectedStateIso2]);

  const handleConfirm = async () => {
    if (!selectedCountry || !selectedState || !selectedCity) return;

    await onConfirm({
      country: selectedCountry.name,
      state: selectedState.name,
      city: selectedCity.name,
    });
  };

  const selectedCountry = countries.find(
    (country) => country.iso2 === selectedCountryIso2
  );
  const selectedState = states.find((state) => state.iso2 === selectedStateIso2);
  const selectedCity = cities.find((city) => city.name === selectedCityName);
  const geographyLoading = countriesLoading || statesLoading || citiesLoading;
  const countryOptions: SearchableOption[] = countries.map((country) => ({
    value: country.iso2,
    label: country.name,
  }));
  const stateOptions: SearchableOption[] = states.map((state) => ({
    value: state.iso2,
    label: state.name,
  }));
  const cityOptions: SearchableOption[] = cities.map((city) => ({
    value: city.name,
    label: city.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promovează la municipal admin</DialogTitle>
          <DialogDescription>
            {user
              ? `Alege țara, regiunea și orașul pentru ${user.username}.`
              : "Alege țara, regiunea și orașul pentru userul selectat."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTitle>Eroare la încărcare</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <SearchableSelectField
            label="Țară"
            value={selectedCountryIso2}
            placeholder={
              countriesLoading ? "Se încarcă țările..." : "Selectează țara"
            }
            emptyLabel="Nu există țări care se potrivesc."
            searchPlaceholder="Scrie pentru a filtra țările..."
            options={countryOptions}
            open={countryOpen}
            onOpenChange={setCountryOpen}
            onValueChange={setSelectedCountryIso2}
            disabled={loading || countriesLoading}
          />

          <SearchableSelectField
            label="Regiune / stat / județ"
            value={selectedStateIso2}
            placeholder={
              statesLoading
                ? "Se încarcă regiunile..."
                : selectedCountryIso2
                  ? "Selectează regiunea"
                  : "Alege întâi țara"
            }
            emptyLabel="Nu există regiuni care se potrivesc."
            searchPlaceholder="Scrie pentru a filtra regiunile..."
            options={stateOptions}
            open={stateOpen}
            onOpenChange={setStateOpen}
            onValueChange={setSelectedStateIso2}
            disabled={loading || !selectedCountryIso2 || statesLoading}
          />

          <SearchableSelectField
            label="Oraș"
            value={selectedCityName}
            placeholder={
              citiesLoading
                ? "Se încarcă orașele..."
                : selectedStateIso2
                  ? "Selectează orașul"
                  : "Alege întâi regiunea"
            }
            emptyLabel="Nu există orașe care se potrivesc."
            searchPlaceholder="Scrie pentru a filtra orașele..."
            options={cityOptions}
            open={cityOpen}
            onOpenChange={setCityOpen}
            onValueChange={setSelectedCityName}
            disabled={loading || !selectedStateIso2 || citiesLoading}
          />

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Selecție curentă</p>
            <p className="mt-1">
              {[selectedCountry?.name, selectedState?.name, selectedCity?.name]
                .filter(Boolean)
                .join(" / ") || "Selectează locația pentru municipal admin."}
            </p>
          </div>
        </div>

        {geographyLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se încarcă datele geografice...
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Anulează
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || geographyLoading || !selectedCityName}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se promovează...
              </>
            ) : (
              "Confirmă promovarea"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
