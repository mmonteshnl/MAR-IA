// src/components/SearchForm.tsx
"use client";

import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Building2, Tag, Search as SearchIcon, Loader2 } from "lucide-react";

interface SearchFormProps {
  country: string;
  place: string;
  businessTypeInput: string;
  keywords: string;
  loading: boolean;
  onCountryChange: (v: string) => void;
  onPlaceChange: (v: string) => void;
  onBusinessTypeChange: (v: string) => void;
  onKeywordsChange: (v: string) => void;
  onSubmit: (e?: FormEvent) => void;
}

export default function SearchForm({
  country,
  place,
  businessTypeInput,
  keywords,
  loading,
  onCountryChange,
  onPlaceChange,
  onBusinessTypeChange,
  onKeywordsChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="country" className="flex items-center mb-1 text-sm font-medium">
          <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
          País (ej. ES, MX)
        </Label>
        <Input
          id="country"
          value={country}
          onChange={e => onCountryChange(e.target.value)}
          placeholder="Código o nombre"
          className="bg-input placeholder:text-muted-foreground"
        />
      </div>
      <div>
        <Label htmlFor="place" className="flex items-center mb-1 text-sm font-medium">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          Lugar (Ciudad/Región)
        </Label>
        <Input
          id="place"
          value={place}
          onChange={e => onPlaceChange(e.target.value)}
          placeholder="Ciudad o región"
          className="bg-input placeholder:text-muted-foreground"
        />
      </div>
      <div>
        <Label htmlFor="businessType" className="flex items-center mb-1 text-sm font-medium">
          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
          Tipo de Negocio
        </Label>
        <Input
          id="businessType"
          value={businessTypeInput}
          onChange={e => onBusinessTypeChange(e.target.value)}
          placeholder="restaurante, gimnasio..."
          className="bg-input placeholder:text-muted-foreground"
        />
      </div>
      <div>
        <Label htmlFor="keywords" className="flex items-center mb-1 text-sm font-medium">
          <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
          Palabras Clave
        </Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={e => onKeywordsChange(e.target.value)}
          placeholder="vegano, 24h..."
          className="bg-input placeholder:text-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        className="w-full py-2.5 text-base bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={loading}
      >
        {loading
          ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          : <SearchIcon className="mr-2 h-5 w-5" />
        }
        Buscar Negocios
      </Button>
    </form>
  );
}