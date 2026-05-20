import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  Bell,
  Sun,
  Moon,
  AlertTriangle,
  Server,
  FileSearch,
  ArrowRight,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sidebar } from "./Sidebar";

type NotifKind = "urgente" | "sistema" | "documentacao";

const NOTIFICATIONS: {
  id: string;
  kind: NotifKind;
  tag: string;
  title: string;
  detail: string;
  time: string;
  link: string;
}[] = [
  {
    id: "n1",
    kind: "urgente",
    tag: "URGENTE",
    title: "Novo sinistro de Alta Gravidade",
    detail: "Zara · LUC A-105 — vazamento no teto causou alagamento parcial do estoque.",
    time: "Há 12 min",
    link: "/sinistro/SIN-2026-0124",
  },
  {
    id: "n2",
    kind: "sistema",
    tag: "SISTEMA",
    title: "Relatório mensal disponível",
    detail: "Relatório de Sinistralidade de Abril/2026 pronto para download.",
    time: "Há 1 h",
    link: "/relatorios",
  },
  {
    id: "n3",
    kind: "documentacao",
    tag: "DOCUMENTAÇÃO",
    title: "Apólice próxima do vencimento",
    detail: "C&A · LUC B-202 — apólice de Responsabilidade Civil vence em 9 dias.",
    time: "Há 3 h",
    link: "/lojistas",
  },
];

const KIND_STYLE: Record<NotifKind, { icon: typeof Bell; tagClass: string; iconClass: string }> = {
  urgente: {
    icon: AlertTriangle,
    tagClass: "bg-[#E04444]/15 text-[#E04444] border border-[#E04444]/30",
    iconClass: "text-[#E04444] bg-[#E04444]/15",
  },
  sistema: {
    icon: Server,
    tagClass: "bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30",
    iconClass: "text-[#34D399] bg-[#34D399]/15",
  },
  documentacao: {
    icon: FileSearch,
    tagClass: "bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30",
    iconClass: "text-[#60A5FA] bg-[#60A5FA]/15",
  },
};

const ADMIN_USER = {
  name: "Gestor",
  city: "Goiânia",
  initials: "G",
};

export function Layout() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("jp-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("jp-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen w-full bg-[#F7F4EF] dark:bg-[#0F1117] text-gray-900 dark:text-[#F1F5F9] transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white dark:bg-[#1A1F2E] border-b border-gray-200 dark:border-[#2E3447] flex items-center justify-between px-6 z-20 flex-shrink-0 transition-colors">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <ImageWithFallback
              src="/src/imports/WhatsApp_Image_2026-04-28_at_09.57.55.jpeg"
              alt="Flamboyant Shopping Logo"
              className="w-9 h-9 object-contain"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#8B1A1A] dark:text-[#E04444]">JP Mall</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#64748B]">
                Gestão de Sinistros
              </p>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="p-2 text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#242938] rounded-full transition-colors"
            title={theme === "light" ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#242938] rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[#8B1A1A] dark:bg-[#E04444] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {NOTIFICATIONS.length}
              </span>
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 z-20 w-[380px] bg-white dark:bg-[#242938] border border-[#E8DCCB] dark:border-[#2E3447] rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8DCCB] dark:border-[#2E3447] bg-[#FAF7F2] dark:bg-[#1A1F2E] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#8B1A1A] dark:text-[#F1F5F9]">
                      Notificações
                    </span>
                    <span className="text-[10px] font-bold text-white bg-[#8B1A1A] dark:bg-[#E04444] rounded-full px-2 py-0.5">
                      {NOTIFICATIONS.length} novas
                    </span>
                  </div>
                  <div className="divide-y divide-[#E8DCCB] dark:divide-[#2E3447] max-h-[440px] overflow-y-auto">
                    {NOTIFICATIONS.map((n) => {
                      const cfg = KIND_STYLE[n.kind];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(n.link);
                          }}
                          className="w-full text-left p-4 hover:bg-[#FAF7F2] dark:hover:bg-[#1A1F2E] transition-colors flex items-start gap-3"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`inline-block text-[10px] font-bold tracking-wider rounded px-1.5 py-0.5 ${cfg.tagClass}`}>
                              {n.tag}
                            </span>
                            <p className="text-sm font-bold text-gray-900 dark:text-[#F1F5F9] mt-1">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1 line-clamp-2">
                              {n.detail}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-[#64748B] mt-1">
                              {n.time}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/historico");
                    }}
                    className="w-full px-4 py-3 text-sm font-semibold text-[#8B1A1A] dark:text-[#E04444] hover:bg-[#FAF7F2] dark:hover:bg-[#1A1F2E] border-t border-[#E8DCCB] dark:border-[#2E3447] flex items-center justify-center gap-2"
                  >
                    Ver todas <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 dark:border-[#2E3447]">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9]">
                {ADMIN_USER.name} - {ADMIN_USER.city}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-[#64748B]">Administração</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#8B1A1A] dark:bg-[#E04444] text-white font-bold flex items-center justify-center text-sm">
              {ADMIN_USER.initials}
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-[#F7F4EF] dark:bg-[#0F1117] transition-colors">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
