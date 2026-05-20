import { useNavigate } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Activity,
  Percent,
  Eye,
  ArrowRight,
  DollarSign,
  Info,
  BarChart3,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import { fetchClaims } from "../../apiClient";
import { useState, useEffect } from "react";
import type { ClaimStatus } from "../store";

// Volume: absolute numbers per month
const volumeMensal = [
  { mes: "Nov", sinistros: 18 },
  { mes: "Dez", sinistros: 24 },
  { mes: "Jan", sinistros: 32 },
  { mes: "Fev", sinistros: 21 },
  { mes: "Mar", sinistros: 28 },
  { mes: "Abr", sinistros: 22 },
];

// Índice: percentage of LUCs with claims (out of total LUCs in the mall)
const indiceMensal = [
  { mes: "Nov", indice: 4.2 },
  { mes: "Dez", indice: 6.1 },
  { mes: "Jan", indice: 9.5 },
  { mes: "Fev", indice: 5.8 },
  { mes: "Mar", indice: 8.2 },
  { mes: "Abr", indice: 6.4 },
];

const BRAND = "#8B1A1A";
const BRAND_GOLD = "#C9A227";
const BRAND_GREEN = "#3F7D58";

type RecentActivity = {
  id: string;
  store: string;
  luc: string;
  status: ClaimStatus;
  description: string;
  time: string;
  tenantNotified?: boolean;
  irregularPolicy?: boolean;
};

