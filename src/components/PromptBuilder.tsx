import React, { useState } from 'react';
import { usePromptBuilder } from '@/contexts/PromptBuilderContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AgentSection from '@/components/AgentSection';
import FieldsConfiguratorSection from '@/components/FieldsConfiguratorSection';
import ValidationsSection from '@/components/ValidationsSection';
import RulesSection from '@/components/RulesSection';
import FunctionsSection from '@/components/FunctionsSection';
import PromptModal from '@/components/PromptModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Wand2, Save } from 'lucide-react';

interface PromptBuilderProps {
  clientCode?: string;
  promptId?: string | null;
  isEditing?: boolean;
}

interface PromptData {
  title: string;
  content: string;
  user_id: string;
  client_code?: string;
}

const PromptBuilder = ({ 
  clientCode, 
  promptId, 
  isEditing = false 
}: PromptBuilderProps) => {
  const { generatePrompt } = usePromptBuilder();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGeneratePrompt = () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar prompts.",
        variant: "destructive",
      });
      return;
    }

    const prompt = generatePrompt();
    setGeneratedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleSavePrompt = async () => {
    try {
      setIsSaving(true);

      const promptData: PromptData = {
        title: `Prompt ${new Date().toLocaleDateString('pt-BR')}`,
        content: generatedPrompt,
        user_id: user!.id,
        client_code: clientCode || null,
      };

      let result;
      
      if (isEditing && promptId) {
        result = await supabase
          .from('prompts')
          .update(promptData)
          .eq('id', promptId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('prompts')
          .insert(promptData)
          .select()
          .single();
      }

      const { error } = result;

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: isEditing ? "Prompt atualizado com sucesso!" : "Prompt salvo com sucesso!",
        description: "O prompt foi salvo e pode ser encontrado na página 'Meus Prompts'.",
      });

      navigate('/prompts');
    } catch (error: any) {
      console.error('Erro ao salvar prompt:', error);
      toast({
        title: "Erro ao salvar prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center px-0">
        <CardTitle className="text-2xl font-bold">
          Configuração do Prompt
        </CardTitle>
        <CardDescription>
          Defina as características e comportamentos do seu agente de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Agente</CardTitle>
                <CardDescription>
                  Defina o nome, descrição e características básicas do agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentSection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campos de Configuração</CardTitle>
                <CardDescription>
                  Configure os campos que o agente deve utilizar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldsConfiguratorSection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validações</CardTitle>
                <CardDescription>
                  Defina as regras de validação para os campos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValidationsSection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regras de Negócio</CardTitle>
                <CardDescription>
                  Configure as regras que o agente deve seguir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RulesSection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funções Disponíveis</CardTitle>
                <CardDescription>
                  Defina as funções que o agente pode utilizar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FunctionsSection />
              </CardContent>
            </Card>

            <Button
              onClick={handleGeneratePrompt}
              className="w-full py-6 text-lg bg-promptbuilder-green hover:bg-green-600"
            >
              <Wand2 className="h-5 w-5 mr-2" />
              Gerar Prévia do Prompt
            </Button>
          </div>
        </ScrollArea>

        <PromptModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          promptContent={generatedPrompt}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={handleSavePrompt} disabled={isSaving} className="gap-2">
                <Save size={16} />
                {isSaving ? "Salvando..." : "Salvar Prompt"}
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
};

export default PromptBuilder;
