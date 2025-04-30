import React, { useState, useEffect } from 'react';
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
import { Wand2, Save, Trash, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PromptBuilderProps {
  clientCode?: string;
  promptId?: string | null;
  isEditing?: boolean;
  activeLink?: string;
  uploadedFiles?: string[];
  description?: string;
}

interface PromptData {
  title: string;
  content: string;
  user_id: string;
  client_code?: string;
  files?: string[];
  active_link?: string;
  description: string;
}

const PromptBuilder = ({ 
  clientCode, 
  promptId, 
  isEditing = false,
  activeLink,
  uploadedFiles = [],
  description = ''
}: PromptBuilderProps) => {
  const { generatePrompt } = usePromptBuilder();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [demandCode, setDemandCode] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [localUploadedFiles, setLocalUploadedFiles] = useState<string[]>(uploadedFiles || []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'other' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalUploadedFiles(uploadedFiles || []);
  }, [uploadedFiles]);

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
      setIsUploading(true);
      // Gerar código de 6 dígitos apenas se não estiver editando
      const code = isEditing && clientCode ? clientCode : String(Math.floor(100000 + Math.random() * 900000));
      setDemandCode(code);

      // Ao editar: remover todos os arquivos antigos do Supabase Storage
      if (isEditing && uploadedFiles && uploadedFiles.length > 0) {
        for (const url of uploadedFiles) {
          const path = url.split('/demand-files/')[1]?.split('?')[0];
          if (path) {
            await supabase.storage.from('demand-files').remove([path]);
          }
        }
      }

      // Upload dos arquivos novos (apenas os que estão na edição)
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const { data, error } = await supabase.storage.from('demand-files').upload(`${code}/${file.name}`, file, { upsert: true });
          if (error) throw error;
          const { data: publicUrl } = supabase.storage.from('demand-files').getPublicUrl(`${code}/${file.name}`);
          uploadedUrls.push(publicUrl.publicUrl);
        }
      }
      // Adiciona arquivos que já estavam na lista local (localUploadedFiles) e não são novos uploads
      const finalFiles = [
        ...localUploadedFiles.filter(url => !uploadedUrls.includes(url)),
        ...uploadedUrls
      ];
      setFileUrls(finalFiles);
      setIsUploading(false);
      // Salvar demanda
      const promptData: PromptData = {
        title: `Demanda ${code}`,
        content: generatedPrompt,
        user_id: user!.id,
        client_code: code,
        files: finalFiles,
        active_link: activeLink,
        description: description,
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
      setShowCodeModal(true);
      toast({
        title: isEditing ? 'Demanda editada com sucesso!' : 'Demanda salva com sucesso!',
        description: isEditing ? 'A demanda foi atualizada.' : 'O código da demanda foi gerado.',
      });
      // Não navegar automaticamente
    } catch (error: any) {
      console.error('Erro ao salvar demanda:', error);
      toast({
        title: 'Erro ao salvar demanda',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
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

            {/* Upload de arquivos para base de conhecimento */}
            <Card>
              <CardHeader>
                <CardTitle>Base de Conhecimento</CardTitle>
                <CardDescription>
                  Faça upload de um ou mais arquivos para compor a base de conhecimento do agente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {/* Lista de arquivos já enviados */}
                  {localUploadedFiles && localUploadedFiles.length > 0 && (
                    <div className="mb-4">
                      <span className="font-medium text-sm">Arquivos já enviados:</span>
                      <ul className="mt-1 space-y-2">
                        {localUploadedFiles.map((url, idx) => {
                          const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `Arquivo ${idx + 1}`);
                          return (
                            <li key={idx} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                              <span className="inline-flex items-center gap-1 text-blue-600 underline hover:text-blue-800 text-sm break-all">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {fileName}
                                </a>
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="flex items-center gap-1 px-2 py-1 h-6"
                                  onClick={() => {
                                    const ext = fileName.split('.').pop()?.toLowerCase();
                                    if (ext === 'pdf') {
                                      setPreviewType('pdf');
                                      setPreviewUrl(url);
                                      setShowPreview(true);
                                    } else if (["jpg","jpeg","png","gif","bmp","webp","svg"].includes(ext || '')) {
                                      setPreviewType('image');
                                      setPreviewUrl(url);
                                      setShowPreview(true);
                                    } else {
                                      setPreviewType('other');
                                      setPreviewUrl(url);
                                      setShowPreview(true);
                                    }
                                  }}
                                >
                                  Visualizar
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-1 px-2 py-1 h-6"
                                  onClick={() => {
                                    setLocalUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  <Trash className="w-3 h-3" /> Remover
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label htmlFor="knowledgeFiles" className="font-medium">Adicionar arquivos</label>
                    <input
                      id="knowledgeFiles"
                      type="file"
                      multiple
                      className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          setSelectedFiles(Array.from(files));
                        }
                      }}
                    />
                  </div>
                  {selectedFiles.length === 0 ? (
                    <span className="text-muted-foreground text-sm ml-2">nenhum arquivo selecionado</span>
                  ) : (
                    <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2">
                          <span>{file.name}</span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1 px-2 py-1 h-6"
                            onClick={() => {
                              setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash className="w-3 h-3" /> Remover
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGeneratePrompt}
              className="w-full py-6 text-lg bg-promptbuilder-green hover:bg-green-600"
            >
              <Wand2 className="h-5 w-5 mr-2" />
              {isEditing ? 'Salvar Edição' : 'Salvar Demanda'}
            </Button>
          </div>
        </ScrollArea>

        <PromptModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          promptContent={generatedPrompt}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={handleSavePrompt} disabled={isSaving || isUploading} className="gap-2">
                <Save size={16} />
                {isSaving || isUploading ? 'Salvando...' : 'Salvar Demanda'}
              </Button>
            </div>
          }
        />

        {/* Modal do código da demanda */}
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Código da Demanda Gerado</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <span className="text-3xl font-bold">{demandCode}</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (demandCode) navigator.clipboard.writeText(demandCode);
                }}
              >
                <Copy size={16} /> Copiar Código
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => { setShowCodeModal(false); navigate('/prompts'); }}>
                Ir para Meus Prompts
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de visualização de arquivo */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Visualização do Arquivo</DialogTitle>
            </DialogHeader>
            {previewType === 'pdf' && previewUrl && (
              <iframe src={previewUrl} title="PDF Preview" className="w-full h-[70vh] border rounded" />
            )}
            {previewType === 'image' && previewUrl && (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] mx-auto rounded" />
            )}
            {previewType === 'other' && previewUrl && (
              <div className="flex flex-col items-center gap-4">
                <span className="text-muted-foreground">Visualização não suportada para este tipo de arquivo.</span>
                <a href={previewUrl} download className="text-blue-600 underline">Baixar arquivo</a>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowPreview(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PromptBuilder;
