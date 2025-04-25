import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Prompt {
  id: string;
  title: string;
  content: string;
  client_code: string;
  client_name: string;
  created_at: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  useEffect(() => {
    filterPrompts();
  }, [searchTerm, prompts]);

  const filterPrompts = () => {
    if (!searchTerm) {
      setFilteredPrompts(prompts);
      return;
    }

    const filtered = prompts.filter((prompt) =>
      prompt.client_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrompts(filtered);
  };

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("prompts")
        .select('id, title, client_code, client_name, created_at, content')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Prompts carregados:", data);
      setPrompts(data || []);
      setFilteredPrompts(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar prompts:", error);
      toast({
        title: "Erro ao carregar prompts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promptId: string) => {
    navigate(`/builder?edit=${promptId}`);
  };

  const handleDelete = async (promptId: string) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq('id', promptId);

      if (error) throw error;

      setPrompts(prompts.filter((p) => p.id !== promptId));
      toast({
        title: "Prompt excluído",
        description: "O prompt foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (promptId: string) => {
    try {
      const { data: prompt } = await supabase
        .from("prompts")
        .select('content')
        .eq('id', promptId)
        .single();

      if (!prompt) throw new Error("Prompt não encontrado");

      await navigator.clipboard.writeText(prompt.content);
      
      toast({
        title: "Prompt copiado",
        description: "O conteúdo do prompt foi copiado para a área de transferência.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao copiar prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg">Carregando prompts...</p>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Prompts</h1>
        <Button onClick={() => navigate("/builder")}>Criar Novo Prompt</Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código do Cliente</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {searchTerm 
                      ? "Nenhum prompt encontrado com este código de cliente."
                      : "Nenhum prompt encontrado. Crie seu primeiro prompt!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {prompt.client_code || "Sem código"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(prompt.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{prompt.client_name || "Usuário não encontrado"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(prompt.id)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prompt.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(prompt.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 