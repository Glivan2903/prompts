import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Prompt {
  id: string;
  title: string;
  content: string;
  client_code: string;
  active_link?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
}

interface Note {
  id: string;
  prompt_id: string;
  content: string;
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const notesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  useEffect(() => {
    filterPrompts();
  }, [searchTerm, prompts]);

  useEffect(() => {
    if (notesOpenId && notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [notes, notesOpenId]);

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
        .select('id, title, client_code, active_link, created_at, updated_at, content, status')
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
    setDeleteId(promptId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      setPrompts(prompts.filter((p) => p.id !== deleteId));
      setFilteredPrompts(filteredPrompts.filter((p) => p.id !== deleteId));
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
    } finally {
      setDeleteId(null);
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

  const fetchNotes = async (promptId: string) => {
    setNotesLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("prompt_id", promptId)
      .order("created_at", { ascending: true });
    if (!error) {
      setNotes(data || []);
    }
    setNotesLoading(false);
  };

  const handleOpenNotes = (promptId: string) => {
    setNotesOpenId(promptId);
    setNewNote("");
    fetchNotes(promptId);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !notesOpenId) return;
    const { data, error } = await supabase
      .from("notes")
      .insert({ prompt_id: notesOpenId, content: newNote })
      .select("*")
      .single();
    if (!error && data) {
      setNotes((prev) => [...prev, data]);
      setNewNote("");
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
        <h1 className="text-3xl font-bold">Minhas Demandas</h1>
        <Button onClick={() => navigate("/builder")}
          className="h-12 bg-gradient-to-r from-[#61CE70] to-[#58FF0F] hover:from-[#58FF0F] hover:to-[#61CE70] text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
        >
          Criar Nova Demanda
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código da demanda..."
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
                <TableHead>Demanda</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Data de Atualização</TableHead>
                <TableHead>Link do Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchTerm 
                      ? "Nenhuma demanda encontrada com este código."
                      : "Nenhuma demanda encontrada. Crie sua primeira demanda!"}
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
                    <TableCell>
                      {prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </TableCell>
                    <TableCell>
                      {prompt.active_link ? (
                        <a href={prompt.active_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                          {prompt.active_link}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sem link</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <select
                        value={prompt.status || 'Pendente'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await supabase
                            .from('prompts')
                            .update({ status: newStatus })
                            .eq('id', prompt.id);
                          setPrompts((prev) => prev.map((p) => p.id === prompt.id ? { ...p, status: newStatus } : p));
                          setFilteredPrompts((prev) => prev.map((p) => p.id === prompt.id ? { ...p, status: newStatus } : p));
                        }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Em Teste">Em Teste</option>
                        <option value="Concluido">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </TableCell>
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenNotes(prompt.id)}
                          title="Anotações"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Anotações
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

      {/* Popup de confirmação de exclusão */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">Tem certeza que deseja excluir esta demanda? Esta ação não poderá ser desfeita.</div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notesOpenId} onOpenChange={(open) => { if (!open) setNotesOpenId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anotações da Demanda</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto py-2">
            {notesLoading ? (
              <div className="text-center text-muted-foreground">Carregando anotações...</div>
            ) : notes.length === 0 ? (
              <div className="text-center text-muted-foreground">Nenhuma anotação ainda.</div>
            ) : (
              <>
                {notes.map((note) => (
                  <div key={note.id} className="rounded border p-2 bg-muted">
                    <div className="text-xs text-gray-500 mb-1 flex justify-end">
                      <span>{new Date(note.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-sm whitespace-pre-line">{note.content}</div>
                  </div>
                ))}
                <div ref={notesEndRef} />
              </>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Digite uma anotação..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 