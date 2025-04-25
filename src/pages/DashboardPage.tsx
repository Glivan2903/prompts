import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardMetrics {
  totalPrompts: number;
  totalUsers: number;
  promptsThisMonth: number;
  averagePromptsPerUser: number;
  promptsPerDay: Array<{ date: string; count: number }>;
  promptsByType: Array<{ type: string; value: number }>;
  recentActivity: Array<{ id: string; title: string; created_at: string }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPrompts: 0,
    totalUsers: 0,
    promptsThisMonth: 0,
    averagePromptsPerUser: 0,
    promptsPerDay: [],
    promptsByType: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Buscar total de prompts
        const { count: totalPrompts } = await supabase
          .from("prompts")
          .select("*", { count: "exact", head: true });

        // Buscar total de usuários
        const { count: totalUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // Buscar prompts deste mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: promptsThisMonth } = await supabase
          .from("prompts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        // Buscar prompts por dia (últimos 7 dias)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const { data: promptsPerDay } = await supabase
          .from("prompts")
          .select("created_at")
          .gte("created_at", last7Days.toISOString());

        // Processar dados para gráfico de linha
        const dailyPrompts = promptsPerDay?.reduce((acc: any, prompt) => {
          const date = new Date(prompt.created_at).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const promptsPerDayArray = Object.entries(dailyPrompts || {}).map(
          ([date, count]) => ({
            date,
            count: count as number,
          })
        );

        // Buscar tipos de prompts mais comuns
        const { data: promptTypes } = await supabase
          .from("prompts")
          .select("client_code")
          .limit(100);

        const typeCount = promptTypes?.reduce((acc: Record<string, number>, prompt) => {
          acc[prompt.client_code] = (acc[prompt.client_code] || 0) + 1;
          return acc;
        }, {});

        const promptsByTypeArray = Object.entries(typeCount || {}).map(
          ([type, value]) => ({
            type,
            value: value as number,
          })
        );

        // Buscar atividade recente
        const { data: recentActivity } = await supabase
          .from("prompts")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        setMetrics({
          totalPrompts: totalPrompts || 0,
          totalUsers: totalUsers || 0,
          promptsThisMonth: promptsThisMonth || 0,
          averagePromptsPerUser: totalUsers ? (totalPrompts || 0) / totalUsers : 0,
          promptsPerDay: promptsPerDayArray,
          promptsByType: promptsByTypeArray || [],
          recentActivity: recentActivity || [],
        });
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPrompts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompts este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.promptsThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averagePromptsPerUser.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Linha - Prompts por Dia */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Prompts por Dia</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.promptsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#52c41a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Tipos de Prompts */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.promptsByType}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {metrics.promptsByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="font-medium">{activity.title}</div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 