const getRecentActivities = (allClaims: any[]): RecentActivity[] => {
  const formatTime = (dateStr: string) => {
    const claimDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = claimDate.toDateString() === today.toDateString();
    const isYesterday = claimDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Hoje, ${claimDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Ontem, ${claimDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return claimDate.toLocaleDateString('pt-BR');
    }
  };

  return allClaims.slice(0, 3).map((claim: any) => {
    const [storeName, lucPart] = claim.store.split(' - LUC ');
    return {
      id: claim.id,
      store: storeName || claim.store,
      luc: lucPart || 'N/A',
      status: claim.status,
      description: claim.description,
      time: formatTime(claim.date),
      tenantNotified: claim.tenantNotified,
      irregularPolicy: claim.irregularPolicy,
    };
  });
};

const statusBadge: Record<ClaimStatus, string> = {
  "Em análise": "bg-amber-100 text-amber-800 border-amber-200",
  "Aguardando seguradora": "bg-blue-100 text-blue-800 border-blue-200",
  Pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Concluído: "bg-[#F5E9D7] text-[#8B1A1A] border-[#E8DCCB]",
  Cancelado: "bg-red-100 text-red-800 border-red-200",
};

export function Dashboard() {
  const navigate = useNavigate();
  const [rawClaims, setRawClaims] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchClaims().then((list) => { setRawClaims(list); setRecentActivities(getRecentActivities(list)); }).catch(() => { setRawClaims([]); setRecentActivities([]); });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#8B1A1A]">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hub central com dados sincronizados de Lojistas, Sinistros e Relatórios.
          </p>
        </div>
        <button
          onClick={() => navigate("/novo-sinistro")}
          className="flex items-center px-5 py-2.5 bg-[#8B1A1A] hover:bg-[#701515] text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Registrar Sinistro
        </button>
      </div>

      {/* KPI Cards — Integrated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/historico")}
          className="text-left bg-white rounded-2xl border border-[#E8DCCB] shadow-sm p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sinistros Ativos
            </p>
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center text-[#8B1A1A]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">10</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -5,2%
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B1A1A] transition-colors" />
          </div>
        </button>

        <button
          onClick={() => navigate("/relatorios")}
          className="text-left bg-white rounded-2xl border border-[#E8DCCB] shadow-sm p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Índice de Sinistralidade
            </p>
            <div className="w-10 h-10 rounded-xl bg-[#EAF3EE] border border-[#CFE3D7] flex items-center justify-center text-[#3F7D58]">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            6,7<span className="text-xl text-gray-500">%</span>
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +0,4 pp
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#3F7D58] transition-colors" />
          </div>
        </button>

        <button
          onClick={() => navigate("/relatorios")}
          className="text-left bg-white rounded-2xl border border-[#E8DCCB] shadow-sm p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tempo Médio de Resolução
            </p>
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center text-[#8B1A1A]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            72<span className="text-xl text-gray-500">h</span>
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -8h
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B1A1A] transition-colors" />
          </div>
        </button>

      </div>

      {/* Additional KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#8B1A1A] to-[#701515] p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white/90">Total de Indenizações Pagas</h3>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <span className="text-4xl font-bold tracking-tight">R$ 1.245.890</span>
            <div className="mt-4 flex items-center text-sm font-medium text-white/80 gap-1 bg-black/10 w-fit px-2.5 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% vs. período anterior</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCB] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">Total de Sinistros Registrados</h3>
            <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center border border-[#E8DCCB]">
              <Activity className="w-5 h-5 text-[#8B1A1A]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 tracking-tight">145</span>
            <span className="text-sm text-gray-500 font-medium">ocorrências</span>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-emerald-700 gap-1 bg-emerald-50 w-fit px-2.5 py-1 rounded-full">
            <TrendingDown className="w-4 h-4" />
            <span>-5.2% vs. período anterior</span>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div>
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-[#E8DCCB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8B1A1A]" />
                <h3 className="text-lg font-bold text-[#8B1A1A]">Atividades Recentes</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Últimos 3 sinistros registrados, sincronizados com o Histórico.
              </p>
            </div>
            <button
              onClick={() => navigate("/historico")}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#8B1A1A] hover:underline"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-[#E8DCCB] bg-[#FAF7F2] hover:bg-white transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E8DCCB] flex items-center justify-center text-[#8B1A1A] shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{a.store}</span>
                    <span className="text-[10px] font-bold tracking-wide text-[#8B1A1A] bg-[#F5E9D7] border border-[#E8DCCB] rounded px-1.5 py-0.5">
                      LUC {a.luc}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[a.status]}`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{a.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                      {a.id} · {a.time}
                    </p>
                    {a.tenantNotified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Lojista Notificado
                      </span>
                    )}
                    {a.irregularPolicy && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-[#D93030] border border-red-200">
                        Apólice Irregular
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/sinistro/${a.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#8B1A1A] hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two distinct charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART A — Volume (Bar) */}
        <div className="bg-white border border-[#E8DCCB] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-[#8B1A1A] text-white text-[10px] font-bold tracking-wider">
                  GRÁFICO A
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B1A1A]">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Valores Absolutos
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Volume de Sinistros</h3>
              <p className="text-sm text-gray-500">
                Número total de ocorrências registradas por mês.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#8B1A1A]">145</div>
              <div className="text-xs text-gray-500 font-medium">ocorrências</div>
            </div>
          </div>

          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={volumeMensal}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                accessibilityLayer={false}
              >
                <defs>
                  <linearGradient id="volumeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} />
                    <stop offset="100%" stopColor="#B83232" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCCB" />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  label={{
                    value: "Nº de Sinistros",
                    angle: -90,
                    position: "insideLeft",
                    offset: 15,
                    style: { fill: "#6B7280", fontSize: 11, fontWeight: 600 },
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#FAF7F2" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E8DCCB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`${value} sinistros`, "Volume"]}
                />
                <Bar
                  dataKey="sinistros"
                  fill="url(#volumeBar)"
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                  label={{ position: "top", fill: "#8B1A1A", fontSize: 12, fontWeight: 700 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Mede a quantidade absoluta de eventos no shopping no período selecionado.
          </p>
        </div>

        {/* CHART B — Índice (Line + Area) */}
        <div className="bg-white border border-[#E8DCCB] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-[#3F7D58] text-white text-[10px] font-bold tracking-wider">
                  GRÁFICO B
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F7D58]">
                  <Percent className="w-3.5 h-3.5" />
                  Percentual
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Índice de Sinistralidade</h3>
              <p className="text-sm text-gray-500">
                Proporção de LUCs com sinistro sobre o total do shopping.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#3F7D58]">6,7%</div>
              <div className="text-xs text-gray-500 font-medium">média do período</div>
            </div>
          </div>

          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={indiceMensal}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                accessibilityLayer={false}
              >
                <defs>
                  <linearGradient id="indiceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND_GREEN} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={BRAND_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCCB" />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  domain={[0, 12]}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: "% sobre total de LUCs",
                    angle: -90,
                    position: "insideLeft",
                    offset: 15,
                    style: { fill: "#6B7280", fontSize: 11, fontWeight: 600 },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E8DCCB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Índice"]}
                />
                <Area
                  type="monotone"
                  dataKey="indice"
                  stroke="none"
                  fill="url(#indiceArea)"
                />
                <Line
                  type="monotone"
                  dataKey="indice"
                  stroke={BRAND_GREEN}
                  strokeWidth={3}
                  dot={{ r: 5, fill: BRAND_GOLD, stroke: BRAND_GREEN, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: BRAND_GOLD, stroke: BRAND_GREEN, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Mede o nível de risco relativo: % de lojas afetadas em relação ao total de LUCs do mall.
          </p>
        </div>
      </div>
    </div>
  );
}
