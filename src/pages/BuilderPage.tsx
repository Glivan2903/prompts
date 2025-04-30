import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PromptBuilderProvider } from '@/contexts/PromptBuilderContext';
import PromptBuilder from '@/components/PromptBuilder';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from "@/components/ui/textarea";

const BuilderPage = () => {
  const [clientCode, setClientCode] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptId, setPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeLink, setActiveLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editPromptId = searchParams.get('edit');
    
    if (editPromptId) {
      setPromptId(editPromptId);
      loadPromptData(editPromptId);
    }
  }, [location]);

  const loadPromptData = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        console.log("Dados do prompt carregados:", data);
        setClientCode(data.client_code || '');
        setPromptContent(data.content);
        setActiveLink(data.active_link || '');
        setUploadedFiles(data.files || []);
        setDescription(data.description || '');
      }
    } catch (error: any) {
      console.error("Erro ao carregar prompt:", error);
      toast({
        title: "Erro ao carregar prompt",
        description: error.message,
        variant: "destructive",
      });
      navigate('/prompts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg text-muted-foreground">Carregando dados do prompt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {promptId ? 'Editar Demanda' : 'Criar Demanda'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as opções abaixo para {promptId ? 'atualizar' : 'criar'} seu prompt
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowDebug(!showDebug)}
          className={showDebug ? "bg-accent" : ""}
        >
          <Bug className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Insira o link do Active para identificação do prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <Label htmlFor="activeLink">Link do Active</Label>
              <Input
                id="activeLink"
                type="url"
                value={activeLink}
                onChange={(e) => setActiveLink(e.target.value)}
                placeholder="Cole o link do Active"
                className="mt-1.5 w-full"
              />
            </div>
            <div className="w-full">
              <Label htmlFor="descricaoPrompt">Descrição</Label>
              <Textarea
                id="descricaoPrompt"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para este prompt"
                className="mt-1.5 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showDebug && promptId && (
        <Card>
          <CardHeader>
            <CardTitle>Modo Debug</CardTitle>
            <CardDescription>
              Visualize e edite o conteúdo bruto do prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="debugContent"
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="font-mono text-xs h-64"
            />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="secondary"
                onClick={() => setShowDebug(false)}
              >
                Atualizar Construtor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <PromptBuilderProvider initialContent={promptId ? promptContent : undefined}>
        <PromptBuilder
          clientCode={clientCode}
          promptId={promptId}
          isEditing={!!promptId}
          activeLink={activeLink}
          uploadedFiles={uploadedFiles}
          description={description}
        />
      </PromptBuilderProvider>
    </div>
  );
};

export default BuilderPage;
