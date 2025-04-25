import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptContent: string;
  footer?: React.ReactNode;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, promptContent, footer }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promptContent)
        .then(() => {
          toast.success("Prompt copiado para a área de transferência!");
        })
        .catch(() => {
          toast.error("Falha ao copiar prompt. Tente copiar manualmente.");
        });
    } else if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      toast.success("Prompt copiado para a área de transferência!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prévia do Prompt</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 border rounded-md p-4 my-4">
          <pre className="whitespace-pre-wrap text-sm">
            {promptContent}
          </pre>
        </ScrollArea>

        <textarea
          ref={textAreaRef}
          value={promptContent}
          readOnly
          className="sr-only"
          aria-hidden="true"
        />

        <DialogFooter className="flex justify-between items-center">
          <Button onClick={handleCopy} variant="secondary" className="gap-2">
            <Copy size={16} /> Copiar Prompt
          </Button>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptModal;
