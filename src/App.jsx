import { useState, useEffect, useCallback, useRef } from "react";
import ListaExercicios from "./services/ListaExercicio";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

function App() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario_whatsapp"));
  const [etapa, setEtapa] = useState("verificando"); // verificar, login, triagem, home, personal, aluno, onboarding, login_personal, login_aluno
  const [abaAtiva, setAbaAtiva] = useState("home");
  const [isVip, setIsVip] = useState(false);
  const [treinoIAPescado, setTreinoIAPescado] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [modalidadeAberta, setModalidadeAberta] = useState(null);

  // --- ESTADOS PORTAL DO PERSONAL E ALUNO ---
  const [personalLogado, setPersonalLogado] = useState(null);
  const [cref, setCref] = useState("");

  const [alunoLogado, setAlunoLogado] = useState(null);
  const [codigoAcessoAluno, setCodigoAcessoAluno] = useState("");
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState([]);
  const [alunosPersonal, setAlunosPersonal] = useState([]); // Agora inicia vazio e busca da API

  // Controle do Modal de Prescrição
  const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
  const [treinoForm, setTreinoForm] = useState([]);

  const [perfil, setPerfil] = useState({
    nome: "Guerreiro(a)",
    peso: "0",
    altura: "0",
    idade: "0",
    meta: "Emagrecimento",
    imc: "0",
    tmb: "0",
    faltam: "0"
  });

  // URL unificada da sua API hospedada no Render
  const API_URL = "https://api-backend-treino-fit.onrender.com/api";
  const verificandoRef = useRef(false);

  // --- BUSCAR ALUNOS DA ASSESSORIA (BACK-END) ---
  const carregarAlunosAssessoria = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/personal/alunos`);
      if (response.ok) {
        const dados = await response.json();
        setAlunosPersonal(dados);
      }
    } catch (err) {
      console.error("Erro ao carregar alunos do back-end:", err);
    }
  }, [API_URL]);

  // Carrega a carteira de clientes sempre que o Personal logar
  useEffect(() => {
    if (etapa === "personal") {
      carregarAlunosAssessoria();
    }
  }, [etapa, carregarAlunosAssessoria]);

  const calcularSaude = useCallback((peso, altura, idade) => {
    const p = parseFloat(peso) || 0;
    const a = parseFloat(altura) || 0;
    const i = parseInt(idade) || 25;
    if (p > 0 && a > 0) {
      const imc = (p / (a * a)).toFixed(1);
      const tmb = (10 * p + (6.25 * (a * 100)) - (5 * i)).toFixed(0);
      const falta = (p * 0.1).toFixed(1);
      return { imc, tmb, falta };
    }
    return { imc: "0", tmb: "0", falta: "0" };
  }, []);

  const atualizarStatusVIP = useCallback(async () => {
    if (!usuario) return;
    try {
      const whatsLimpo = String(usuario).replace(/\D/g, "");
      const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);
      if (response.ok) {
        const dados = await response.json();
        setIsVip(dados.pago === true);
        if (dados.treinoIA) setTreinoIAPescado(dados.treinoIA);

        if (dados.peso) {
          const saude = calcularSaude(dados.peso, dados.altura, dados.idade);
          setPerfil(prev => ({
            ...prev,
            nome: dados.nome || prev.nome,
            peso: String(dados.peso),
            altura: String(dados.altura),
            meta: dados.meta || prev.meta,
            ...saude
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar VIP:", err);
    }
  }, [usuario, API_URL, calcularSaude]);

  const sincronizarComBanco = useCallback(async (whatsappId) => {
    if (!whatsappId || verificandoRef.current) return;
    try {
      verificandoRef.current = true;
      const whatsLimpo = String(whatsappId).replace(/\D/g, "");
      const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);
      if (response.ok) {
        const dados = await response.json();
        if (!dados.peso || dados.peso === 0) {
          setEtapa("onboarding");
        } else {
          const saude = calcularSaude(dados.peso, dados.altura, dados.idade);
          setPerfil({
            nome: dados.nome || "Guerreiro(a)",
            peso: String(dados.peso),
            altura: String(dados.altura),
            idade: String(dados.idade || 25),
            meta: dados.meta || "Emagrecimento",
            ...saude
          });
          setIsVip(dados.pago === true);
          setTreinoIAPescado(dados.treinoIA || null);
          setEtapa("home");
        }
      } else {
        setEtapa("onboarding");
      }
    } catch {
      setEtapa("onboarding");
    } finally {
      verificandoRef.current = false;
    }
  }, [API_URL, calcularSaude]);

  useEffect(() => {
    if (usuario) {
      if (etapa === "verificando") sincronizarComBanco(usuario);
    } else {
      if (etapa === "verificando") {
        setEtapa("triagem");
      }
    }
  }, [usuario, etapa, sincronizarComBanco]);

  const handleLogin = (whatsapp) => {
    const limpo = String(whatsapp).replace(/\D/g, "");
    localStorage.setItem("usuario_whatsapp", limpo);
    setUsuario(limpo);
    setEtapa("verificando");
  };

  const handleSair = () => {
    localStorage.clear();
    setUsuario(null);
    setEtapa("triagem");
  };

  // --- LÓGICAS DO PAINEL DO PERSONAL ---
  const handleLoginPersonal = (e) => {
    e.preventDefault();
    if (!cref.trim()) return alert("Por favor, insira o seu CREF técnico.");
    setPersonalLogado({ nome: "Prof. " + cref.split("/")[0], cref });
    setEtapa("personal");
  };

  const alterStatusContaAluno = async (id, novoStatus) => {
    try {
      const response = await fetch(`${API_URL}/aluno/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusConta: novoStatus })
      });
      if (response.ok) {
        setAlunosPersonal(prev => prev.map(a => a.id === id ? { ...a, statusConta: novoStatus } : a));
      }
    } catch {
      alert("Erro ao alterar status no servidor.");
    }
  };

  const abrirGeradorTreino = (aluno) => {
    setAlunoEmEdicao(aluno);
    setTreinoForm(aluno.treinoPrescrito || []);
  };

  const adicionarExercicioForm = () => {
    setTreinoForm([...treinoForm, { nome: "", series: 4, reps: "10", obs: "" }]);
  };

  const removerExercicioForm = (index) => {
    setTreinoForm(treinoForm.filter((_, i) => i !== index));
  };

  const handleExercicioChange = (index, campo, valor) => {
    const novoTreino = [...treinoForm];
    novoTreino[index][campo] = valor;
    setTreinoForm(novoTreino);
  };

  // POST REAL: Enviando a planilha montada para persistir no MongoDB
  const salvarTreinoPersonal = async (e) => {
    e.preventDefault();
    if (treinoForm.length === 0) return alert("Adicione pelo menos um exercício!");

    try {
      const response = await fetch(`${API_URL}/aluno/${alunoEmEdicao.id}/prescrever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treinoPrescrito: treinoForm })
      });

      if (response.ok) {
        setAlunosPersonal(prev => prev.map(a =>
          a.id === alunoEmEdicao.id
            ? { ...a, statusTreino: "Enviado", treinoPrescrito: treinoForm }
            : a
        ));
        alert(`Planilha aplicada com sucesso na nuvem para ${alunoEmEdicao.nome}!`);
        setAlunoEmEdicao(null);
      }
    } catch {
      alert("Erro de conexão ao salvar treino no banco.");
    }
  };

  const deletarAluno = async (id) => {
    if (!confirm("Remover este aluno de forma permanente?")) return;
    try {
      const response = await fetch(`${API_URL}/aluno/${id}`, { method: "DELETE" });
      if (response.ok) {
        setAlunosPersonal(prev => prev.filter(a => a.id !== id));
      }
    } catch {
      alert("Erro ao deletar aluno.");
    }
  };

  // --- LÓGICAS DA ÁREA DO ALUNO ---
  const handleLoginAluno = async (e) => {
    e.preventDefault();
    const termoBusca = codigoAcessoAluno.trim();

    try {
      // Busca a ficha do aluno atualizada direto do back-end
      const response = await fetch(`${API_URL}/aluno/login?nome=${encodeURIComponent(termoBusca)}`);
      if (response.ok) {
        const alunoEncontrado = await response.json();

        if (alunoEncontrado.statusConta === "Off") {
          return alert("Acesso suspenso! Entre em contato com seu Personal Trainer.");
        }

        setAlunoLogado(alunoEncontrado);
        setExerciciosConcluidos([]);
        setEtapa("aluno");
      } else {
        alert("Aluno não encontrado na assessoria.");
      }
    } catch {
      alert("Erro ao conectar com o portal da assessoria.");
    }
  };

  const alternarConclusaoExercicio = (index) => {
    if (exerciciosConcluidos.includes(index)) {
      setExerciciosConcluidos(exerciciosConcluidos.filter(i => i !== index));
    } else {
      setExerciciosConcluidos([...exerciciosConcluidos, index]);
    }
  };

  // POST REAL: Registrando check-in definitivo no MongoDB
  const ejecutarCheckin = async () => {
    const hojeObj = new Date();
    const dataFormatada = hojeObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    const diaSemana = hojeObj.toLocaleDateString("pt-BR", { weekday: 'long' });
    const diaSemanaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    const jaFezCheckin = alunoLogado.checkins?.some(c => c.data === dataFormatada);
    if (jaFezCheckin) return alert("Check-in de hoje já foi computado!");

    const novoCheckin = { data: dataFormatada, diaSemana: diaSemanaFormatado };

    try {
      const response = await fetch(`${API_URL}/aluno/${alunoLogado.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoCheckin)
      });

      if (response.ok) {
        setAlunoLogado(prev => ({
          ...prev,
          checkins: [novoCheckin, ...(prev.checkins || [])]
        }));
        alert("🔥 Check-in persistido com sucesso no banco de dados da assessoria!");
      }
    } catch {
      alert("Erro ao enviar check-in para o servidor.");
    }
  };

  const salvarOnboarding = async () => {
    if (!perfil.nome || !perfil.peso || !perfil.altura || !perfil.idade) {
      alert("Preencha todos os campos!");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/usuarios/atualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: usuario,
          nome: perfil.nome,
          peso: Number(perfil.peso),
          altura: Number(perfil.altura),
          meta: perfil.meta,
          idade: Number(perfil.idade)
        })
      });
      if (response.ok) {
        const saude = calcularSaude(perfil.peso, perfil.altura, perfil.idade);
        setPerfil(prev => ({ ...prev, ...saude }));
        setEtapa("home");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  // [O restante da renderização dos layouts de telas 1 até 9 continua idêntico]
  // (Mantendo toda a interface e estruturas visuais anteriores de carregamento, triagem, personal, aluno e onboarding...)
  if (etapa === "verificando") { return <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center z-50"><div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div><div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Sincronizando com Render...</div></div>; }
  if (etapa === "login") return <Login aoLogar={handleLogin} />;
  if (etapa === "triagem") { return <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50"><div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl"><div className="flex items-center gap-3 mb-6"><div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-black text-xs">TF</div><div><h1 className="text-md font-bold tracking-tight uppercase">Treino Fit <span className="text-emerald-500 text-[10px] ml-1 font-mono">v8.0</span></h1><p className="text-neutral-500 text-[11px]">Banco de dados ativado</p></div></div><div className="space-y-3"><button type="button" onClick={() => setEtapa(usuario ? "home" : "login")} className="w-full bg-[#1e2029] hover:bg-[#252834] border border-neutral-800 text-left p-4 rounded-xl flex items-center justify-between transition-all group"><div><p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Módulo Consultoria</p><p className="text-sm font-semibold text-neutral-200">Acessar Chat Inteligência Artificial</p></div><span className="text-neutral-500 group-hover:text-emerald-500 transition-colors text-sm">→</span></button><button type="button" onClick={() => setEtapa("login_personal")} className="w-full bg-[#1e2029] hover:bg-[#252834] border border-neutral-800 text-left p-4 rounded-xl flex items-center justify-between transition-all group"><div><p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Módulo Treinador</p><p className="text-sm font-semibold text-neutral-200">Painel Geral do Personal Trainer</p></div><span className="text-neutral-500 group-hover:text-white transition-colors text-sm">→</span></button><button type="button" onClick={() => setEtapa("login_aluno")} className="w-full bg-[#1e2029] hover:bg-[#252834] border border-neutral-800 text-left p-4 rounded-xl flex items-center justify-between transition-all group"><div><p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Módulo Aluno</p><p className="text-sm font-semibold text-neutral-200">Portal de Planilhas e Treinos Pro</p></div><span className="text-neutral-500 group-hover:text-blue-400 transition-colors text-sm">→</span></button></div></div></div>; }
  if (etapa === "login_personal") { return <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50"><div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl"><h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Acesso Técnico</h2><p className="text-neutral-500 text-xs mb-5">Insira seu registro para autenticação profissional.</p><form onSubmit={handleLoginPersonal} className="space-y-4"><input required type="text" placeholder="Registro CREF (Ex: 123456-G/SP)" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={cref} onChange={(e) => setCref(e.target.value)} /><div className="flex gap-3 text-xs font-bold"><button type="button" onClick={() => setEtapa("triagem")} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Voltar</button><button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Validar Acesso</button></div></form></div></div>; }
  if (etapa === "login_aluno") { return <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50"><div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl"><h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Portal do Aluno</h2><p className="text-neutral-500 text-xs mb-5">Sincronizado via API em nuvem.</p><form onSubmit={handleLoginAluno} className="space-y-4"><input required type="text" placeholder="Nome Completo do Aluno" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={codigoAcessoAluno} onChange={(e) => setCodigoAcessoAluno(e.target.value)} /><div className="flex gap-3 text-xs font-bold"><button type="button" onClick={() => setEtapa("triagem")} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Voltar</button><button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Entrar</button></div></form></div></div>; }

  if (etapa === "personal") {
    const hojeDataStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    return (
      <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-6 overflow-y-auto font-sans z-40">
        <header className="w-full max-w-5xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-emerald-500 font-mono text-xs font-bold">TF</div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">{personalLogado?.nome}</h2>
              <p className="text-[10px] text-neutral-500 font-mono">{personalLogado?.cref} • Assessoria Conectada</p>
            </div>
          </div>
          <button type="button" onClick={() => setEtapa("triagem")} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 text-[10px] text-neutral-400 font-bold uppercase transition-colors">Desconectar</button>
        </header>

        <main className="w-full max-w-5xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 bg-[#16171d] border border-neutral-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Métricas da Assessoria</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-white">{alunosPersonal.length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Alunos</p></div>
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-amber-500">{alunosPersonal.filter(a => a.statusTreino === "Rascunho IA").length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Alertas IA</p></div>
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-neutral-400">{alunosPersonal.filter(a => a.statusConta === "Off").length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Inativos</p></div>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#16171d] border border-neutral-800 rounded-xl p-5 shadow-xl overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Carteira de Clientes Real-Time</h3>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-wider">
                  <th className="pb-3 font-semibold">Nome do Aluno</th>
                  <th className="pb-3 font-semibold">Objetivo</th>
                  <th className="pb-3 font-semibold">Status Planilha</th>
                  <th className="pb-3 font-semibold">Último Treino</th>
                  <th className="pb-3 font-semibold text-right">Ações Gerenciais</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-neutral-800/40">
                {alunosPersonal.map((aluno) => {
                  const fezCheckinHoje = aluno.checkins?.some(c => c.data === hojeDataStr);
                  return (
                    <tr key={aluno.id} className={`hover:bg-neutral-800/20 transition-colors ${aluno.statusConta === 'Off' ? 'opacity-40' : ''}`}>
                      <td className="py-3.5 font-medium text-white"><div>{aluno.nome}</div><div className="text-[10px] text-neutral-500 font-mono mt-0.5">{aluno.whatsapp}</div></td>
                      <td className="py-3.5 text-neutral-400">{aluno.objetivo}</td>
                      <td className="py-3.5"><span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>{aluno.statusTreino}</span></td>
                      <td className="py-3.5">
                        {fezCheckinHoje ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse">🔥 Treinou Hoje!</span>
                        ) : aluno.checkins && aluno.checkins.length > 0 ? (
                          <span className="text-[10px] font-mono text-neutral-400">Check-in: {aluno.checkins[0].data}</span>
                        ) : (
                          <span className="text-[10px] text-neutral-600 font-mono">Nenhum treino</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusTreino === "Rascunho IA" ? "Revisar IA" : "Montar Treino"}</button>
                        <button type="button" onClick={() => alterStatusContaAluno(aluno.id, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className="border border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusConta === "Ativo" ? "Arquivar" : "Ativar"}</button>
                        <button type="button" onClick={() => deletarAluno(aluno.id)} className="text-red-500/70 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 rounded font-bold text-[9px] py-1 px-2 uppercase">Excluir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>

        {/* MODAL CONSTRUTOR DE PLANILHAS */}
        {alunoEmEdicao && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <header className="p-5 border-b border-neutral-800 flex justify-between items-center bg-[#1c1d26]"><div><span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">Prescrevendo Planilha Pro</span><h3 className="text-base font-bold text-white uppercase">{alunoEmEdicao.nome}</h3></div><button type="button" onClick={() => setAlunoEmEdicao(null)} className="text-neutral-400 hover:text-white text-sm uppercase font-mono font-bold">Fechar ✕</button></header>
              <form onSubmit={salvarTreinoPersonal} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/60"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Estrutura de Exercícios</p><button type="button" onClick={adicionarExercicioForm} className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-emerald-600/20 transition-all uppercase">+ Adicionar Linha</button></div>
                <div className="space-y-3">
                  {treinoForm.map((ex, idx) => (
                    <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl space-y-3 relative group">
                      <button type="button" onClick={() => removerExercicioForm(idx)} className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 text-[10px] uppercase font-mono tracking-wider transition-colors">Remover</button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Nome do Movimento</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.nome} onChange={(e) => handleExercicioChange(idx, "nome", e.target.value)} /></div>
                        <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Séries</label><input required type="number" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.series} onChange={(e) => handleExercicioChange(idx, "series", Number(e.target.value))} /></div>
                        <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Repetições / Tempo</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.reps} onChange={(e) => handleExercicioChange(idx, "reps", e.target.value)} /></div>
                      </div>
                      <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Diretriz Técnica / Observação</label><input type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.obs} onChange={(e) => handleExercicioChange(idx, "obs", e.target.value)} /></div>
                    </div>
                  ))}
                </div>
                <footer className="pt-4 border-t border-neutral-800 flex gap-3 justify-end text-xs font-bold"><button type="button" onClick={() => setAlunoEmEdicao(null)} className="bg-transparent border border-neutral-800 text-neutral-400 p-3 rounded-xl uppercase tracking-wider hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg px-6">Aplicar Treino Pro</button></footer>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (etapa === "aluno") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-6 overflow-y-auto font-sans z-40">
        <header className="w-full max-w-md mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
          <div><p className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider">Consultoria Privada Treino Fit</p><h2 className="text-md font-bold text-white uppercase tracking-tight">{alunoLogado?.nome}</h2><p className="text-[10px] text-neutral-500 font-mono mt-0.5">Objetivo: {alunoLogado?.objetivo}</p></div>
          <button type="button" onClick={() => { setEtapa("triagem"); setAlunoLogado(null); }} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition-colors">Sair</button>
        </header>
        <main className="w-full max-w-md mx-auto flex-1 space-y-6 pb-10">
          <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Check-ins Validados</p><h3 className="text-3xl font-bold text-white mt-1">{alunoLogado?.checkins?.length || 0}</h3></div>
            <button type="button" onClick={ejecutarCheckin} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg">Confirmar Treino de Hoje</button>
          </div>

          <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Histórico de Consistência</p>
            {!alunoLogado?.checkins || alunoLogado.checkins.length === 0 ? (
              <p className="text-[11px] text-neutral-500 uppercase font-mono">Nenhum treino registrado esta semana.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {alunoLogado.checkins.map((ch, idx) => (
                  <div key={idx} className="bg-[#0d0e12] border border-neutral-850 p-2.5 rounded-lg flex items-center justify-between"><div><p className="text-[11px] font-bold text-white tracking-tight">{ch.diaSemana}</p><p className="text-[9px] text-neutral-500 font-mono mt-0.5">Data: {ch.data}</p></div><span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">🔥 OK</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!alunoLogado?.treinoPrescrito || alunoLogado.treinoPrescrito.length === 0 ? (
              <div className="bg-[#16171d] border border-neutral-800 p-8 rounded-xl text-center"><p className="text-xs text-neutral-400 font-semibold uppercase font-mono">Nenhum treino ativo.</p></div>
            ) : (
              alunoLogado.treinoPrescrito.map((ex, i) => {
                const estaconcluido = exerciciosConcluidos.includes(i);
                return (
                  <div key={i} className={`bg-[#16171d] border transition-all rounded-xl overflow-hidden shadow-xl ${estaconcluido ? 'border-blue-500/30 opacity-60' : 'border-neutral-800'}`}>
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1"><h4 className={`font-bold uppercase text-base tracking-tight text-white ${estaconcluido ? 'line-through text-neutral-500' : ''}`}>{ex.nome}</h4><span className="bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded">{ex.series} Séries × {ex.reps} Reps</span>{ex.obs && <div className="bg-[#0d0e12] border border-neutral-850 p-3 rounded-lg mt-3"><p className="text-[11px] text-neutral-400"><strong>Diretriz:</strong> {ex.obs}</p></div>}</div>
                      <button type="button" onClick={() => alternarConclusaoExercicio(i)} className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm ${estaconcluido ? 'bg-blue-600 border-blue-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>{estaconcluido ? "✓" : ""}</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    );
  }

  if (etapa === "onboarding") { return <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-8 text-white z-50 overflow-y-auto font-sans"><div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl"><h2 className="text-md font-bold mb-1 uppercase tracking-tight text-neutral-200">Parâmetros Iniciais</h2><form className="space-y-4"><input type="text" placeholder="Nome Completo" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} /><div className="flex gap-3"><input type="number" placeholder="Idade" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })} /><input type="number" placeholder="Peso (kg)" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} /><input type="number" placeholder="Altura (m)" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} /></div><select className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none text-neutral-400 focus:border-neutral-700" onChange={(e) => setPerfil({ ...perfil, meta: e.target.value })}><option value="Emagrecimento">Macro-objetivo: Emagrecimento</option><option value="Hipertrofia">Macro-objetivo: Hipertrofia</option></select><div className="flex gap-3 text-xs font-bold pt-2"><button type="button" onClick={handleSair} className="w-1/3 bg-transparent border border-neutral-800 text-neutral-400 font-bold p-4 rounded-xl uppercase tracking-wider hover:bg-neutral-800">Voltar</button><button type="button" onClick={salvarOnboarding} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Ativar Painel</button></div></form></div></div>; }

  return (
    <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col overflow-hidden font-sans z-30">
      {abaAtiva === "home" && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <header className="w-full max-w-4xl flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center space-x-3"><div className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-emerald-500 font-mono text-xs font-bold">TF</div><div><h2 className="text-sm font-bold text-white uppercase tracking-tight">{perfil.nome}</h2><p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Conta {isVip ? 'Premium Elite' : 'Free Tier'}</p></div></div>
            <button type="button" onClick={() => !isVip && setBloqueado(true)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase font-mono border ${isVip ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5'}`}>{isVip ? "✓ Assinatura Sincronizada" : "Upgrade para Enterprise"}</button>
          </header>
          <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Composição Corporal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Massa Global</span><span className="text-2xl font-semibold text-white">{perfil.peso}<span className="text-xs text-neutral-500 font-normal ml-0.5">kg</span></span></div>
                  <div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Estatura</span><span className="text-2xl font-semibold text-white">{perfil.altura}<span className="text-xs text-neutral-500 font-normal ml-0.5">m</span></span></div>
                </div>
              </div>
              <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl text-center">
                <div className="inline-flex flex-col items-center justify-center p-6 border border-neutral-800 bg-[#0d0e12] rounded-full w-28 h-28"><span className="text-xl font-bold text-white">{perfil.tmb}</span><span className="text-[9px] font-mono text-neutral-500 uppercase">kcal/dia</span></div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl"><p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">⚡ Diretriz Técnica Operacional</p><p className="text-xs font-medium text-neutral-300">"{perfil.nome}, seus parâmetros apontam foco em oxidação de gordura active."</p></div>
              <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button type="button" onClick={() => setAbaAtiva("chat")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all shadow-lg">Abrir Chat IA</button><button type="button" onClick={() => setAbaAtiva("treino")} className="bg-transparent hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all">Biblioteca de Treinos</button></div>
              </div>
            </div>
          </main>
        </div>
      )}

      {abaAtiva === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-4 flex items-center justify-between border-b border-neutral-800 bg-[#16171d]"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Voltar</button></header>
          <ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} setTreinoIAPescado={setTreinoIAPescado} aoAtualizarPerfil={atualizarStatusVIP} />
        </div>
      )}

      {abaAtiva === "treino" && (
        <div className="flex-1 flex flex-col bg-[#0d0e12] p-6 overflow-y-auto">
          <header className="w-full max-w-4xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Retornar</button></header>
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mx-auto">
            <button type="button" onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="bg-[#16171d] border border-neutral-800 p-6 rounded-xl flex items-center justify-between"><div><p className="font-bold uppercase text-sm text-white">Treino Inteligência Artificial</p></div><span>🤖</span></button>
            <button type="button" onClick={() => setModalidadeAberta('academia')} className="bg-[#16171d] border border-neutral-800 p-6 rounded-xl flex items-center justify-between"><div><p className="font-bold uppercase text-sm text-white">Metodologia Tradicional</p></div><span>🏋️‍♂️</span></button>
          </div>
          {modalidadeAberta && <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />}
        </div>
      )}

      {bloqueado && <div className="fixed inset-0 z-[500] bg-[#0d0e12]/95 backdrop-blur-sm flex flex-col items-center p-6 overflow-y-auto"><button type="button" onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-neutral-400 bg-neutral-900 border border-neutral-800 w-8 h-8 rounded flex items-center justify-center text-xs">✕</button><TelaPlanos /></div>}
    </div>
  );
}

export default App;