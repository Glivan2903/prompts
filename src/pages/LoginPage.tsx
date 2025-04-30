import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Lado Esquerdo - Background e Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-[#61CE70] to-[#58FF0F] items-center justify-center relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-8">
          <div className="w-full max-w-md">
            <Logo size="lg" className="mx-auto mb-12" />
            <h2 className="text-4xl font-bold mb-6">Painel de Demandas IA</h2>
            <p className="text-xl opacity-90 max-w-sm mx-auto">
            Seu ponto central para gerenciar tudo o que seus clientes pedem com IA
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo para telas menores */}
          <div className="lg:hidden flex justify-center mb-12">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Bem-vindo!</h1>
            <p className="text-gray-600 text-lg">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-[#61CE70]" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 border-gray-200 focus:border-[#61CE70] focus:ring-[#61CE70]"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-[#61CE70]" />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 border-gray-200 focus:border-[#61CE70] focus:ring-[#61CE70]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#61CE70] to-[#58FF0F] hover:from-[#58FF0F] hover:to-[#61CE70] text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 