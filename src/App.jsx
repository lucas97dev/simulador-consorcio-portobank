import React, { useState, useMemo, useEffect } from "react";
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Landmark,
  PiggyBank,
  TrendingDown,
  Info,
  ClipboardList,
  Save,
  Trash2,
  FileOutput,
  ArrowLeft,
  FolderOpen,
  Download,
} from "lucide-react";

const STORAGE_KEY = "simulacoes-portobank";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const INK = "#1B3B2D";
const INK_SOFT = "#4F6B5C";
const PAPER = "#F7F9F6";
const PAPER_RAISED = "#FFFFFF";
const LINE = "#DCE4DD";
const GOLD = "#C9992B";
const GOLD_SOFT = "#F6ECD3";
const TEAL = "#2F7A54";
const TEAL_SOFT = "#E3F0E7";
const RED = "#B23A2E";
const RED_SOFT = "#F6E4E1";

const PRESETS = {
  Auto: { taxaAdm: 15, fundoReserva: 2, seguro: 0.038, teto: 30, redutor: 50, adesao: 0, qtdAdesao: 12 },
  Pesados: { taxaAdm: 12, fundoReserva: 2, seguro: 0.038, teto: 30, redutor: 50, adesao: 0, qtdAdesao: 12 },
  Imóvel: { taxaAdm: 18, fundoReserva: 1, seguro: 0.035, teto: 30, redutor: 50, adesao: 2, qtdAdesao: 12 },
};

const brl = (v) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

