import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Calendar as CalendarIcon,
  Search,
  ChevronDown,
  Tag,
  Store,
  ListChecks,
  Target,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { fetchClaims } from "../../apiClient";
import type { ClaimStatus, ClaimSeverity } from "../store";

export function Reports() {
  const [periodFrom, setPeriodFrom] = useState("2026-04-01");
  const [periodTo, setPeriodTo] = useState("2026-04-27");
  const [unitLucSearch, setUnitLucSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | ClaimStatus
  >("Todos");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    [],
  );
  const [severityFilter, setSeverityFilter] = useState<
    "Todas" | ClaimSeverity
  >("Todas");
  const [responsibility, setResponsibility] = useState<
    "Todos" | "Interna" | "Externa"
  >("Todos");
  const [category, setCategory] = useState("todos");
  const [isGenerating, setIsGenerating] = useState(false);

  const allAreas = [
    "Manutenção",
    "Brigada",
    "Engenharia",
    "Conservação",
    "Relacionamento",
    "Segurança / CFTV",
    "Estacionamento",
    "Arquitetura",
  ];

  const filteredClaims = useMemo(() => {
    const claims = rawClaims;
    return claims.filter((claim) => {
      const claimDate = new Date(claim.date);
      const from = new Date(periodFrom);
      const to = new Date(periodTo);
      const inDateRange = claimDate >= from && claimDate <= to;

      const matchesUnitLuc =
        !unitLucSearch ||
        claim.store
          .toLowerCase()
          .includes(unitLucSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "Todos" ||
        claim.status === statusFilter;

      const matchesArea =
        selectedAreas.length === 0 ||
        (claim.responsibleArea &&
          selectedAreas.includes(claim.responsibleArea));

      const matchesSeverity =
        severityFilter === "Todas" ||
        claim.severity === severityFilter;

      const matchesCategory =
        category === "todos" ||
        claim.type
          .toLowerCase()
          .includes(category.toLowerCase());

      return (
        inDateRange &&
        matchesUnitLuc &&
        matchesStatus &&
        matchesArea &&
        matchesSeverity &&
        matchesCategory
      );
    });
  }, [
    periodFrom,
    periodTo,
    unitLucSearch,
    statusFilter,
    selectedAreas,
    severityFilter,
    category,
  ]);

  const [rawClaims, setRawClaims] = useState<any[]>([]);
  useEffect(() => {
    fetchClaims().then(setRawClaims).catch(() => setRawClaims([]));
  }, []);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Relatório Final gerado com sucesso");
    }, 2000);
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area],
    );
  };

  const getSeverityBadge = (severity: ClaimSeverity) => {
    const styles = {
      Alta: "bg-red-100 text-red-800 border-red-200",
      Média: "bg-amber-100 text-amber-800 border-amber-200",
      Baixa:
        "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return styles[severity] || "";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      {/* TOP SECTION: DYNAMIC FILTER GRID */}
      <div className="bg-white border border-[#E8DCCB] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#8B1A1A]" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Filtros de Relatório
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">
              ✓ Sync: Branding_Book_v2
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Input 1: Period (Date Range) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" /> Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none cursor-pointer transition-all"
              />
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none cursor-pointer transition-all"
              />
            </div>
          </div>

          {/* Input 2: Unit/LUC (Searchable) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Unidade / LUC
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={unitLucSearch}
                onChange={(e) =>
                  setUnitLucSearch(e.target.value)
                }
                placeholder="Nome da loja ou LUC..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none transition-all"
              />
            </div>
          </div>

          {/* Input 3: Status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as typeof statusFilter,
                  )
                }
                className="w-full appearance-none pl-3 pr-9 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none cursor-pointer transition-all"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Em análise">Em análise</option>
                <option value="Aguardando seguradora">
                  Aguardando seguradora
                </option>
                <option value="Pago">Pago</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Input 4: Gravidade */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
              Gravidade
            </label>
            <div className="relative">
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(
                    e.target.value as typeof severityFilter,
                  )
                }
                className="w-full appearance-none pl-3 pr-9 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none cursor-pointer transition-all"
              >
                <option value="Todas">
                  Todas as Gravidades
                </option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Input 5: Categoria — movida para ficar ao lado de Gravidade */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Categoria
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-3 pr-9 py-2.5 bg-white border border-[#E8DCCB] rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] hover:border-[#8B1A1A] active:bg-[#FAF7F2] outline-none cursor-pointer transition-all"
              >
                <option value="todos">
                  Todas as Categorias
                </option>
                <option value="vazamento">
                  Vazamento / Infiltração
                </option>
                <option value="incendio">Incêndio</option>
                <option value="dano">
                  Dano Físico / Vandalismo
                </option>
                <option value="furto">Furto / Roubo</option>
                <option value="acidente">
                  Acidente Pessoal
                </option>
                <option value="desastre">
                  Desastre Natural
                </option>
                <option value="estrutural">
                  Dano Estrutural
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Input 6: Responsabilidade */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
              Responsabilidade
            </label>
            <div className="flex gap-2">
              {(["Todos", "Interna", "Externa"] as const).map(
                (resp) => (
                  <button
                    key={resp}
                    onClick={() => setResponsibility(resp)}
                    className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                      responsibility === resp
                        ? "bg-[#8B1A1A] text-white border-[#8B1A1A] shadow-sm"
                        : "bg-white text-gray-700 border-[#E8DCCB] hover:border-[#8B1A1A] hover:bg-[#FAF7F2] active:bg-[#FAF7F2]"
                    }`}
                  >
                    {resp}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Input 7: Área (Multi-select) — ocupa a linha inteira */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Área
            </label>
            <div className="flex flex-wrap gap-2">
              {allAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    selectedAreas.includes(area)
                      ? "bg-[#8B1A1A] text-white border-[#8B1A1A] shadow-sm"
                      : "bg-white text-gray-700 border-[#E8DCCB] hover:border-[#8B1A1A] hover:bg-[#FAF7F2] active:bg-[#FAF7F2]"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="mt-6 pt-6 border-t border-[#E8DCCB] flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-[#8B1A1A] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#701515] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Gerar Relatório Final
              </>
            )}
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: DOCUMENT PREVIEW */}
      <div className="bg-white border border-[#E8DCCB] rounded-2xl p-6 shadow-sm">
        <div className="max-h-[800px] overflow-y-auto">
          {/* A4 Document Canvas */}
          <div
            className="bg-white shadow-lg mx-auto"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm",
            }}
          >
            {/* Header */}
            <div className="border-b-2 border-[#8B1A1A] pb-6 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#8B1A1A] mb-2">
                    Flamboyant Shopping
                  </h1>
                  <p className="text-sm text-gray-600 italic">
                    Elevar para evoluir, envolver para encantar
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Relatório de Sinistros</p>
                  <p>
                    Período: {periodFrom} a {periodTo}
                  </p>
                  <p>
                    Gerado em:{" "}
                    {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Body: Data Table */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Sinistros Registrados
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b-2 border-[#8B1A1A]">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">
                      Data
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">
                      Loja
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">
                      Área Responsável
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">
                      Responsabilidade
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">
                      Impacto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Nenhum sinistro encontrado para os
                        filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => {
                      const [year, month, day] =
                        claim.date.split("-");
                      const formattedDate = `${day}/${month}/${year}`;
                      return (
                        <tr
                          key={claim.id}
                          className="border-b border-gray-200"
                        >
                          <td className="py-2 px-3 text-gray-700">
                            {formattedDate}
                          </td>
                          <td className="py-2 px-3 text-gray-800 font-medium">
                            {claim.store.split(" - ")[0]}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {claim.responsibleArea ||
                              "Não definida"}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-gray-700">
                              —
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getSeverityBadge(claim.severity)}`}
                            >
                              {claim.severity}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-[#8B1A1A] pt-6 mt-12">
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-600">
                  <p className="font-semibold">
                    Flamboyant Shopping Center
                  </p>
                  <p>
                    Av. Deputado Jamel Cecílio, 3.300 - Jardim
                    Goiás
                  </p>
                  <p>Goiânia - GO, 74810-100</p>
                  <p>Tel: (62) 3250-5000</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">
                    Assinatura Digital do Gerente
                  </p>
                  <div className="w-48 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-gray-400">
                      Área de Assinatura
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}