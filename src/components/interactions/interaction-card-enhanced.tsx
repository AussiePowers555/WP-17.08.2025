'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InteractionFeedView } from '@/types/interaction';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText,
  Clock,
  ChevronRight,
  Building2,
  Briefcase,
  Car,
  User,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InteractionCardEnhancedProps {
  interaction: InteractionFeedView;
  onUpdate?: (interaction: InteractionFeedView) => void;
  onDelete?: (interactionId: number) => void;
  compact?: boolean;
}

const interactionIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  sms: MessageSquare,
  note: FileText,
  document: FileText
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: AlertCircle,
  in_progress: Clock,
  completed: CheckCircle,
  follow_up_required: AlertCircle
};

export function InteractionCardEnhanced({
  interaction,
  onUpdate,
  onDelete,
  compact = false
}: InteractionCardEnhancedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const Icon = interactionIcons[interaction.interactionType] || FileText;
  const StatusIcon = statusIcons[interaction.status] || CheckCircle;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Navigate to case view
    if (interaction.caseId) {
      router.push(`/cases/${interaction.caseId}`);
    }
  };
  
  const formattedDate = format(new Date(interaction.timestamp), 'MMM dd, yyyy HH:mm');
  
  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer",
        "border-l-4",
        interaction.priority === 'urgent' && "border-l-red-500",
        interaction.priority === 'high' && "border-l-orange-500",
        interaction.priority === 'medium' && "border-l-blue-500",
        interaction.priority === 'low' && "border-l-gray-400"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              interaction.interactionType === 'call' && "bg-green-100",
              interaction.interactionType === 'email' && "bg-blue-100",
              interaction.interactionType === 'meeting' && "bg-purple-100",
              interaction.interactionType === 'sms' && "bg-yellow-100",
              interaction.interactionType === 'note' && "bg-gray-100",
              interaction.interactionType === 'document' && "bg-indigo-100"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  Case #{interaction.caseNumber}
                </span>
                <Badge variant="outline" className="capitalize">
                  {interaction.interactionType}
                </Badge>
                <Badge className={priorityColors[interaction.priority]}>
                  {interaction.priority}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedDate}
                </span>
                {interaction.createdByName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {interaction.createdByName}
                  </span>
                )}
              </div>
              
              {/* Case Details Row */}
              {!compact && (
                <div className="flex items-center gap-4 mt-2">
                  {interaction.insuranceCompany && (
                    <span className="flex items-center gap-1 text-xs">
                      <Building2 className="h-3 w-3" />
                      {interaction.insuranceCompany}
                    </span>
                  )}
                  {interaction.lawyerAssigned && (
                    <span className="flex items-center gap-1 text-xs">
                      <Briefcase className="h-3 w-3" />
                      {interaction.lawyerAssigned}
                    </span>
                  )}
                  {interaction.rentalCompany && (
                    <span className="flex items-center gap-1 text-xs">
                      <Car className="h-3 w-3" />
                      {interaction.rentalCompany}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <StatusIcon className={cn(
                "h-4 w-4",
                interaction.status === 'completed' && "text-green-600",
                interaction.status === 'in_progress' && "text-blue-600",
                interaction.status === 'pending' && "text-yellow-600",
                interaction.status === 'follow_up_required' && "text-red-600"
              )} />
              <span className="text-xs capitalize">
                {interaction.status.replace('_', ' ')}
              </span>
            </div>
            
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Contact Information */}
        {interaction.contactName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Contact:</span>
            <span>{interaction.contactName}</span>
            {interaction.contactPhone && (
              <span className="text-muted-foreground">• {interaction.contactPhone}</span>
            )}
            {interaction.contactEmail && (
              <span className="text-muted-foreground">• {interaction.contactEmail}</span>
            )}
          </div>
        )}
        
        {/* Structured Content */}
        <div className="space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div>
              <span className="font-medium text-sm">Situation:</span>
              <p className="text-sm mt-1">{interaction.situation}</p>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div>
              <span className="font-medium text-sm">Action Taken:</span>
              <p className="text-sm mt-1">{interaction.actionTaken}</p>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div>
              <span className="font-medium text-sm">Outcome:</span>
              <p className="text-sm mt-1">{interaction.outcome}</p>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        {interaction.tags && interaction.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {interaction.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        {!compact && (onUpdate || onDelete) && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            {onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(interaction);
                }}
                className="gap-1"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                disabled={isDeleting}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Interaction"
        description={`Are you sure you want to delete this interaction? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete?.(interaction.id);
            toast({
              title: "Interaction deleted",
              description: "The interaction has been successfully deleted.",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete the interaction. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </Card>
  );
}