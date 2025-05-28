
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"; // Added Label for accessibility
import LoadingSpinner from '@/components/LoadingSpinner';
import { Info, Save, Loader2, PackageSearch, Search as SearchIconLucide } from 'lucide-react';

interface Business {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  types?: string[];
  // Add other potential fields if necessary
}

interface SearchResultsProps {
  searchResults: Business[];
  selectedLeads: Set<string>;
  hasSearched: boolean;
  searchLoading: boolean;
  saveLoading: boolean;
  onToggleLead: (placeId: string) => void;
  onShowDetails: (business: Business) => void;
  onAddToLeads: () => void;
}

export default function SearchResults({
  searchResults,
  selectedLeads,
  hasSearched,
  searchLoading,
  saveLoading,
  onToggleLead,
  onShowDetails,
  onAddToLeads,
}: SearchResultsProps) {

  if (searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <LoadingSpinner size="lg" />
        <p className="mt-4">Buscando negocios...</p>
      </div>
    );
  }

  if (!hasSearched && !searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <SearchIconLucide className="h-16 w-16 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Encuentra Nuevos Leads</h3>
        <p className="text-sm">
          Utiliza el formulario de la izquierda para buscar negocios potenciales.
        </p>
      </div>
    );
  }

  if (hasSearched && !searchLoading && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <PackageSearch className="h-16 w-16 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No se Encontraron Resultados</h3>
        <p className="text-sm">
          Intenta ajustar tus criterios de búsqueda.
        </p>
      </div>
    );
  }

  if (searchResults.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-foreground">Resultados ({searchResults.length})</h3>
          <Button
            onClick={onAddToLeads}
            disabled={selectedLeads.size === 0 || saveLoading}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />
            }
            Añadir Seleccionados ({selectedLeads.size})
          </Button>
        </div>
        <ScrollArea className="flex-grow border border-border rounded-md bg-card p-1">
          <ul className="space-y-2 p-2">
            {searchResults.map((business) => (
              <li
                key={business.place_id}
                className="flex items-center p-2.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <Checkbox
                  id={`lead-search-${business.place_id}`} // Ensure unique ID for checkbox
                  checked={selectedLeads.has(business.place_id)}
                  onCheckedChange={() => onToggleLead(business.place_id)}
                  className="mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  aria-labelledby={`lead-name-${business.place_id}`} // For accessibility
                />
                <div className="flex-grow">
                  <Label 
                    htmlFor={`lead-search-${business.place_id}`} 
                    id={`lead-name-${business.place_id}`} // For aria-labelledby
                    className="font-medium text-sm text-foreground cursor-pointer"
                  >
                    {business.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {business.vicinity || business.formatted_address || 'Dirección no disponible'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShowDetails(business)}
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title="Ver detalles"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    );
  }

  return null; // Should not be reached if logic above is correct
}
