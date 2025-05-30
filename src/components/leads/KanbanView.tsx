// components/leads/KanbanView.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Import ScrollArea
import { MoreVertical, AlertCircle, Dot, Phone, MessageSquareText, Mail as MailIconLucide, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { Lead } from '@/types';

// Define LeadStage type based on LEAD_STAGES if not exported from '@/types'
type LeadStage = (typeof LEAD_STAGES)[number];
import { LEAD_STAGES, stageColors, LOCAL_FALLBACK_SOURCE } from '@/lib/leads-utils';
import LeadActionButtons from './LeadActionButtons'; 
import { isFieldMissing, generateWhatsAppLink } from '@/lib/leads-utils';

interface KanbanViewProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onOpenLeadDetails: (lead: Lead) => void;
  // AI Action Props
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  currentActionLead: Lead | null;
  isActionLoading: boolean;
  currentActionType: string | null;
  selectedLeadForDetails: Lead | null; 
}

export default function KanbanView({
  leads,
  onStageChange,
  onOpenLeadDetails,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  currentActionLead,
  isActionLoading,
  currentActionType,
  selectedLeadForDetails,
}: KanbanViewProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap"> {/* Added ScrollArea and whitespace-nowrap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-x-5 gap-y-5 px-1 pb-4">
        {LEAD_STAGES.map(stage => (
          <div key={stage} className="flex-shrink-0 w-full inline-block align-top"> {/* Ensure columns are laid out horizontally for scroll */}
            <Card className="bg-card border-border/30 shadow-none min-h-[300px] max-h-[80vh] flex flex-col rounded-[var(--radius)]">
              <CardHeader className="pb-3 pt-4 px-4 sticky top-0 bg-card z-10 border-b border-border/20 rounded-t-[var(--radius)]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={`mr-2.5 h-2.5 w-2.5 rounded-full ${stageColors[stage].split(' ')[0]}`}></span>
                    <CardTitle className="text-base font-semibold text-foreground">{stage}</CardTitle>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({leads.filter(lead => lead.stage === stage).length})
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground">$0.00</p> {/* Changed from text-primary to text-foreground */}
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto p-3 pt-3 max-h-[calc(80vh-140px)]">
                {leads.filter(lead => lead.stage === stage).length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center">No hay leads en esta etapa.</p>
                  </div>
                )}
                {leads.filter(lead => lead.stage === stage).map(lead => {
                  const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
                  const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
                  const isImportedIncomplete = isImported && (
                      isFieldMissing(lead.address) || isFieldMissing(lead.businessType) ||
                      isFieldMissing(lead.company) || isFieldMissing(lead.website)
                  );
                  const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));
                  const isSelected = selectedLeadForDetails?.id === lead.id;

                  return (
                    <Card
                      key={lead.id}
                      className={`
                        ${isSelected ? 'bg-secondary' : 'bg-muted'} 
                        text-foreground border 
                        ${isImportedIncomplete ? 'border-dashed border-orange-500/50' : (isSelected ? 'border-primary/70' : 'border-border/20')}
                        rounded-[var(--radius)] transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md
                        ${currentActionLead?.id === lead.id ? 'ring-1 ring-primary/70' : ''}
                      `}
                      onClick={() => onOpenLeadDetails(lead)}
                    >
                      <CardHeader className="p-3 flex flex-row items-start justify-between space-x-2">
                        <div className="flex-grow space-y-0.5 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground leading-tight flex items-center truncate" title={lead.name}>
                              <span className="truncate">{lead.name}</span>
                              {isLocal && <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0"  />}
                              {isImportedIncomplete && <AlertCircle className="h-3.5 w-3.5 text-orange-400 ml-1 flex-shrink-0" />}
                            </h3>
                            {!isFieldMissing(lead.company) && <p className="text-xs text-muted-foreground truncate" title={lead.company!}>{lead.company}</p>}
                            {!isFieldMissing(lead.address) && <p className="text-xs text-muted-foreground truncate" title={lead.address!}>{lead.address}</p>}
                            
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {isLocal && <span className="text-[10px] px-1.5 py-0.5 bg-background text-muted-foreground rounded-full">Local</span>}
                              {isImported && <span className="text-[10px] px-1.5 py-0.5 bg-background text-muted-foreground rounded-full">Importado</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            <Avatar className="h-8 w-8 border border-border/30">
                              <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo" />
                              <AvatarFallback className="bg-background text-muted-foreground text-xs">
                                {lead.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary mt-auto" onClick={(e: React.MouseEvent) => { e.stopPropagation(); /* TODO: Open three-dot menu */ }}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-3 pt-1">
                        <div className="flex items-center justify-start space-x-1 text-xs text-muted-foreground mb-2.5">
                            {!isFieldMissing(lead.phone) && (
                                <a href={`tel:${lead.phone}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Llamar a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {generateWhatsAppLink(lead) && ( 
                                <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" onClick={(e: React.MouseEvent) => e.stopPropagation()} title="Enviar WhatsApp" className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                    <MessageSquareText className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {!isFieldMissing(lead.email) && (
                                <a href={`mailto:${lead.email}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Enviar email a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                    <MailIconLucide className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {!isFieldMissing(lead.website) && (
                                <a href={lead.website!} target="_blank" rel="noopener noreferrer" onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Visitar sitio web de ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className="text-xs text-muted-foreground/70 italic pl-1">Sin contacto directo</span>}
                          </div>
                          <LeadActionButtons
                              lead={lead}
                              onGenerateWelcomeMessage={onGenerateWelcomeMessage}
                              onEvaluateBusiness={onEvaluateBusiness}
                              onGenerateSalesRecommendations={onGenerateSalesRecommendations}
                              onGenerateSolutionEmail={onGenerateSolutionEmail}
                              currentActionLead={currentActionLead}
                              isActionLoading={isActionLoading}
                              currentActionType={currentActionType}
                          />
                        </CardContent>
                      <CardFooter className="p-3 border-t border-border/20 mt-auto"> {/* Added mt-auto to push footer down */}
                        <Select value={lead.stage} onValueChange={(newStage) => onStageChange(lead.id, newStage as LeadStage)}>
                            <SelectTrigger className="w-full h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                                <SelectValue placeholder="Cambiar etapa" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                {LEAD_STAGES.map(s => (
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                      </CardFooter>
                    </Card>
                  )})}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
