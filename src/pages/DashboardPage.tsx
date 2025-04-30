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
import { Input } from '@/components/ui/input';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        let query = supabase.from('prompts').select('*', { count: 'exact', head: false });
        if (startDate) query = query.gte('created_at', startDate + 'T00:00:00');
        if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');
        if (statusFilter) query = query.eq('status', statusFilter);
        const { data: promptsData, count: totalPrompts } = await query;
        // Contagem por status
        const statusCount: Record<string, number> = {};
        (promptsData || []).forEach((p) => {
          statusCount[p.status || 'Pendente'] = (statusCount[p.status || 'Pendente'] || 0) + 1;
        });
        setStatusCounts(statusCount);
        // Total de usuários
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        // Prompts por dia
        const promptsPerDay: Record<string, number> = {};
        (promptsData || []).forEach((p) => {
          const date = new Date(p.created_at).toLocaleDateString();
          promptsPerDay[date] = (promptsPerDay[date] || 0) + 1;
        });
        const promptsPerDayArray = Object.entries(promptsPerDay).map(([date, count]) => ({ date, count }));
        // Prompts por tipo
        const typeCount: Record<string, number> = {};
        (promptsData || []).forEach((p) => {
          typeCount[p.client_code] = (typeCount[p.client_code] || 0) + 1;
        });
        const promptsByTypeArray = Object.entries(typeCount).map(([type, value]) => ({ type, value }));
        // Atividades recentes detalhadas
        const recentActivity = (promptsData || [])
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 10)
          .map((p) => ({
            id: p.id,
            title: p.title,
            created_at: p.created_at,
            updated_at: p.updated_at,
            status: p.status,
            user: p.user_id,
            action: p.updated_at && p.updated_at !== p.created_at ? 'Editado' : 'Criado',
          }));
        setMetrics({
          totalPrompts: totalPrompts || 0,
          totalUsers: totalUsers || 0,
          promptsThisMonth: 0, // pode ser ajustado
          averagePromptsPerUser: totalUsers ? (totalPrompts || 0) / totalUsers : 0,
          promptsPerDay: promptsPerDayArray,
          promptsByType: promptsByTypeArray,
          recentActivity,
        });
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [startDate, endDate, statusFilter]);

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Data inicial</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data final</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Em Teste">Em Teste</option>
            <option value="Concluido">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Demandas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Demandas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {['Pendente','Em andamento','Em Teste','Concluido','Cancelado'].map(status => (
                <li key={status} className="flex justify-between">
                  <span>{status}</span>
                  <span className="font-bold">{statusCounts[status] || 0}</span>
                </li>
              ))}
            </ul>
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

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-xs text-gray-500">{activity.action} em {new Date(activity.updated_at || activity.created_at).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-gray-500">Status: {activity.status || 'Pendente'}</div>
                  <div className="text-xs text-gray-500">Usuário: {activity.user || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 