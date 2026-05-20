import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { fetchClaimById, updateClaim, addAuditEntry } from "../../apiClient";
import type { Claim, ClaimStatus, AuditEntry } from "../store";
import {
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ArrowLeft,
  Image as ImageIcon,
  FileArchive,
  Video,
  Info,
  ExternalLink,
  Bell,
  Mail,
  MessageCircle,
  Send,
  Phone,
  Edit3,
  UploadCloud,
  Trash2,
  ChevronDown,
  UserCheck,
  AlertCircle,
} from "lucide-react";

// ── Confirmation Modal ─────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ open, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E8DCCB] rounded-2xl shadow-xl p-6 w-full max-w-sm"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-[#8B1A1A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Confirmar ação
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E8DCCB] text-gray-600 hover:bg-[#FAF7F2] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#8B1A1A] text-white hover:bg-[#701515] active:scale-[0.98] transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Notification ─────────────────────────────────────────────────────
interface ToastProps {
  open: boolean;
  message: string;
  type?: "success" | "info";
}

function Toast({ open, message, type = "success" }: ToastProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
      }}
      className="flex items-center gap-3 bg-white border border-[#E8DCCB] rounded-2xl shadow-lg px-4 py-3 min-w-[260px]"
    >
      <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 text-[#8B1A1A]" />
      </div>
      <p className="text-sm font-medium text-gray-800">{message}</p>
    </div>
  );
}

// ── useConfirm hook ────────────────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, message: "", resolve: null });

  const confirm = useCallback(
    (message: string): Promise<boolean> =>
      new Promise((resolve) => {
        setState({ open: true, message, resolve });
      }),
    []
  );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, message: "", resolve: null });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ open: false, message: "", resolve: null });
  };

  const modal = (
    <ConfirmModal
      open={state.open}
      message={state.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, modal };
}

// ── useToast hook ──────────────────────────────────────────────────────────
function useToast() {
  const [state, setState] = useState({ open: false, message: "" });

  const showToast = useCallback((message: string) => {
    setState({ open: true, message });
    setTimeout(() => setState({ open: false, message: "" }), 3000);
  }, []);

  const toast = <Toast open={state.open} message={state.message} />;

  return { showToast, toast };
}

// ── Status Stepper ─────────────────────────────────────────────────────────
const STEPS = [
  { key: "Em análise", label: "Em análise", icon: "📂" },
  { key: "Evidências", label: "Evidências", icon: "📎" },
  { key: "Análise de Risco", label: "Análise de Risco", icon: "🔍" },
  { key: "Regulação", label: "Regulação", icon: "⚖️" },
  { key: "Concluído", label: "Concluído", icon: "✅" },
];

const STATUS_TO_STEP: Record<ClaimStatus, number> = {
  "Em análise": 0,
  "Aguardando seguradora": 1,
  Pago: 2,
  Concluído: 3,
  Cancelado: 4,
};

