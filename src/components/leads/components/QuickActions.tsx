"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check, Edit3, Send } from 'lucide-react';

interface QuickActionsProps {
  copied: boolean;
  isEditing: boolean;
  onCopy: () => void;
  onStartEdit: () => void;
}

export const QuickActions = ({ copied, isEditing, onCopy, onStartEdit }: QuickActionsProps) => {
  if (isEditing) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <Send className="h-4 w-4 text-blue-600" />
        <div>
          <h4 className="font-medium text-gray-900">Acciones Rápidas</h4>
          <p className="text-sm text-gray-600">Copia, edita o envía directamente</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="bg-white border-gray-300"
          aria-label={copied ? "Contenido copiado" : "Copiar contenido al portapapeles"}
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onStartEdit}
          className="bg-white border-gray-300"
          aria-label="Editar contenido"
        >
          <Edit3 className="h-4 w-4" />
          Editar
        </Button>
      </div>
    </div>
  );
};