const pct = (v, digits = 2) =>
  `${(Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;

// ---------------------------------------------------------------------------
// Small field primitives
// ---------------------------------------------------------------------------
function Field({ label, value, onChange, suffix, step = "1", min = "0", hint }) {
  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide" style={{ color: INK_SOFT }}>
        {label}
      </span>
      <div
        className="mt-1 flex items-center rounded-md border overflow-hidden focus-within:ring-2"
        style={{ borderColor: LINE, background: PAPER_RAISED }}
      >
        <input
          type="number"
          className="w-full bg-transparent px-3 py-2 text-sm outline-none tabular-nums"
          style={{ color: INK }}
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        />
        {suffix && (
          <span
            className="px-3 py-2 text-xs font-semibold border-l"
            style={{ color: INK_SOFT, borderColor: LINE, background: PAPER }}
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <span className="mt-1 block text-[11px]" style={{ color: INK_SOFT }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function SectionCard({ title, icon, children, right }) {
  return (
    <div
      className="rounded-lg border p-4 sm:p-5"
      style={{ borderColor: LINE, background: PAPER_RAISED }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: INK }}>
            {title}
          </h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ label, value, emphasis, valueColor }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[13px]" style={{ color: INK_SOFT }}>
        {label}
      </span>
      <span
        className={`tabular-nums ${emphasis ? "text-lg font-semibold" : "text-sm font-medium"}`}
        style={{ color: valueColor || INK }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ConsortiumSimulator() {
  const [modalidade, setModalidade] = useState("Auto");
  const [tipoContratacao, setTipoContratacao] = useState("PF");
  const [creditoContratado, setCreditoContratado] = useState(260000);
  const [prazoTotal, setPrazoTotal] = useState(89);
  const [percentualRedutor, setPercentualRedutor] = useState(PRESETS.Auto.redutor);

  const [taxaAdm, setTaxaAdm] = useState(PRESETS.Auto.taxaAdm);
  const [fundoReserva, setFundoReserva] = useState(PRESETS.Auto.fundoReserva);
  const [seguroMensal, setSeguroMensal] = useState(PRESETS.Auto.seguro);
  const [tetoEmbutido, setTetoEmbutido] = useState(PRESETS.Auto.teto);
  const [taxaAdesao, setTaxaAdesao] = useState(PRESETS.Auto.adesao);
  const [qtdParcelasAdesao, setQtdParcelasAdesao] = useState(PRESETS.Auto.qtdAdesao);
  const [campanhaAberta, setCampanhaAberta] = useState(true);

  const [lanceProprio, setLanceProprio] = useState(20000);
  const [lanceEmbutido, setLanceEmbutido] = useState(30000);
  const [percentualLanceDesejado, setPercentualLanceDesejado] = useState(47);
  const [parcelaContemplacao, setParcelaContemplacao] = useState(5);

  const [nomeSimulacao, setNomeSimulacao] = useState("");
  const [savedSims, setSavedSims] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedPanelOpen, setSavedPanelOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [viewMode, setViewMode] = useState("form"); // 'form' | 'compare'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (active && res && res.value) {
          setSavedSims(JSON.parse(res.value));
        }
      } catch (e) {
        // ainda não existe nenhuma simulação salva
      } finally {
        if (active) setLoadingSaved(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function persistList(list) {
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(list), false);
      return !!res;
    } catch (e) {
      return false;
    }
  }

  async function salvarSimulacao() {
    const snapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nome: nomeSimulacao.trim() || `Simulação ${new Date().toLocaleDateString("pt-BR")}`,
      salvoEm: new Date().toISOString(),
      modalidade,
      tipoContratacao,
      inputs: {
        creditoContratado,
        prazoTotal,
        percentualRedutor,
        taxaAdm,
        fundoReserva,
        seguroMensal,
        tetoEmbutido,
        lanceProprio,
        lanceEmbutido,
        percentualLanceDesejado,
        parcelaContemplacao,
      },
      resultados: { ...calc },
    };
    const newList = [...savedSims, snapshot];
    setSavedSims(newList);
    setSelectedIds((ids) => [...ids, snapshot.id]);
    const ok = await persistList(newList);
    setSaveStatus(ok ? "Simulação salva." : "Não foi possível salvar — tente novamente.");
    setTimeout(() => setSaveStatus(""), 3000);
  }

  async function excluirSimulacao(id) {
    const newList = savedSims.filter((s) => s.id !== id);
    setSavedSims(newList);
    setSelectedIds((ids) => ids.filter((x) => x !== id));
    await persistList(newList);
  }

  function carregarSimulacao(sim) {
    setModalidade(sim.modalidade);
    setTipoContratacao(sim.tipoContratacao);
    setCreditoContratado(sim.inputs.creditoContratado);
    setPrazoTotal(sim.inputs.prazoTotal);
    setPercentualRedutor(sim.inputs.percentualRedutor);
    setTaxaAdm(sim.inputs.taxaAdm);
    setFundoReserva(sim.inputs.fundoReserva);
    setSeguroMensal(sim.inputs.seguroMensal);
    setTetoEmbutido(sim.inputs.tetoEmbutido);
    setTaxaAdesao(sim.inputs.taxaAdesao ?? 0);
    setQtdParcelasAdesao(sim.inputs.qtdParcelasAdesao ?? 12);
    setLanceProprio(sim.inputs.lanceProprio);
    setLanceEmbutido(sim.inputs.lanceEmbutido);
    setPercentualLanceDesejado(sim.inputs.percentualLanceDesejado);
    setParcelaContemplacao(sim.inputs.parcelaContemplacao);
    setNomeSimulacao(sim.nome);
  }

  function toggleSelecionada(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function applyPreset(mod) {
    const p = PRESETS[mod];
    setModalidade(mod);
    setTaxaAdm(p.taxaAdm);
    setFundoReserva(p.fundoReserva);
    setSeguroMensal(p.seguro);
    setTetoEmbutido(p.teto);
    setPercentualRedutor(p.redutor);
    setTaxaAdesao(p.adesao);
    setQtdParcelasAdesao(p.qtdAdesao);
  }

  const calc = useMemo(() => {
    const taxaAdmF = taxaAdm / 100;
    const fundoReservaF = fundoReserva / 100;
    const seguroF = seguroMensal / 100;
    const tetoF = tetoEmbutido / 100;
    const redutorF = percentualRedutor / 100;
    const lanceDesejadoF = percentualLanceDesejado / 100;
    const taxaAdesaoF = modalidade === "Imóvel" ? taxaAdesao / 100 : 0;

    // Categoria "base" — usada para amortização mensal (adesão não entra aqui, pois
    // ela tem cronograma de pagamento próprio, separado do restante do prazo).
    const categoria = creditoContratado * (1 + taxaAdmF + fundoReservaF);
    // Categoria "total" — inclui a taxa de adesão, usada nos cálculos de lance/representatividade
    // (o compromisso total do grupo inclui a adesão, mesmo que ela seja paga à parte).
    const categoriaTotal = creditoContratado * (1 + taxaAdmF + fundoReservaF + taxaAdesaoF);

    const parcelaIntegralPJ = prazoTotal > 0 ? categoria / prazoTotal : 0;
    // Seguro incide sobre o SALDO DEVEDOR atual (não sobre o crédito contratado).
    // No instante inicial (mês 1), saldo devedor == categoria.
    const seguroInicial = tipoContratacao === "PF" ? categoria * seguroF : 0;
    const parcelaIntegralPF = parcelaIntegralPJ + categoria * seguroF;
    const parcelaIntegral = tipoContratacao === "PF" ? parcelaIntegralPF : parcelaIntegralPJ;

    // O "redutor" é um DESCONTO sobre a parcela — paga-se (1 - redutor) da amortização.
    // Ex.: redutor de 35% => paga 65% da amortização cheia. O seguro nunca é reduzido.
    const amortizacaoReduzida = parcelaIntegralPJ * (1 - redutorF);
    const valorParcela = amortizacaoReduzida + seguroInicial;

    // Taxa de adesão (só Imóvel): valor total diluído nas N primeiras parcelas.
    const valorAdesaoTotal = modalidade === "Imóvel" ? creditoContratado * taxaAdesaoF : 0;
    const temAdesao = valorAdesaoTotal > 0 && qtdParcelasAdesao > 0;
    const valorAdesaoMensal = temAdesao ? valorAdesaoTotal / qtdParcelasAdesao : 0;
    const valorParcelaComAdesao = valorParcela + valorAdesaoMensal;

    const representatividade = categoriaTotal > 0 ? (lanceProprio + lanceEmbutido) / categoriaTotal : 0;
    const embutidoMaximo = creditoContratado * tetoF;
    const valorTotalNecessario = categoriaTotal * lanceDesejadoF;
    const totalUsandoEmbutido = valorTotalNecessario - embutidoMaximo;
    const excedeEmbutido = lanceEmbutido > embutidoMaximo;

    const creditoLiberado = creditoContratado - lanceEmbutido;
    const lanceTotal = lanceProprio + lanceEmbutido;

    // O saldo devedor só é amortizado pela parte de amortização (reduzida); o seguro é
    // custo mensal à parte e não abate saldo.
    const totalAmortizado = parcelaContemplacao * amortizacaoReduzida;
    const saldoDevedor = categoria - totalAmortizado - lanceTotal;
    const quitado = saldoDevedor <= 0;
    const saldoPositivo = Math.max(saldoDevedor, 0);

    // Cenário A — "Nova parcela": mantém o prazo contratual restante (prazoTotal - contemplação)
    // e recalcula a parcela (sem redutor) para quitar exatamente nesse prazo.
    const prazoRestanteA = Math.max(prazoTotal - parcelaContemplacao, 0);
    const seguroSaldoAtual = tipoContratacao === "PF" ? saldoPositivo * seguroF : 0;
    const novaParcelaA =
      prazoRestanteA > 0 ? saldoPositivo / prazoRestanteA + seguroSaldoAtual : 0;

    // Cenário B — "Reduzir somente o prazo": mantém a amortização integral ORIGINAL
    // (categoria / prazoTotal, sem redutor) + seguro sobre o saldo atual; o prazo cai porque
    // a amortização é maior. Prazo = arredondado para cima do saldo dividido pela amortização.
    const novaParcelaB = parcelaIntegralPJ + seguroSaldoAtual;
    const prazoRestanteB =
      parcelaIntegralPJ > 0 ? Math.ceil(saldoPositivo / parcelaIntegralPJ) : 0;

    return {
      categoria,
      categoriaTotal,
      parcelaIntegralPJ,
      parcelaIntegralPF,
      parcelaIntegral,
      valorParcela,
      temAdesao,
      valorAdesaoMensal,
      valorParcelaComAdesao,
      representatividade,
      embutidoMaximo,
      valorTotalNecessario,
      totalUsandoEmbutido,
      excedeEmbutido,
      creditoLiberado,
      lanceTotal,
      saldoDevedor,
      quitado,
      novaParcelaA,
      prazoRestanteA,
      novaParcelaB,
      prazoRestanteB,
    };
  }, [
    modalidade,
    creditoContratado,
    prazoTotal,
    percentualRedutor,
    taxaAdesao,
    qtdParcelasAdesao,
    taxaAdm,
    fundoReserva,
    seguroMensal,
    tetoEmbutido,
    tipoContratacao,
    lanceProprio,
    lanceEmbutido,
    percentualLanceDesejado,
    parcelaContemplacao,
  ]);

  if (viewMode === "compare") {
    const selecionadas = savedSims.filter((s) => selectedIds.includes(s.id));
    return <ComparativoView simulacoes={selecionadas} onVoltar={() => setViewMode("form")} />;
  }

  return (
    <div className="min-h-screen w-full" style={{ background: PAPER, color: INK }}>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .ticket-notch { position: absolute; width: 18px; height: 18px; border-radius: 9999px; background: ${PAPER}; top: 50%; transform: translateY(-50%); }
      `}</style>

      {/* Header */}
      <header className="border-b" style={{ borderColor: LINE, background: INK }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <img src="/lamont-logo.png" alt="Lamont Corretora de Seguros" className="h-6 sm:h-7 w-auto mb-1.5" />
            <h1 className="font-serif text-2xl sm:text-3xl" style={{ color: "#F5F3EC" }}>
              Simulador de Consórcio
            </h1>
            <p className="text-[11px] tracking-[0.15em] uppercase mt-0.5" style={{ color: "#B9D2C4" }}>
              via PortoBank
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "#B9D2C4" }}>
              Modalidade
            </span>
            <span className="font-serif text-lg" style={{ color: GOLD }}>
              {modalidade}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <SectionCard
          title="Simulações Salvas"
          icon={<ClipboardList size={16} style={{ color: GOLD }} />}
          right={
            <button onClick={() => setSavedPanelOpen((v) => !v)} style={{ color: INK_SOFT }}>
              {savedPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          }
        >
          {savedPanelOpen && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <label className="block flex-1">
                  <span className="text-xs font-medium tracking-wide" style={{ color: INK_SOFT }}>
                    Nome do cliente / da simulação
                  </span>
                  <input
                    type="text"
                    placeholder="Ex.: João Pereira — Opção A"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: LINE, background: PAPER_RAISED, color: INK }}
                    value={nomeSimulacao}
                    onChange={(e) => setNomeSimulacao(e.target.value)}
                  />
                </label>
                <button
                  onClick={salvarSimulacao}
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shrink-0"
                  style={{ background: INK, color: "#F5F3EC" }}
                >
                  <Save size={14} /> Salvar simulação atual
                </button>
              </div>
              {saveStatus && (
                <p className="mt-2 text-[12px]" style={{ color: TEAL }}>
                  {saveStatus}
                </p>
              )}

              <div className="mt-4">
                {loadingSaved && (
                  <p className="text-[12px]" style={{ color: INK_SOFT }}>
                    Carregando simulações salvas…
                  </p>
                )}
                {!loadingSaved && savedSims.length === 0 && (
                  <p className="text-[12px]" style={{ color: INK_SOFT }}>
                    Nenhuma simulação salva ainda. Ajuste os campos abaixo e clique em "Salvar simulação atual".
                  </p>
                )}
                {!loadingSaved && savedSims.length > 0 && (
                  <div className="space-y-2">
                    {savedSims.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                        style={{ borderColor: LINE, background: PAPER }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelecionada(s.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: INK }}>
                            {s.nome}
                          </p>
                          <p className="text-[11px]" style={{ color: INK_SOFT }}>
                            {s.modalidade} · {s.tipoContratacao} ·{" "}
                            {new Date(s.salvoEm).toLocaleDateString("pt-BR")} · parcela{" "}
                            {brl(s.resultados?.valorParcela)}
                          </p>
                        </div>
                        <button
                          onClick={() => carregarSimulacao(s)}
                          title="Carregar no formulário"
                          className="p-1.5 rounded-md shrink-0"
                          style={{ color: INK_SOFT }}
                        >
                          <FolderOpen size={15} />
                        </button>
                        <button
                          onClick={() => excluirSimulacao(s.id)}
                          title="Excluir"
                          className="p-1.5 rounded-md shrink-0"
                          style={{ color: RED }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewMode("compare")}
                disabled={selectedIds.length === 0}
                className="mt-4 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-40"
                style={{ background: GOLD, color: "#2A1F0A" }}
              >
                <FileOutput size={14} />
                Gerar comparativo em PDF ({selectedIds.length} selecionada
                {selectedIds.length === 1 ? "" : "s"})
              </button>
            </>
          )}
        </SectionCard>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
        {/* -------------------- LEFT: INPUTS -------------------- */}
        <div className="space-y-5">
          <SectionCard title="Dados do Consórcio" icon={<Landmark size={16} style={{ color: GOLD }} />}>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2 sm:col-span-1">
                <span className="text-xs font-medium tracking-wide" style={{ color: INK_SOFT }}>
                  Modalidade
                </span>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: LINE, background: PAPER_RAISED, color: INK }}
                  value={modalidade}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  {Object.keys(PRESETS).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block col-span-2 sm:col-span-1">
                <span className="text-xs font-medium tracking-wide" style={{ color: INK_SOFT }}>
                  Tipo de Contratação
                </span>
                <div className="mt-1 flex rounded-md border overflow-hidden" style={{ borderColor: LINE }}>
                  {["PF", "PJ"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipoContratacao(t)}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={{
                        background: tipoContratacao === t ? INK : PAPER_RAISED,
                        color: tipoContratacao === t ? "#F5F3EC" : INK_SOFT,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </label>

              <div className="col-span-2">
                <Field
                  label="Crédito Contratado"
                  value={creditoContratado}
                  onChange={setCreditoContratado}
                  suffix="R$"
                  step="1000"
                  hint={brl(creditoContratado)}
                />
              </div>

              <Field
                label="Qtd. de Parcelas"
                value={prazoTotal}
                onChange={setPrazoTotal}
                suffix="meses"
                step="1"
              />
              <Field
                label="Redutor de Parcela"
                value={percentualRedutor}
                onChange={setPercentualRedutor}
                suffix="%"
                step="1"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Configurações da Campanha / Grupo"
            icon={<Settings2 size={16} style={{ color: GOLD }} />}
            right={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => applyPreset(modalidade)}
                  className="flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: INK_SOFT }}
                  title="Restaurar padrão da modalidade"
                >
                  <RotateCcw size={12} /> padrão
                </button>
                <button onClick={() => setCampanhaAberta((v) => !v)} style={{ color: INK_SOFT }}>
                  {campanhaAberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            }
          >
            {campanhaAberta && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Taxa Administrativa (total)" value={taxaAdm} onChange={setTaxaAdm} suffix="%" step="0.1" />
                <Field label="Fundo de Reserva (total)" value={fundoReserva} onChange={setFundoReserva} suffix="%" step="0.1" />
                <Field
                  label="Seguro de Vida (a.m.)"
                  value={seguroMensal}
                  onChange={setSeguroMensal}
                  suffix="%"
                  step="0.001"
                  hint={tipoContratacao === "PJ" ? "Não aplicado — contratação PJ" : "Aplicado sobre o crédito, ao mês"}
                />
                <Field label="Teto de Lance Embutido do Grupo" value={tetoEmbutido} onChange={setTetoEmbutido} suffix="%" step="1" />

                {modalidade === "Imóvel" && (
                  <>
                    <Field
                      label="Taxa de Adesão (% do crédito)"
                      value={taxaAdesao}
                      onChange={setTaxaAdesao}
                      suffix="%"
                      step="0.1"
                      hint="Particularidade do Imóvel — cobrada antecipadamente"
                    />
                    <Field
                      label="Diluída em quantas parcelas"
                      value={qtdParcelasAdesao}
                      onChange={setQtdParcelasAdesao}
                      suffix="parcelas"
                      step="1"
                      hint="Ex.: 1ª a 12ª parcela, conforme a campanha"
                    />
                  </>
                )}
              </div>
            )}
            {!campanhaAberta && (
              <p className="text-[12px]" style={{ color: INK_SOFT }}>
                {pct(taxaAdm, 1)} adm · {pct(fundoReserva, 1)} f. reserva · {pct(seguroMensal, 3)} seguro/mês · {pct(tetoEmbutido, 0)} teto embutido
                {modalidade === "Imóvel" && taxaAdesao > 0 ? ` · ${pct(taxaAdesao, 1)} adesão em ${qtdParcelasAdesao}x` : ""}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Oferta de Lance e Contemplação" icon={<PiggyBank size={16} style={{ color: GOLD }} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lance — Recurso Próprio" value={lanceProprio} onChange={setLanceProprio} suffix="R$" step="1000" hint={brl(lanceProprio)} />
              <Field label="Lance — Recurso do Crédito (embutido)" value={lanceEmbutido} onChange={setLanceEmbutido} suffix="R$" step="1000" hint={brl(lanceEmbutido)} />
              <Field label="% de Lance Desejado no Grupo" value={percentualLanceDesejado} onChange={setPercentualLanceDesejado} suffix="%" step="1" />
              <Field label="Mês da Contemplação" value={parcelaContemplacao} onChange={setParcelaContemplacao} suffix="ª parcela" step="1" />
            </div>

            {calc.excedeEmbutido && (
              <div
                className="mt-3 flex items-start gap-2 rounded-md p-3 text-[12px]"
                style={{ background: RED_SOFT, color: RED }}
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Lance embutido ({brl(lanceEmbutido)}) excede o máximo permitido pelo grupo de{" "}
                  {brl(calc.embutidoMaximo)}. Ajuste o valor ou o teto de lance embutido.
                </span>
              </div>
            )}
          </SectionCard>
        </div>

        {/* -------------------- RIGHT: RESULTS -------------------- */}
        <div className="space-y-5 lg:sticky lg:top-6 self-start">
          {/* Carta de crédito ticket */}
          <div
            className="relative rounded-lg overflow-hidden border"
            style={{ borderColor: LINE, background: INK }}
          >
            <div className="ticket-notch" style={{ left: -9 }} />
            <div className="ticket-notch" style={{ right: -9 }} />
            <div className="px-5 py-4 border-b border-dashed" style={{ borderColor: "#2E5844" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#B9D2C4" }}>
                  Carta de Crédito · Categoria
                </span>
                <span
                  className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                  style={{ background: GOLD_SOFT, color: GOLD }}
                >
                  {modalidade} · {tipoContratacao}
                </span>
              </div>
              <p className="font-serif text-3xl mt-1 tabular-nums" style={{ color: "#F5F3EC" }}>
                {brl(calc.categoria)}
              </p>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <p className="text-[11px]" style={{ color: "#B9D2C4" }}>
                  Parcela integral
                </p>
                <p className="tabular-nums text-sm font-medium" style={{ color: "#F5F3EC" }}>
                  {brl(calc.parcelaIntegral)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px]" style={{ color: "#B9D2C4" }}>
                  Parcela reduzida ({pct(percentualRedutor, 0)})
                </p>
                <p className="tabular-nums text-sm font-semibold" style={{ color: GOLD }}>
                  {brl(calc.valorParcela)}
                </p>
              </div>
            </div>

            {calc.temAdesao && (
              <div className="px-5 py-4 border-t border-dashed" style={{ borderColor: "#2E5844" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: "#B9D2C4" }}>
                    1ª a {qtdParcelasAdesao}ª · primeiras parcelas
                  </span>
                  <span className="tabular-nums text-base font-semibold" style={{ color: "#F5F3EC" }}>
                    {brl(calc.valorParcelaComAdesao)}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "#9FC2AC" }}>
                  (decomposição — parcela + adesão) {brl(calc.valorParcela)} + {brl(calc.valorAdesaoMensal)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px]" style={{ color: "#B9D2C4" }}>
                    {qtdParcelasAdesao + 1}ª em diante
                  </span>
                  <span className="tabular-nums text-base font-semibold" style={{ color: GOLD }}>
                    {brl(calc.valorParcela)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <SectionCard title="Análise de Lance" icon={<TrendingDown size={16} style={{ color: GOLD }} />}>
            <ResultRow label="Representatividade do lance" value={pct(calc.representatividade * 100)} emphasis valueColor={TEAL} />
            <div className="h-px my-2" style={{ background: LINE }} />
            <ResultRow label="Embutido máximo permitido" value={brl(calc.embutidoMaximo)} />
            <ResultRow label="Total necessário p/ ganhar (% do grupo)" value={brl(calc.valorTotalNecessario)} />
            <ResultRow
              label="Recurso próprio necessário (usando embutido máx.)"
              value={brl(calc.totalUsandoEmbutido)}
              valueColor={calc.totalUsandoEmbutido < 0 ? TEAL : INK}
            />
          </SectionCard>

          <SectionCard title="Projeção Pós-Contemplação" icon={<Info size={16} style={{ color: GOLD }} />}>
            <ResultRow label="Crédito líquido liberado" value={brl(calc.creditoLiberado)} />
            <ResultRow
              label="Saldo devedor remanescente"
              value={calc.quitado ? "Quitado" : brl(calc.saldoDevedor)}
              valueColor={calc.quitado ? TEAL : INK}
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md p-3" style={{ background: PAPER, border: `1px solid ${LINE}` }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: INK_SOFT }}>
                  Nova parcela
                </p>
                <p className="text-[11px] mb-2" style={{ color: INK_SOFT }}>
                  Mantém o prazo contratual restante
                </p>
                <p className="tabular-nums text-lg font-semibold" style={{ color: INK }}>
                  {calc.quitado ? brl(0) : brl(calc.novaParcelaA)}
                  <span className="text-xs font-normal" style={{ color: INK_SOFT }}>
                    /mês
                  </span>
                </p>
                <p className="text-[12px] mt-1" style={{ color: TEAL }}>
                  {calc.quitado ? "0 parcelas restantes" : `com prazo de ${calc.prazoRestanteA}`}
                </p>
              </div>
              <div className="rounded-md p-3" style={{ background: GOLD_SOFT, border: `1px solid ${GOLD}33` }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#7A5D1E" }}>
                  Reduzir somente o prazo
                </p>
                <p className="text-[11px] mb-2" style={{ color: "#7A5D1E" }}>
                  Recompõe a amortização integral original
                </p>
                <p className="tabular-nums text-lg font-semibold" style={{ color: INK }}>
                  {calc.quitado ? brl(0) : brl(calc.novaParcelaB)}
                  <span className="text-xs font-normal" style={{ color: "#7A5D1E" }}>
                    /mês
                  </span>
                </p>
                <p className="text-[12px] mt-1" style={{ color: GOLD }}>
                  {calc.quitado ? "0 parcelas restantes" : `com prazo de ${calc.prazoRestanteB}`}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison / print view — shown full-screen when "Gerar comparativo em PDF"
// is clicked. Uses the browser's native print dialog ("Salvar como PDF"),
// so no external PDF library is needed.
// ---------------------------------------------------------------------------
function ComparativoView({ simulacoes, onVoltar }) {
  const [gerando, setGerando] = useState(false);
  const [erroPdf, setErroPdf] = useState("");

  const linhas = [
    { label: "Crédito Contratado", get: (s) => brl(s.inputs.creditoContratado), raw: (s) => s.inputs.creditoContratado },
    { label: "Prazo (parcelas)", get: (s) => `${s.inputs.prazoTotal}`, raw: (s) => s.inputs.prazoTotal },
    { label: "Redutor de Parcela", get: (s) => pct(s.inputs.percentualRedutor, 0), raw: (s) => s.inputs.percentualRedutor },
    { label: "Parcela Inicial", get: (s) => brl(s.resultados.valorParcela), raw: (s) => Math.round(s.resultados.valorParcela) },
    { label: "Lance Próprio", get: (s) => brl(s.inputs.lanceProprio), raw: (s) => s.inputs.lanceProprio },
    { label: "Lance Embutido", get: (s) => brl(s.inputs.lanceEmbutido), raw: (s) => s.inputs.lanceEmbutido },
    {
      label: "Representatividade do Lance",
      get: (s) => pct(s.resultados.representatividade * 100),
      raw: (s) => Math.round(s.resultados.representatividade * 1000),
    },
    { label: "Mês de Contemplação", get: (s) => `${s.inputs.parcelaContemplacao}ª`, raw: (s) => s.inputs.parcelaContemplacao },
    { label: "Crédito Líquido Liberado", get: (s) => brl(s.resultados.creditoLiberado), raw: (s) => Math.round(s.resultados.creditoLiberado) },
  ];

  const divergentFlags = linhas.map((linha) => {
    const raws = simulacoes.map((s) => (linha.raw ? linha.raw(s) : linha.get(s)));
    return new Set(raws).size > 1;
  });

  function baixarComparativo() {
    setGerando(true);
    setErroPdf("");
    try {
      const headerCells = simulacoes
        .map(
          (s) =>
            `<th><div class="nome">${escapeHtml(s.nome)}</div><div class="data">${escapeHtml(
              new Date(s.salvoEm).toLocaleDateString("pt-BR")
            )}</div></th>`
        )
        .join("");

      const bodyRows = linhas
        .map((linha, i) => {
          const cells = simulacoes
            .map((s) => `<td class="${divergentFlags[i] ? "diverge" : ""}">${escapeHtml(linha.get(s))}</td>`)
            .join("");
          return `<tr><td class="label">${escapeHtml(linha.label)}</td>${cells}</tr>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Comparativo de Propostas — PortoBank</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 28px 32px; color: ${INK}; background: #fff; }
  .eyebrow { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${GOLD}; margin: 0 0 4px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .meta { font-family: Arial, sans-serif; font-size: 12px; color: ${INK_SOFT}; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
  th, td { border: 1px solid ${LINE}; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: ${INK}; color: #F5F3EC; font-weight: 600; }
  th .nome { font-family: Georgia, serif; font-size: 13px; }
  th .data { font-size: 10px; color: #B9D2C4; font-weight: 400; margin-top: 2px; }
  td.label { font-weight: 700; color: ${INK_SOFT}; background: ${PAPER}; white-space: nowrap; }
  td.diverge { background: ${GOLD_SOFT}; font-weight: 700; }
  tr:nth-child(even) td:not(.diverge):not(.label) { background: ${PAPER}; }
  .footnote { font-family: Arial, sans-serif; font-size: 11px; color: ${INK_SOFT}; margin-top: 14px; }
  .toolbar { font-family: Arial, sans-serif; margin-bottom: 20px; }
  .toolbar button { background: ${INK}; color: #F5F3EC; border: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
  @media print { .toolbar { display: none; } body { padding: 8mm; } }
  @page { size: A4 landscape; margin: 10mm; }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Imprimir / Salvar como PDF</button></div>
  <p class="eyebrow">PortoBank · Consórcios</p>
  <h1>Comparativo de Propostas</h1>
  <p class="meta">Gerado em ${new Date().toLocaleDateString("pt-BR")} · ${simulacoes.length} proposta${
        simulacoes.length === 1 ? "" : "s"
      }</p>
  <table>
    <thead><tr><th>Item</th>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <p class="footnote">Linhas destacadas indicam onde as propostas selecionadas divergem entre si. Simulação sujeita a alteração conforme taxas e tabela comercial vigentes na data da contratação.</p>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comparativo-portobank-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setErroPdf("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#FFFFFF", color: INK }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print border-b" style={{ borderColor: LINE, background: PAPER }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <button onClick={onVoltar} className="flex items-center gap-2 text-sm font-medium" style={{ color: INK }}>
            <ArrowLeft size={16} /> Voltar ao simulador
          </button>
          <div className="flex items-center gap-4">
            {erroPdf && (
              <span className="text-[12px]" style={{ color: RED }}>
                {erroPdf}
              </span>
            )}
            <button
              onClick={baixarComparativo}
              disabled={gerando || simulacoes.length === 0}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: INK, color: "#F5F3EC" }}
            >
              <Download size={14} /> {gerando ? "Gerando…" : "Baixar comparativo (para imprimir)"}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
          <p className="text-[11px]" style={{ color: INK_SOFT }}>
            Baixa um arquivo que você abre no navegador e imprime ou salva como PDF por lá — sem depender de nada externo.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>
          PortoBank · Consórcios
        </p>
        <h1 className="font-serif text-2xl mt-0.5 mb-1" style={{ color: INK }}>
          Comparativo de Propostas
        </h1>
        <p className="text-[12px] mb-5" style={{ color: INK_SOFT }}>
          Gerado em {new Date().toLocaleDateString("pt-BR")} · {simulacoes.length} proposta
          {simulacoes.length === 1 ? "" : "s"}
        </p>

        {simulacoes.length === 0 ? (
          <p className="text-sm" style={{ color: INK_SOFT }}>
            Nenhuma simulação selecionada.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: LINE }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th
                    className="text-left px-3 py-3 sticky left-0"
                    style={{ background: INK, color: "#F5F3EC", minWidth: 200 }}
                  >
                    Item
                  </th>
                  {simulacoes.map((s) => (
                    <th key={s.id} className="text-left px-3 py-3" style={{ background: INK, color: "#F5F3EC", minWidth: 170 }}>
                      <div className="font-serif text-base">{s.nome}</div>
                      <div className="text-[11px] font-normal" style={{ color: "#B9D2C4" }}>
                        {new Date(s.salvoEm).toLocaleDateString("pt-BR")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, i) => {
                  const valores = simulacoes.map((s) => linha.raw ? linha.raw(s) : linha.get(s));
                  const divergem = new Set(valores).size > 1;
                  return (
                    <tr key={linha.label} style={{ background: i % 2 === 0 ? PAPER_RAISED : PAPER }}>
                      <td
                        className="px-3 py-2 text-[12px] font-semibold sticky left-0"
                        style={{ color: INK_SOFT, background: i % 2 === 0 ? PAPER_RAISED : PAPER }}
                      >
                        {linha.label}
                      </td>
                      {simulacoes.map((s) => (
                        <td
                          key={s.id}
                          className="px-3 py-2 tabular-nums text-[13px]"
                          style={{
                            color: INK,
                            fontWeight: divergem ? 700 : 400,
                            background: divergem ? GOLD_SOFT : "transparent",
                          }}
                        >
                          {linha.get(s)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] mt-4" style={{ color: INK_SOFT }}>
          Linhas destacadas indicam onde as propostas selecionadas divergem entre si. Simulação sujeita a alteração conforme
          taxas e tabela comercial vigentes na data da contratação.
        </p>
      </div>
    </div>
  );
}