function StatusStepper({ status }: { status: ClaimStatus }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Ciclo de Vida do Sinistro
      </p>
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all font-semibold
                  ${isDone ? "bg-[#8B1A1A] border-[#8B1A1A] text-white shadow-sm" : isActive ? "bg-white border-[#8B1A1A] text-[#8B1A1A] shadow-md ring-4 ring-[#8B1A1A]/10" : "bg-gray-50 border-gray-200 text-gray-300"}`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                </div>
                <span
                  className={`text-[10px] font-medium mt-1.5 text-center whitespace-nowrap
                  ${isDone ? "text-[#8B1A1A] dark:text-[#E04444]" : isActive ? "text-[#8B1A1A] dark:text-[#E04444] font-bold" : "text-gray-300 dark:text-[#aaaaaa]"}`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 mb-5 rounded transition-all
                  ${idx < currentStep ? "bg-[#8B1A1A]" : "bg-gray-100"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Audit Trail ────────────────────────────────────────────────────────────
function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  const TYPE_CONFIG = {
    created: { bg: "bg-blue-100", text: "text-blue-700", icon: "📂" },
    status_change: { bg: "bg-[#8B1A1A]/10", text: "text-[#8B1A1A]", icon: "🔄" },
    assignment: { bg: "bg-purple-100", text: "text-purple-700", icon: "👤" },
    document: { bg: "bg-amber-100", text: "text-amber-700", icon: "📎" },
    financial: { bg: "bg-emerald-100", text: "text-emerald-700", icon: "💰" },
    comment: { bg: "bg-gray-100", text: "text-gray-600", icon: "💬" },
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("pt-BR"),
      time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const ROLE_COLORS: Record<string, string> = {
    Gerente: "bg-[#8B1A1A] text-white",
    Regulador: "bg-blue-700 text-white",
    Financeiro: "bg-emerald-700 text-white",
    Analista: "bg-amber-600 text-white",
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />
      <div className="space-y-5">
        {[...entries].reverse().map((entry) => {
          const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.comment;
          const { date, time } = formatTimestamp(entry.timestamp);
          return (
            <div key={entry.id} className="relative flex items-start space-x-3 pl-2">
              <div className={`relative z-10 w-5 h-5 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border-2 border-white shadow-sm`}>
                <span style={{ fontSize: "10px" }}>{cfg.icon}</span>
              </div>
              <div className="flex-1 min-w-0 bg-gray-50/70 dark:bg-[#252545] border border-gray-100 dark:border-[#2E3447] rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A4A] transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${ROLE_COLORS[entry.userRole] || "bg-gray-500 text-white"}`}>
                      {entry.userInitials}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-[#f0f0f0]">{entry.user}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-[#2a2a4a] text-gray-500 dark:text-[#cccccc] rounded text-[9px] font-medium">{entry.userRole}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-[#cccccc] leading-relaxed mb-1.5">{entry.action}</p>
                <div className="flex items-center text-[10px] text-gray-400 dark:text-[#888888]">
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  {date} — {time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Informações Gerais ────────────────────────────────────────────────
function TabGeneralInfo({
  claim,
  onUpdateClaim,
  confirm,
  showToast,
}: {
  claim: Claim;
  onUpdateClaim: (updates: Partial<Claim>) => void;
  confirm: (msg: string) => Promise<boolean>;
  showToast: (msg: string) => void;
}) {
  const [newStatus, setNewStatus] = useState<ClaimStatus>(claim.status);
  const [newResponsibleArea, setNewResponsibleArea] = useState("");
  const [comment, setComment] = useState("");
  const [responsibility, setResponsibility] = useState<"Externa" | "Interna">("Externa");

  const handleUpdateStatus = async () => {
    if (newStatus === claim.status) return;
    const ok = await confirm("Tem certeza que deseja alterar o status deste sinistro?");
    if (!ok) return;
    const entry: AuditEntry = { id: `a-${Date.now()}`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: new Date().toISOString(), action: `Status alterado de ${claim.status} para ${newStatus}`, type: "status_change" };
    try {
      await addAuditEntry(claim.id, entry);
      await updateClaim(claim.id, { status: newStatus });
      const fresh = await fetchClaimById(claim.id);
      setClaim(fresh);
      showToast("Status atualizado com sucesso");
    } catch (err) {
      alert(String(err));
    }
  };

  const handleUpdateResponsibleArea = async () => {
    if (!newResponsibleArea.trim()) return;
    const ok = await confirm("Tem certeza que deseja alterar a área responsável?");
    if (!ok) return;
    const entry: AuditEntry = { id: `a-${Date.now()}`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: new Date().toISOString(), action: `Área responsável alterada para: ${newResponsibleArea}`, type: "assignment" };
    try {
      await addAuditEntry(claim.id, entry);
      await updateClaim(claim.id, { responsibleArea: newResponsibleArea });
      const fresh = await fetchClaimById(claim.id);
      setClaim(fresh);
      setNewResponsibleArea("");
      showToast("Área responsável atualizada");
    } catch (err) {
      alert(String(err));
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const ok = await confirm("Deseja adicionar este comentário ao sinistro?");
    if (!ok) return;
    const entry: AuditEntry = { id: `a-${Date.now()}`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: new Date().toISOString(), action: comment, type: "comment" };
    try {
      await addAuditEntry(claim.id, entry);
      const fresh = await fetchClaimById(claim.id);
      setClaim(fresh);
      setComment("");
      showToast("Comentário adicionado");
    } catch (err) { alert(String(err)); }
  };

  const handleUpdateResponsibility = async () => {
    const ok = await confirm("Tem certeza que deseja definir a responsabilidade?");
    if (!ok) return;
    const entry: AuditEntry = { id: `a-${Date.now()}`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: new Date().toISOString(), action: `Responsabilidade definida como: ${responsibility}`, type: "assignment" };
    try {
      await addAuditEntry(claim.id, entry);
      const fresh = await fetchClaimById(claim.id);
      setClaim(fresh);
      showToast("Responsabilidade definida");
    } catch (err) { alert(String(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <InfoBlock label="Tipo de Ocorrência" value={claim.type} />
        <InfoBlock label="Local Afetado" value={claim.store} />
        <InfoBlock label="Data do Sinistro" value={new Date(claim.date + "T12:00:00").toLocaleDateString("pt-BR")} />
        <InfoBlock label="Nível de Gravidade" value={claim.severity} />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descrição Detalhada</p>
        <div className="bg-gray-50 dark:bg-[#252545] rounded-xl p-4 border border-gray-100 dark:border-[#2E3447] text-sm text-gray-700 dark:text-[#dddddd] leading-relaxed min-h-[80px]">
          {claim.description}
        </div>
      </div>

      {claim.fraudAlert && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-[#D93030] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#D93030]">Alerta de Fraude Sistêmica</p>
            <p className="text-xs text-red-500 mt-0.5">Padrão suspeito detectado. Análise rigorosa recomendada.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-[#8B1A1A]/10 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-[#8B1A1A]" />
          </div>
          <h3 className="text-gray-900 text-sm font-semibold">Ações Rápidas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Responsabilidade */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Responsabilidade</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value as "Externa" | "Interna")}
                  className="w-full appearance-none border border-gray-200 rounded-xl py-2 px-3 pr-9 text-sm focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] outline-none transition-colors"
                >
                  <option value="Externa">Externa (Shopping)</option>
                  <option value="Interna">Interna (Entre Lojas)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button onClick={handleUpdateResponsibility} className="px-3 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#701515] transition-colors">
                Definir
              </button>
            </div>
          </div>

          {/* Alterar Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Alterar Status</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ClaimStatus)}
                  className="w-full appearance-none border border-gray-200 rounded-xl py-2 px-3 pr-9 text-sm focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] outline-none transition-colors"
                >
                  <option value="Em análise">Em análise</option>
                  <option value="Aguardando seguradora">Aguardando seguradora</option>
                  <option value="Pago">Pago</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === claim.status}
                className="px-3 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#701515] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>

          {/* Alterar Área Responsável */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Alterar Área Responsável</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  value={newResponsibleArea}
                  onChange={(e) => setNewResponsibleArea(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl py-2 px-3 pr-9 text-sm focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] outline-none transition-colors"
                >
                  <option value="">Selecione a área...</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Brigada">Brigada</option>
                  <option value="Engenharia">Engenharia</option>
                  <option value="Conservação">Conservação</option>
                  <option value="Relacionamento">Relacionamento</option>
                  <option value="Segurança / CFTV">Segurança / CFTV</option>
                  <option value="Estacionamento">Estacionamento</option>
                  <option value="Arquitetura">Arquitetura</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={handleUpdateResponsibleArea}
                disabled={!newResponsibleArea.trim()}
                className="px-3 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#701515] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>

          {/* Adicionar Comentário */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1.5">Adicionar Comentário</label>
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Digite um comentário sobre o sinistro..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] outline-none resize-none transition-colors"
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#701515] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Adicionar Comentário
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#8B1A1A]" />
            <h3 className="text-sm font-semibold text-gray-900">Histórico de Sinistros</h3>
          </div>
          <span className="px-2 py-0.5 bg-[#8B1A1A] text-white text-xs rounded-full font-semibold">
            {claim.auditTrail?.length || 0}
          </span>
        </div>
        {claim.auditTrail && claim.auditTrail.length > 0 ? (
          <AuditTimeline entries={claim.auditTrail} />
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-3 text-gray-200" />
            <p className="text-xs">Nenhum registro no histórico</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Galeria de Evidências ─────────────────────────────────────────────
function TabEvidences({ files }: { files: string[] }) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (ext === "pdf") return <FileText className="w-8 h-8 text-red-400" />;
    if (["mp4", "mov", "avi"].includes(ext || "")) return <Video className="w-8 h-8 text-purple-400" />;
    return <FileArchive className="w-8 h-8 text-gray-400" />;
  };

  const getBadgeColor = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) return "bg-blue-100 text-blue-700";
    if (ext === "pdf") return "bg-red-100 text-red-700";
    if (["mp4", "mov"].includes(ext || "")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-600";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) setNewFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeNewFile = (index: number) => setNewFiles((prev) => prev.filter((_, i) => i !== index));
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Anexar Novas Evidências</h4>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragging ? "border-[#8B1A1A] bg-red-50/60" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UploadCloud className={`w-6 h-6 ${isDragging ? "text-[#8B1A1A]" : "text-gray-400"}`} />
          </div>
          <p className="text-sm text-gray-700 mb-1">Arraste arquivos aqui ou <span className="text-[#8B1A1A] font-semibold">clique para selecionar</span></p>
          <p className="text-xs text-gray-400 mb-3">JPG, PNG, PDF, MP4 · Máx. 50 MB</p>
          <label className="inline-flex items-center cursor-pointer bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4 mr-2" />
            Selecionar Arquivos
            <input type="file" multiple accept="image/*,application/pdf,video/mp4" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {newFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Arquivos prontos para anexar ({newFiles.length})</p>
            <div className="space-y-2">
              {newFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xs flex-shrink-0">📎</div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-gray-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeNewFile(idx)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!files || files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-4">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium">Nenhuma evidência anexada anteriormente</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 mb-3">{files.length} arquivo(s) anexado(s)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((file, idx) => (
              <a
                key={idx}
                href={`#${encodeURIComponent(file)}`}
                onClick={(e) => { e.preventDefault(); window.open(`about:blank#${encodeURIComponent(file)}`, "_blank", "noopener,noreferrer"); }}
                className="group flex flex-col items-center justify-center p-5 bg-gray-50 dark:bg-[#252545] border border-gray-100 dark:border-[#2E3447] rounded-2xl hover:border-[#8B1A1A]/30 hover:bg-red-50/20 transition-all cursor-pointer"
              >
                <div className="mb-3">{getFileIcon(file)}</div>
                <p className="text-xs font-medium text-gray-700 dark:text-[#dddddd] text-center truncate w-full">{file}</p>
                <span className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getBadgeColor(file)}`}>
                  {file.split(".").pop()?.toUpperCase()}
                </span>
                <div className="mt-3 flex items-center text-[10px] text-[#8B1A1A] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 mr-1" /> Visualizar
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Tab: Notificações ──────────────────────────────────────────────────────
function TabNotifications({
  claim,
  showToast,
}: {
  claim: Claim;
  showToast: (msg: string) => void;
}) {
  const [notificationType, setNotificationType] = useState<"email" | "whatsapp">("email");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getTenantContact = (storeName: string) => {
    const contactMap: Record<string, { email: string; phone: string }> = {
      "Zara - LUC A-105": { email: "zara.a105@flamboyant.com.br", phone: "(62) 3251-1001" },
      "Riachuelo - LUC A-130": { email: "riachuelo.a130@flamboyant.com.br", phone: "(62) 3251-1002" },
      "Renner - LUC A-118": { email: "renner.a118@flamboyant.com.br", phone: "(62) 3251-1003" },
      "Starbucks - LUC B-212": { email: "starbucks.b212@flamboyant.com.br", phone: "(62) 3251-1004" },
      "Fast Shop - LUC B-220": { email: "fastshop.b220@flamboyant.com.br", phone: "(62) 3251-1005" },
      "Vivara - LUC B-204": { email: "vivara.b204@flamboyant.com.br", phone: "(62) 3251-1006" },
      "Centauro - LUC C-301": { email: "centauro.c301@flamboyant.com.br", phone: "(62) 3251-1007" },
      "Outback - LUC C-315": { email: "outback.c315@flamboyant.com.br", phone: "(62) 3251-1008" },
    };
    return contactMap[storeName] || { email: "lojista@flamboyant.com.br", phone: "(62) 3251-1000" };
  };

  const contact = getTenantContact(claim.store);

  const handleSendNotification = () => {
    if (!message.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      const notificationText =
        notificationType === "email"
          ? `Notificação enviada por email para ${contact.email}`
          : `Notificação enviada via WhatsApp para ${contact.phone}`;
      (async () => {
        try {
          await addAuditEntry(claim.id, { id: `notif-${Date.now()}`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: new Date().toISOString(), action: notificationText, type: "comment" });
        } catch (err) { /* ignore */ }
      })();
      setMessage("");
      setIsSending(false);
      showToast(`Notificação enviada via ${notificationType === "email" ? "Email" : "WhatsApp"}`);
    }, 1000);
  };

  const emailTemplate = `Prezado lojista,\n\n${message}\n\nAtenciosamente,\nFlamboyant Shopping`;

  return (
    <div className="space-y-6">
      <div className="bg-[#8B1A1A]/5 rounded-2xl p-5 border border-[#8B1A1A]/10">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="w-4 h-4 text-[#8B1A1A]" />
          <h3 className="text-sm font-semibold text-[#8B1A1A]">Dados de Contato do Lojista</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 bg-white rounded-xl p-3 border border-gray-100">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
              <p className="text-sm text-gray-800 font-medium">{contact.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-xl p-3 border border-gray-100">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Telefone</p>
              <p className="text-sm text-gray-800 font-medium">{contact.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Notificação</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setNotificationType("email")}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${notificationType === "email" ? "border-[#8B1A1A] bg-[#8B1A1A]/5 text-[#8B1A1A]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            <Mail className="w-5 h-5" />
            <span className="font-semibold text-sm">Email</span>
          </button>
          <button
            onClick={() => setNotificationType("whatsapp")}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${notificationType === "whatsapp" ? "border-[#8B1A1A] bg-[#8B1A1A]/5 text-[#8B1A1A]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">WhatsApp</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {notificationType === "email" ? "Conteúdo do Email" : "Mensagem"}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={notificationType === "email" ? "Digite o conteúdo da mensagem (o template será aplicado automaticamente)..." : "Digite a mensagem que será enviada via WhatsApp..."}
          className="w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] bg-white text-gray-900 text-sm outline-none resize-none transition-colors"
        />
      </div>

      {notificationType === "email" && message.trim() && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Preview do Email</label>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{emailTemplate}</div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#8B1A1A] rounded flex items-center justify-center text-white text-xs font-bold">FS</div>
              <span className="text-xs text-gray-500">Logo Flamboyant Shopping</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSendNotification}
          disabled={!message.trim() || isSending}
          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${!message.trim() || isSending ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#8B1A1A] text-white hover:bg-[#701515] hover:shadow-lg active:scale-[0.98]"}`}
        >
          <Send className="w-4 h-4" />
          <span>{isSending ? "Enviando..." : "Enviar Notificação"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────
function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-[#252545] rounded-xl p-3.5 border border-gray-100 dark:border-[#2E3447]">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-[#aaaaaa] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-[#dddddd]">{value}</p>
    </div>
  );
}

// ── Status Badge & Severity ────────────────────────────────────────────────
const STATUS_BADGE_COLORS: Record<ClaimStatus, string> = {
  "Em análise": "bg-amber-100 text-amber-800 border-amber-200",
  "Aguardando seguradora": "bg-blue-100 text-blue-800 border-blue-200",
  Pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Concluído: "bg-[#F5E9D7] text-[#8B1A1A] border-[#E8DCCB]",
  Cancelado: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_CONFIG = {
  Alta: { dot: "bg-[#D93030]", text: "text-[#D93030]", bg: "bg-red-50 border-red-100" },
  Média: { dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-100" },
  Baixa: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
};

// ── Fallback ───────────────────────────────────────────────────────────────
const HISTORY_FALLBACKS: Record<string, Partial<Claim>> = {
  "SIN-2026-0124": { store: "Zara - Piso L2", type: "Vazamento / Inundação", severity: "Alta", status: "Em análise", date: "2026-04-24", description: "Vazamento no teto causou alagamento parcial do estoque, com perda de mercadorias e dano à estrutura interna do provador.", files: ["alagamento_estoque.jpg", "laudo_tecnico.pdf", "video_vistoria.mp4"] },
  "SIN-2026-0123": { store: "Starbucks - Piso L1", type: "Incêndio Fiação", severity: "Média", status: "Em análise", date: "2026-04-22", description: "Curto-circuito na fiação da máquina de café gerou princípio de incêndio, controlado pela brigada do shopping.", files: ["fiacao_danificada.jpg", "relatorio_brigada.pdf"] },
  "SIN-2026-0122": { store: "Renner - Piso L2", type: "Dano Elétrico", severity: "Baixa", status: "Pago", date: "2026-04-19", description: "Pico de energia danificou terminais de pagamento e iluminação principal da loja.", files: ["terminais.jpg", "nota_fiscal_reparos.pdf"] },
  "SIN-2026-0121": { store: "Centauro - Piso L3", type: "Vazamento / Inundação", severity: "Alta", status: "Em análise", date: "2026-04-15", description: "Infiltração de água no provador após chuva forte, comprometendo painéis de gesso e parte do piso laminado.", files: ["infiltracao.jpg", "vistoria.pdf", "reparo_provador.jpg"] },
  "SIN-2026-0120": { store: "Fast Shop - Piso L1", type: "Furto / Roubo", severity: "Média", status: "Pago", date: "2026-04-12", description: "Furto de mercadoria de alto valor durante horário de funcionamento, registrado pelas câmeras de segurança.", files: ["camera_loja.mp4", "boletim_ocorrencia.pdf"] },
};

function buildFallbackClaim(id: string): Claim {
  const base = HISTORY_FALLBACKS[id] || {};
  return {
    id,
    store: base.store || "Loja não identificada",
    type: base.type || "Ocorrência geral",
    severity: base.severity || "Média",
    status: base.status || "Em análise",
    date: base.date || new Date().toISOString().slice(0, 10),
    description: base.description || "Sinistro registrado a partir do histórico de ocorrências do shopping.",
    files: base.files || ["foto_local.jpg", "laudo.pdf"],
    riskLevel: "Médio",
    fraudAlert: false,
    auditTrail: [
      { id: `${id}-a1`, user: "Carlos Silva", userInitials: "CS", userRole: "Gerente", timestamp: "2026-04-20T09:00:00", action: "Sinistro registrado no sistema", type: "created" },
      { id: `${id}-a2`, user: "Maria Santos", userInitials: "MS", userRole: "Analista", timestamp: "2026-04-20T11:20:00", action: "Evidências anexadas e triagem inicial concluída", type: "document" },
      { id: `${id}-a3`, user: "João Pereira", userInitials: "JP", userRole: "Regulador", timestamp: "2026-04-21T14:45:00", action: "Análise de risco em andamento — vistoria agendada", type: "status_change" },
      { id: `${id}-a4`, user: "Roberto Costa", userInitials: "RC", userRole: "Financeiro", timestamp: "2026-04-22T16:10:00", action: "Cálculo preliminar de indenização registrado", type: "financial" },
    ],
    policies: [{ id: `${id}-pol1`, number: "APO-2026-7781", insurer: "Bradesco Seguros", type: "Multirrisco Empresarial", coverage: 500000, deductible: 5000, validFrom: "2026-01-01", validTo: "2026-12-31", status: "Ativa" }],
  };
}

// ── Main Component ─────────────────────────────────────────────────────────
export function ClaimDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "evidence" | "notifications">("general");

  const { confirm, modal: confirmModal } = useConfirm();
  const { showToast, toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchClaimById(id)
        .then((data) => setClaim(data))
        .catch(() => setClaim(buildFallbackClaim(id)));
    }
  }, [id]);

  const handleUpdateClaim = (updates: Partial<Claim>) => {
    if (!claim) return;
    updateClaim(claim.id, updates).then(async () => {
      const fresh = await fetchClaimById(claim.id);
      setClaim(fresh);
    }).catch((err) => alert(String(err)));
  };

  if (!claim) return null;

  const sev = SEVERITY_CONFIG[claim.severity] || SEVERITY_CONFIG.Baixa;

  const TABS = [
    { key: "general", label: "Informações Gerais", icon: <Info className="w-3.5 h-3.5 mr-1.5" /> },
    { key: "evidence", label: "Galeria de Evidências", icon: <ImageIcon className="w-3.5 h-3.5 mr-1.5" />, badge: claim.files?.length || 0 },
    { key: "notifications", label: "Notificações", icon: <Bell className="w-3.5 h-3.5 mr-1.5" /> },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-0 pb-10">
      {/* Modais globais — renderizados uma vez no topo */}
      {confirmModal}
      {toast}

      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-[#8B1A1A] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Lista
        </button>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${sev.bg} ${sev.text}`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${sev.dot}`} />
            Gravidade {claim.severity}
          </span>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${STATUS_BADGE_COLORS[claim.status]}`}>
            {(claim.status === "Concluído" || claim.status === "Pago") && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
            {claim.status}
          </span>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="h-1.5 bg-[#8B1A1A]" />
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#8B1A1A]/8 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-[#8B1A1A]" />
            </div>
            <div>
              <h1 className="text-gray-900 text-xl">{claim.id}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                <span className="text-xs text-gray-500 flex items-center"><Building2 className="w-3.5 h-3.5 mr-1 text-[#C8A882]" />{claim.store}</span>
                <span className="text-xs text-gray-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-[#C8A882]" />{new Date(claim.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                {claim.regulator && <span className="text-xs text-gray-500 flex items-center"><UserCheck className="w-3.5 h-3.5 mr-1 text-[#C8A882]" />{claim.regulator}</span>}
              </div>
            </div>
          </div>
          {claim.fraudAlert && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-[#D93030] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#D93030]">Alerta de Fraude Ativo</span>
            </div>
          )}
        </div>
      </div>

      <StatusStepper status={claim.status} />

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/60 dark:bg-[#1a1a2e] px-5 pt-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center pb-3 pt-1 mr-5 text-sm border-b-2 transition-all whitespace-nowrap font-medium
                ${activeTab === tab.key ? "border-[#8B1A1A] text-[#8B1A1A]" : "border-transparent text-gray-400 dark:text-[#f0f0f0] hover:text-gray-600 dark:hover:text-[#f0f0f0] hover:border-gray-200"}`}
            >
              {tab.icon}
              {tab.label}
              {"badge" in tab && tab.badge > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1A1A] text-white">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <TabGeneralInfo claim={claim} onUpdateClaim={handleUpdateClaim} confirm={confirm} showToast={showToast} />
          )}
          {activeTab === "evidence" && <TabEvidences files={claim.files || []} />}
          {activeTab === "notifications" && <TabNotifications claim={claim} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}