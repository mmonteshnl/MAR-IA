"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, RotateCcw } from 'lucide-react';
import { ActionResult } from '@/types/actionResult';

interface ContentViewProps {
  actionResult: ActionResult;
  isEditing: boolean;
  editedContent: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CARD_STYLES = "bg-gray-50 border border-gray-200 p-6 rounded-lg";

export const ContentView = ({ 
  actionResult, 
  isEditing, 
  editedContent, 
  onContentChange, 
  onSave, 
  onCancel 
}: ContentViewProps) => {
  if (!actionResult || 'error' in actionResult) return null;

  return (
    <div className={CARD_STYLES}>
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editando Contenido
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onSave}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
          <Textarea
            value={editedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[200px] text-sm leading-relaxed bg-white"
            placeholder="Edita el contenido aquí..."
          />
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          {'message' in actionResult && actionResult.message && (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {actionResult.message}
            </div>
          )}
          
          {'evaluation' in actionResult && actionResult.evaluation && (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {actionResult.evaluation}
            </div>
          )}

          {'email_subject' in actionResult && actionResult.email_subject && actionResult.email_body && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Asunto:</h4>
                <p className="text-gray-800">{actionResult.email_subject}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Mensaje:</h4>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {actionResult.email_body}
                </div>
              </div>
            </div>
          )}
          
          {'recommendations' in actionResult && actionResult.recommendations && (
            <div className="space-y-4">
              {actionResult.recommendations.map((rec, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{rec.area}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{rec.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};