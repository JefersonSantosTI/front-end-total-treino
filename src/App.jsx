import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useCallback, useRef } from "react";
import ListaExercicios from "./services/ListaExercicio";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

import { abrirExercicioVisual } from "./components/visual";

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Função para garantir que os números sejam salvos corretamente (evitando erros de vírgula)
const parseNumeroSeguro = (val) => Number(String(val).replace(',', '.')) || 0;

function App() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario_whatsapp"));
  const [etapa, setEtapa] = useState("verificando");
  const [abaAtiva, setAbaAtiva] = useState(() => localStorage.getItem("treino_fit_aba") || "home");
  const [isVip, setIsVip] = useState(false);
  const [treinoIAPescado, setTreinoIAPescado] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [modalidadeAberta, setModalidadeAberta] = useState(null);

  const [personalLogado, setPersonalLogado] = useState(() => {
    const salvo = localStorage.getItem("treino_fit_personal");
    return salvo ? JSON.parse(salvo) : null;
  });

  const [cref, setCref] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [alunoLogado, setAlunoLogado] = useState(null);
  const [codigoAcessoAluno, setCodigoAcessoAluno] = useState("");
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState([]);
  const [alunosPersonal, setAlunosPersonal] = useState([]);

  const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
  const [modalGifAberto, setModalGifAberto] = useState(null);
  const [alunoEditandoPerfil, setAlunoEditandoPerfil] = useState(null);
  const [isRecalculando, setIsRecalculando] = useState(false);

  const [modalFeedbackAberto, setModalFeedbackAberto] = useState(false);
  const [feedbackTreino, setFeedbackTreino] = useState({ intensidade: "Moderado 🟡", carga: "Na medida ✅", comentario: "" });
  const [alunoVerFeedback, setAlunoVerFeedback] = useState(null);

  const [modalPlanosPersonal, setModalPlanosPersonal] = useState(false);
  const [modalAvaliacaoAluno, setModalAvaliacaoAluno] = useState(false);

  const [treinoForm, setTreinoForm] = useState([]);
  const [dietaForm, setDietaForm] = useState([]);
  const [aguaForm, setAguaForm] = useState("");
  const [diaAbaAluno, setDiaAbaAluno] = useState("Segunda");
  const [diaAbaPersonal, setDiaAbaPersonal] = useState("Segunda");
  const [modalNovoAluno, setModalNovoAluno] = useState(false);
  const [novoAlunoForm, setNovoAlunoForm] = useState({ nome: "", whatsapp: "", objetivo: "Emagrecimento" });

  const [perfil, setPerfil] = useState({
    nome: "Guerreiro(a)", peso: "", altura: "", idade: "", meta: "Emagrecimento",
    genero: "Masculino", nivel: "Intermediário", diasTreino: "5", restricoes: "", lesoes: "",
    imc: "0", tmb: "0", faltam: "0"
  });

  const API_URL = "https://api-backend-treino-fit.onrender.com/api";
  const verificandoRef = useRef(false);

  const KIWIFY_MENSAL = "https://pay.kiwify.com.br/O5ggnzX";
  const KIWIFY_ANUAL = "https://pay.kiwify.com.br/vbvKtGY";

  useEffect(() => {
    const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
    const diaFormatado = DIAS_SEMANA.find(d => diaAtualSistema.toLowerCase().includes(d.toLowerCase().slice(0, 4))) || "Segunda";
    setDiaAbaAluno(diaFormatado);
  }, []);

  const carregarAlunosAssessoria = useCallback(async () => {
    if (!personalLogado || !personalLogado._id) return;
    try {
      const response = await fetch(`${API_URL}/personal/alunos?personalId=${personalLogado._id}`);
      if (response.ok) {
        const dados = await response.json();
        setAlunosPersonal(dados);
      }
    } catch (err) { console.error("Erro ao carregar alunos:", err); }
  }, [API_URL, personalLogado]);

  useEffect(() => {
    if (etapa === "personal") carregarAlunosAssessoria();
  }, [etapa, carregarAlunosAssessoria]);

  const calcularSaude = useCallback((peso, altura, idade) => {
    const p = parseFloat(String(peso).replace(',', '.')) || 0;
    const a = parseFloat(String(altura).replace(',', '.')) || 0;
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
          setPerfil(prev => ({ ...prev, nome: dados.nome || prev.nome, peso: String(dados.peso), altura: String(dados.altura), meta: dados.meta || prev.meta, ...saude }));
        }
      }
    } catch (err) { console.error("Erro ao sincronizar VIP:", err); }
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
            nome: dados.nome || "Guerreiro(a)", peso: String(dados.peso), altura: String(dados.altura), idade: String(dados.idade || 25),
            meta: dados.meta || "Emagrecimento", genero: dados.genero || "Masculino", nivel: dados.nivel || "Intermediário",
            diasTreino: dados.diasTreino || "5", restricoes: dados.restricoes || "", lesoes: dados.lesoes || "", ...saude
          });
          setIsVip(dados.pago === true);
          setTreinoIAPescado(dados.treinoIA || null);
          setEtapa("home");
        }
      } else { setEtapa("onboarding"); }
    } catch { setEtapa("onboarding"); }
    finally { verificandoRef.current = false; }
  }, [API_URL, calcularSaude]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refPersonal = urlParams.get('ref');

    if (refPersonal) {
      setEtapa("matricula_externa");
      return;
    }

    if (etapa === "verificando") {
      const personalSalvo = localStorage.getItem("treino_fit_personal");
      const usuarioSalvo = localStorage.getItem("usuario_whatsapp");

      if (personalSalvo) {
        setPersonalLogado(JSON.parse(personalSalvo));
        setEtapa("personal");
      } else if (usuarioSalvo) {
        sincronizarComBanco(usuarioSalvo);
      } else {
        setEtapa("triagem");
      }
    }
  }, [etapa, sincronizarComBanco]);

  const handleLogin = (whatsapp) => {
    const limpo = String(whatsapp).replace(/\D/g, "");
    localStorage.removeItem("treino_fit_personal");
    setPersonalLogado(null);
    localStorage.setItem("usuario_whatsapp", limpo);
    setUsuario(limpo);
    setEtapa("verificando");
  };

  const handleSair = () => {
    localStorage.removeItem("treino_fit_personal");
    localStorage.removeItem("treino_fit_aba");
    localStorage.removeItem("usuario_whatsapp");
    localStorage.clear();
    setUsuario(null);
    setPersonalLogado(null);
    setEtapa("triagem");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const dadosGoogle = { nome: decoded.name, email: decoded.email, googleId: decoded.sub, foto: decoded.picture };
    setGoogleUser(dadosGoogle);
    localStorage.removeItem("usuario_whatsapp");
    setUsuario(null);

    try {
      const response = await fetch(`${API_URL}/personal/auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosGoogle)
      });
      const data = await response.json();
      if (response.ok && !data.requerCref) {
        setPersonalLogado(data);
        localStorage.setItem("treino_fit_personal", JSON.stringify(data));
        setEtapa("personal");
      } else if (data.requerCref) {
        // Aguarda CREF
      } else { alert(data.mensagem); }
    } catch (err) { console.error("Erro no banco:", err); }
  };

  const handleCadastrarCref = async (e) => {
    e.preventDefault();
    const regexCref = /^\d{4,6}-[GgPp]\/[A-Za-z]{2}$/;

    if (!regexCref.test(cref.trim())) {
      return alert("🚫 Formato de CREF inválido!\n\nO formato correto deve ter os números, a categoria (G) e a sigla do seu Estado.\n\nExemplo correto: 123456-G/SP");
    }

    try {
      const response = await fetch(`${API_URL}/personal/auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...googleUser, cref })
      });
      const data = await response.json();
      if (response.ok) {
        setPersonalLogado(data);
        localStorage.setItem("treino_fit_personal", JSON.stringify(data));
        setEtapa("personal");
      } else { alert(data.mensagem); }
    } catch (err) { console.error("Erro CREF:", err); }
  };

  const cadastrarNovoAluno = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...novoAlunoForm, personalId: personalLogado._id };

      const response = await fetch(`${API_URL}/aluno`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setAlunosPersonal([data, ...alunosPersonal]);
        alert(`✅ Aluno Cadastrado!\n\nCódigo de Acesso: ${data.nome}`);
        setModalNovoAluno(false);
        setNovoAlunoForm({ nome: "", whatsapp: "", objetivo: "Emagrecimento" });
      } else { alert(data.mensagem || "Erro ao cadastrar."); }
    } catch { alert("Erro de conexão."); }
  };

  const alterStatusContaAluno = async (id, novoStatus) => {
    try {
      const response = await fetch(`${API_URL}/aluno/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statusConta: novoStatus })
      });
      if (response.ok) {
        setAlunosPersonal(prev => prev.map(a => a.id === id || a._id === id ? { ...a, statusConta: novoStatus } : a));
      }
    } catch { alert("Erro."); }
  };

  const atualizarBiometriaAluno = async (e) => {
    e.preventDefault();
    setIsRecalculando(true);
    const alunoId = alunoEditandoPerfil.id || alunoEditandoPerfil._id;

    try {
      const response = await fetch(`${API_URL}/aluno/${alunoId}/atualizar-biometria`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Garante que os números são processados de forma limpa pro banco de dados
          ...alunoEditandoPerfil,
          peso: parseNumeroSeguro(alunoEditandoPerfil.peso),
          altura: parseNumeroSeguro(alunoEditandoPerfil.altura),
          idade: parseInt(alunoEditandoPerfil.idade) || 0,
          meta: alunoEditandoPerfil.objetivo,
          objetivo: alunoEditandoPerfil.objetivo,
          genero: alunoEditandoPerfil.genero,
          nivel: alunoEditandoPerfil.nivel,
          diasTreino: alunoEditandoPerfil.diasTreino,
          restricoes: alunoEditandoPerfil.restricoes,
          lesoes: alunoEditandoPerfil.lesoes,
          medidas: alunoEditandoPerfil.medidas || {}
        })
      });

      if (response.ok) {
        const alunoAtualizado = await response.json();
        setAlunosPersonal(prev => prev.map(a => (a.id === alunoId || a._id === alunoId) ? alunoAtualizado : a));
        alert(`✅ Ficha de ${alunoAtualizado.nome} atualizada na IA.`);
        setAlunoEditandoPerfil(null);
      } else { alert("Erro ao recriar plano."); }
    } catch { alert("Erro de conexão com a IA."); }
    finally { setIsRecalculando(false); }
  };

  const abrirGeradorTreino = (aluno) => {
    setAlunoEmEdicao(aluno);
    if (aluno.treinoSemanal && aluno.treinoSemanal.length > 0) {
      setTreinoForm(aluno.treinoSemanal);
    } else {
      const structure = DIAS_SEMANA.map(dia => ({ dia, exercicios: dia === "Segunda" ? (aluno.treinoPrescrito || []) : [] }));
      setTreinoForm(structure);
    }
    setDietaForm(aluno.dietaPrescrita || []);
    setAguaForm(aluno.metaAgua || "");
    setDiaAbaPersonal("Segunda");
  };

  const adicionarExercicioForm = () => setTreinoForm(prev => prev.map(diaObj => diaObj.dia === diaAbaPersonal ? { ...diaObj, exercicios: [...diaObj.exercicios, { nome: "", series: 4, reps: "10", obs: "" }] } : diaObj));
  const removerExercicioForm = (indexExercicio) => setTreinoForm(prev => prev.map(diaObj => diaObj.dia === diaAbaPersonal ? { ...diaObj, exercicios: diaObj.exercicios.filter((_, i) => i !== indexExercicio) } : diaObj));
  const handleExercicioChange = (indexExercicio, campo, valor) => setTreinoForm(prev => prev.map(diaObj => { if (diaObj.dia === diaAbaPersonal) { const novosExercicios = [...diaObj.exercicios]; novosExercicios[indexExercicio][campo] = valor; return { ...diaObj, exercicios: novosExercicios }; } return diaObj; }));

  const adicionarDietaForm = () => setDietaForm([...dietaForm, { refeicao: "", itens: "" }]);
  const removerDietaForm = (index) => setDietaForm(dietaForm.filter((_, i) => i !== index));
  const handleDietaChange = (index, campo, valor) => { const novaDieta = [...dietaForm]; novaDieta[index][campo] = valor; setDietaForm(novaDieta); };

  const salvarTreinoPersonal = async (e) => {
    e.preventDefault();
    const alunoId = alunoEmEdicao.id || alunoEmEdicao._id;
    try {
      const response = await fetch(`${API_URL}/aluno/${alunoId}/prescrever`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ treinoSemanal: treinoForm, dietaPrescrita: dietaForm, metaAgua: aguaForm })
      });
      if (response.ok) {
        setAlunosPersonal(prev => prev.map(a => (a.id === alunoId || a._id === alunoId) ? { ...a, statusTreino: "Enviado", treinoSemanal: treinoForm, dietaPrescrita: dietaForm, metaAgua: aguaForm } : a));
        alert(`Plano Semanal aplicado para ${alunoEmEdicao.nome}!`);
        setAlunoEmEdicao(null);
      }
    } catch { alert("Erro de conexão ao salvar plano."); }
  };

  const deletarAluno = async (id) => {
    if (!confirm("Remover este aluno de forma permanente?")) return;
    try {
      const response = await fetch(`${API_URL}/aluno/${id}`, { method: "DELETE" });
      if (response.ok) setAlunosPersonal(prev => prev.filter(a => a.id !== id && a._id !== id));
    } catch { alert("Erro ao deletar aluno."); }
  };

  const handleLoginAluno = async (e) => {
    e.preventDefault();
    const termoBusca = codigoAcessoAluno.trim();
    try {
      const response = await fetch(`${API_URL}/aluno/login?nome=${encodeURIComponent(termoBusca)}`);
      if (response.ok) {
        const alunoEncontrado = await response.json();
        if (alunoEncontrado.statusConta === "Off") return alert("Acesso suspenso! Entre em contato com seu Personal Trainer.");
        setAlunoLogado(alunoEncontrado);
        setExerciciosConcluidos([]);
        setEtapa("aluno");
      } else { alert("Aluno não encontrado na assessoria."); }
    } catch { alert("Erro ao conectar."); }
  };

  const alternarConclusaoExercicio = (chaveUnica) => {
    if (exerciciosConcluidos.includes(chaveUnica)) setExerciciosConcluidos(exerciciosConcluidos.filter(id => id !== chaveUnica));
    else setExerciciosConcluidos([...exerciciosConcluidos, chaveUnica]);
  };

  const iniciarCheckin = () => {
    const hojeObj = new Date();
    const dataFormatada = hojeObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    const jaFezCheckin = alunoLogado.checkins?.some(c => c.data === dataFormatada);

    if (jaFezCheckin) return alert("Check-in de hoje já foi computado! Descanse, guerreiro.");
    setModalFeedbackAberto(true);
  };

  const confirmarCheckinComFeedback = async (e) => {
    e.preventDefault();
    const hojeObj = new Date();
    const dataFormatada = hojeObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    const diaSemanaFormatado = hojeObj.toLocaleDateString("pt-BR", { weekday: 'long' }).charAt(0).toUpperCase() + hojeObj.toLocaleDateString("pt-BR", { weekday: 'long' }).slice(1);

    const novoCheckin = { data: dataFormatada, diaSemana: diaSemanaFormatado, feedback: feedbackTreino };
    const alunoId = alunoLogado.id || alunoLogado._id;

    try {
      const response = await fetch(`${API_URL}/aluno/${alunoId}/checkin`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoCheckin)
      });
      if (response.ok) {
        setAlunoLogado(prev => ({ ...prev, checkins: [novoCheckin, ...(prev.checkins || [])] }));
        setModalFeedbackAberto(false);
        setFeedbackTreino({ intensidade: "Moderado 🟡", carga: "Na medida ✅", comentario: "" });
        alert("🔥 Check-in e Feedback enviados!");
      }
    } catch { alert("Erro ao enviar check-in."); }
  };

  const salvarOnboarding = async (e) => {
    e.preventDefault();
    if (!perfil.nome || !perfil.peso || !perfil.altura || !perfil.idade) { alert("Preencha todos os campos!"); return; }
    try {
      const response = await fetch(`${API_URL}/usuarios/atualizar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: usuario,
          nome: perfil.nome,
          peso: parseNumeroSeguro(perfil.peso),
          altura: parseNumeroSeguro(perfil.altura),
          meta: perfil.meta,
          idade: parseInt(perfil.idade) || 0,
          genero: perfil.genero,
          nivel: perfil.nivel,
          diasTreino: perfil.diasTreino,
          restricoes: perfil.restricoes,
          lesoes: perfil.lesoes
        })
      });
      if (response.ok) {
        const saude = calcularSaude(perfil.peso, perfil.altura, perfil.idade);
        setPerfil(prev => ({ ...prev, ...saude }));
        setEtapa("home");
      }
    } catch { alert("Erro de conexão."); }
  };

  if (etapa === "verificando") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Sincronizando Seu Perfil...</div>
      </div>
    );
  }

  if (etapa === "login") return <Login aoLogar={handleLogin} />;

  if (etapa === "triagem") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-white font-sans z-50 bg-[#0d0e12] bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

        <div className="relative z-10 w-full max-w-sm bg-[#16171d]/80 border border-neutral-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <div className="flex justify-center mb-8">
            <img src="/logo512.png" alt="Logo Treino Fit" className="h-20 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
          </div>
          <div className="space-y-4">
            <button type="button" onClick={() => setEtapa(usuario ? "home" : "login")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-emerald-500/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
              <div>
                <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-0.5">Módulo Consultoria</p>
                <p className="text-sm font-bold text-neutral-200">Acessar Chat Inteligência Artificial</p>
              </div>
              <span className="text-neutral-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
            </button>
            <button type="button" onClick={() => setEtapa("login_personal")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-neutral-400/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
              <div>
                <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest mb-0.5">Módulo Treinador</p>
                <p className="text-sm font-bold text-neutral-200">Painel Geral do Personal Trainer</p>
              </div>
              <span className="text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
            </button>
            <button type="button" onClick={() => setEtapa("login_aluno")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-blue-500/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
              <div>
                <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-0.5">Módulo Aluno</p>
                <p className="text-sm font-bold text-neutral-200">Portal de Planilhas e Treinos Pro</p>
              </div>
              <span className="text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (etapa === "login_personal") {
    const GOOGLE_CLIENT_ID = "588566756758-75ic5m03ser1af56tr26gkeenh8qn9nc.apps.googleusercontent.com";
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50">
          <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl">
            {!googleUser ? (
              <>
                <h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Acesso Técnico</h2>
                <p className="text-neutral-500 text-xs mb-8">Autentique-se com sua conta Google profissional.</p>
                <div className="flex justify-center mb-6">
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Falha no Login')} theme="filled_black" text="continue_with" />
                </div>
                <button type="button" onClick={() => setEtapa("triagem")} className="w-full bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl text-xs uppercase tracking-wider text-neutral-400 transition-colors font-bold">Voltar</button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <img src={googleUser.foto} alt="Perfil" className="w-10 h-10 rounded-full border border-emerald-500" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">{googleUser.nome}</h2>
                    <p className="text-[10px] text-emerald-500 font-mono">Autenticação Concluída</p>
                  </div>
                </div>
                <p className="text-neutral-400 text-[11px] mb-5 leading-relaxed">Este é o seu primeiro acesso. Para ativar a sua licença no sistema Treino Fit, insira o seu registo profissional.</p>
                <form onSubmit={handleCadastrarCref} className="space-y-4">
                  <input required type="text" placeholder="Registro CREF " className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={cref} onChange={(e) => setCref(e.target.value)} />
                  <div className="flex gap-3 text-xs font-bold">
                    <button type="button" onClick={() => setGoogleUser(null)} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Cancelar</button>
                    <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Validar Licença</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  if (etapa === "login_aluno") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50">
        <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Portal do Aluno</h2><p className="text-neutral-500 text-xs mb-5">Insira o código de acesso fornecido pelo seu Personal.</p>
          <form onSubmit={handleLoginAluno} className="space-y-4">
            <input required type="text" placeholder="Código de Acesso (Ex: Nome Completo)" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={codigoAcessoAluno} onChange={(e) => setCodigoAcessoAluno(e.target.value)} />
            <div className="flex gap-3 text-xs font-bold"><button type="button" onClick={() => setEtapa("triagem")} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Voltar</button><button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Entrar</button></div>
          </form>
        </div>
      </div>
    );
  }

  if (etapa === "personal") {
    const hojeDataStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

    return (
      <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-4 md:p-6 overflow-y-auto font-sans z-40">
        <header className="w-full max-w-5xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo192.png" alt="Ícone Treino Fit" className="w-8 h-8 rounded" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">{personalLogado?.nome}</h2>
              <p className="text-[10px] text-neutral-500 font-mono">{personalLogado?.cref} • {personalLogado?.assinaturaAtiva ? "Licença PRO Ativa" : "Modo Teste Grátis"}</p>
            </div>
          </div>
          <button type="button" onClick={handleSair} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 text-[10px] text-neutral-400 font-bold uppercase transition-colors">Sair</button>
        </header>

        <main className="w-full max-w-5xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
          <div className="md:col-span-1 bg-[#16171d] border border-neutral-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Métricas da Assessoria</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-white">{alunosPersonal.length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Alunos</p></div>
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-amber-500">{alunosPersonal.filter(a => a.statusTreino === "Rascunho IA").length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Alertas IA</p></div>
              <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg"><p className="text-xl font-semibold text-neutral-400">{alunosPersonal.filter(a => a.statusConta === "Off").length}</p><p className="text-[9px] uppercase tracking-wide text-neutral-500 mt-1">Inativos</p></div>
            </div>
            {!personalLogado?.assinaturaAtiva && (
              <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-center">
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Teste Ativo: {alunosPersonal.length}/2 Alunos</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-[#16171d] border border-neutral-800 rounded-xl p-4 md:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Carteira de Clientes</h3>
              <div className="flex gap-2">
                <button type="button" onClick={carregarAlunosAssessoria} className="bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg border border-neutral-700">🔄 Atualizar</button>

                <button type="button" onClick={() => {
                  if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                    return setModalPlanosPersonal(true);
                  }
                  const link = `${window.location.origin}?ref=${personalLogado?._id}`;
                  navigator.clipboard.writeText(link);
                  alert(`🔗 Link copiado com sucesso!\n\nEnvie este link no WhatsApp do seu aluno:\n\n${link}`);
                }} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg">🔗 Link IA</button>

                <button type="button" onClick={() => {
                  if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                    return setModalPlanosPersonal(true);
                  }
                  setModalNovoAluno(true);
                }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg">+ Novo Manual</button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-wider">
                    <th className="pb-3 font-semibold">Nome do Aluno</th><th className="pb-3 font-semibold">Objetivo</th><th className="pb-3 font-semibold">Status Planilha</th><th className="pb-3 font-semibold">Último Treino</th><th className="pb-3 font-semibold text-right">Ações Gerenciais</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-neutral-800/40">
                  {alunosPersonal.map((aluno) => {
                    const idUnico = aluno.id || aluno._id;
                    const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);
                    return (
                      <tr key={idUnico} className={`hover:bg-neutral-800/20 transition-colors ${aluno.statusConta === 'Off' ? 'opacity-40' : ''}`}>
                        <td className="py-3.5 font-medium text-white">
                          <div className="cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1" onClick={() => setAlunoVerFeedback(aluno)}>
                            {aluno.nome} <span className="text-[10px] opacity-50">ℹ️</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{aluno.whatsapp}</div>
                        </td>
                        <td className="py-3.5 text-neutral-400">{aluno.objetivo}</td>
                        <td className="py-3.5"><span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>{aluno.statusTreino}</span></td>
                        <td className="py-3.5">
                          {checkinDeHoje ? (
                            <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse hover:bg-emerald-500/20 transition-colors cursor-pointer">
                              🔥 Treinou Hoje!
                            </button>
                          ) : aluno.checkins && aluno.checkins.length > 0 ? (
                            <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer">
                              Check-in: {aluno.checkins[0].data}
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-600 font-mono">Nenhum treino</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          {/* 🔥 AQUI PREPARAMOS OS DADOS PARA NÃO IR EM BRANCO PRO FORMULÁRIO 🔥 */}
                          <button type="button" onClick={() => setAlunoEditandoPerfil({
                            ...aluno,
                            peso: aluno.peso || "",
                            altura: aluno.altura || "",
                            idade: aluno.idade || "",
                            genero: aluno.genero || "Masculino",
                            objetivo: aluno.objetivo || "Emagrecimento",
                            nivel: aluno.nivel || "Intermediário",
                            diasTreino: aluno.diasTreino || "5",
                            restricoes: aluno.restricoes || "",
                            lesoes: aluno.lesoes || "",
                            medidas: aluno.medidas || {}
                          })} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase mr-1">Editar Perfil</button>
                          <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusTreino === "Rascunho IA" ? "Revisar IA" : "Montar Semanal"}</button>
                          <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className="border border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusConta === "Ativo" ? "Arquivar" : "Ativar"}</button>
                          <button type="button" onClick={() => deletarAluno(idUnico)} className="text-red-500/70 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 rounded font-bold text-[9px] py-1 px-2 uppercase">Excluir</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col space-y-4">
              {alunosPersonal.map((aluno) => {
                const idUnico = aluno.id || aluno._id;
                const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);
                return (
                  <div key={idUnico} className={`bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl flex flex-col space-y-3 ${aluno.statusConta === 'Off' ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-sm cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1" onClick={() => setAlunoVerFeedback(aluno)}>
                          {aluno.nome} <span className="text-[10px] opacity-50">ℹ️</span>
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{aluno.whatsapp}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase text-center ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>
                        {aluno.statusTreino}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#16171d] p-2.5 rounded-lg border border-neutral-800/50">
                      <div>
                        <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Objetivo</p>
                        <p className="text-xs text-neutral-300 truncate">{aluno.objetivo}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Último Treino</p>
                        {checkinDeHoje ? (
                          <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse cursor-pointer">
                            🔥 Hoje!
                          </button>
                        ) : aluno.checkins && aluno.checkins.length > 0 ? (
                          <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-mono text-neutral-400 cursor-pointer">
                            {aluno.checkins[0].data}
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-600 font-mono">Nenhum</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setAlunoEditandoPerfil({
                        ...aluno,
                        peso: aluno.peso || "",
                        altura: aluno.altura || "",
                        idade: aluno.idade || "",
                        genero: aluno.genero || "Masculino",
                        objetivo: aluno.objetivo || "Emagrecimento",
                        nivel: aluno.nivel || "Intermediário",
                        diasTreino: aluno.diasTreino || "5",
                        restricoes: aluno.restricoes || "",
                        lesoes: aluno.lesoes || "",
                        medidas: aluno.medidas || {}
                      })} className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-bold py-2 rounded transition-colors uppercase text-center mb-1">
                        ✏️ Editar Perfil do Aluno
                      </button>

                      <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 rounded transition-colors uppercase flex-1 shadow-lg text-center">
                        {aluno.statusTreino === "Rascunho IA" ? "Revisar IA" : "Editar Plano"}
                      </button>
                      <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className="border border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-[10px] font-bold py-2 rounded transition-colors uppercase flex-1 text-center">
                        {aluno.statusConta === "Ativo" ? "Arquivar" : "Ativar"}
                      </button>
                      <button type="button" onClick={() => deletarAluno(idUnico)} className="text-red-500/70 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 rounded font-bold text-[11px] py-2 px-3 uppercase transition-colors text-center">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* MODAL DETALHES DO FEEDBACK (RPE) PARA O PERSONAL */}
        {alunoVerFeedback && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAlunoVerFeedback(null)}>
            <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-3xl p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setAlunoVerFeedback(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>

              <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-xl">📋</div>
                <div>
                  <h3 className="font-bold text-white uppercase text-sm tracking-tight">Relatório de Treino</h3>
                  <p className="text-[10px] text-emerald-500 font-mono uppercase">{alunoVerFeedback.nome}</p>
                </div>
              </div>

              {alunoVerFeedback.checkins && alunoVerFeedback.checkins.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {alunoVerFeedback.checkins.slice(0, 3).map((checkin, index) => (
                    <div key={index} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-white uppercase">{checkin.data} - {checkin.diaSemana}</span>
                        {index === 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Último</span>}
                      </div>

                      {checkin.feedback ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-[#16171d] p-2 rounded-lg border border-neutral-800/50">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Intensidade</p>
                              <p className="text-xs text-white">{checkin.feedback.intensidade}</p>
                            </div>
                            <div className="bg-[#16171d] p-2 rounded-lg border border-neutral-800/50">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Carga</p>
                              <p className="text-xs text-white">{checkin.feedback.carga}</p>
                            </div>
                          </div>
                          {checkin.feedback.comentario && (
                            <div className="bg-[#16171d] p-3 rounded-lg border border-neutral-800/50">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Observações do Aluno</p>
                              <p className="text-xs text-neutral-300 italic">"{checkin.feedback.comentario}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 italic">Check-in simples (Sem feedback detalhado).</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-[#0d0e12] rounded-xl border border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase font-bold">Nenhum treino registrado ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: EDIÇÃO DE BIOMETRIA E RECÁLCULO IA */}
        {alunoEditandoPerfil && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => !isRecalculando && setAlunoEditandoPerfil(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>
              <h3 className="text-sm font-bold text-white uppercase mb-1">Editar Biometria</h3>
              <p className="text-[10px] text-neutral-400 mb-5">Altere os dados de <span className="text-emerald-400 font-bold">{alunoEditandoPerfil.nome}</span>. A IA irá recalcular tudo automaticamente.</p>

              <form onSubmit={atualizarBiometriaAluno} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Peso(kg)</label>
                    <input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.peso !== undefined ? alunoEditandoPerfil.peso : ""}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, peso: e.target.value })} disabled={isRecalculando} />
                  </div>
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Altura(m)</label>
                    <input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.altura !== undefined ? alunoEditandoPerfil.altura : ""}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, altura: e.target.value })} disabled={isRecalculando} />
                  </div>
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Idade</label>
                    <input required type="number" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.idade !== undefined ? alunoEditandoPerfil.idade : ""}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, idade: e.target.value })} disabled={isRecalculando} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Gênero</label>
                    <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.genero || "Masculino"}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, genero: e.target.value })} disabled={isRecalculando}>
                      <option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Objetivo</label>
                    <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.objetivo || "Emagrecimento"}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, objetivo: e.target.value })} disabled={isRecalculando}>
                      <option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Nível</label>
                    <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.nivel || "Intermediário"}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, nivel: e.target.value })} disabled={isRecalculando}>
                      <option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Dias Treino</label>
                    <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                      value={alunoEditandoPerfil.diasTreino || "5"}
                      onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, diasTreino: e.target.value })} disabled={isRecalculando}>
                      <option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
                    </select>
                  </div>
                </div>

                <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Restrições Alimentares</label><input type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.restricoes || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, restricoes: e.target.value })} disabled={isRecalculando} /></div>
                <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Lesões ou Dores</label><input type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.lesoes || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, lesoes: e.target.value })} disabled={isRecalculando} /></div>

                {/* 🔥 BLOCO DE MEDIDAS COMPLETAS 🔥 */}
                <div className="pt-3 border-t border-neutral-800 mt-4 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-3">📏 Perímetros Corporais (cm)</p>

                  {/* Tronco */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Pescoço</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.pescoco || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), pescoco: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Tórax</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.torax || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), torax: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Cintura</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.cintura || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), cintura: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Abdômen</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.abdomen || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), abdomen: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Quadril</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.quadril || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), quadril: e.target.value } })} disabled={isRecalculando} /></div>
                  </div>

                  {/* Membros Superiores */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Braço Dir. (Relx)</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.bracoDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), bracoDir: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Braço Esq. (Relx)</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.bracoEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), bracoEsq: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Antebraço Dir.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.antebracoDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), antebracoDir: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Antebraço Esq.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.antebracoEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), antebracoEsq: e.target.value } })} disabled={isRecalculando} /></div>
                  </div>

                  {/* Membros Inferiores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Coxa Méd. Dir.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.coxaDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), coxaDir: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Coxa Méd. Esq.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.coxaEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), coxaEsq: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Panturrilha Dir.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.panturrilhaDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), panturrilhaDir: e.target.value } })} disabled={isRecalculando} /></div>
                    <div><label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Panturrilha Esq.</label><input type="number" step="0.1" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={alunoEditandoPerfil.medidas?.panturrilhaEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), panturrilhaEsq: e.target.value } })} disabled={isRecalculando} /></div>
                  </div>
                </div>

                <button type="submit" disabled={isRecalculando} className={`w-full p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg mt-4 transition-all ${isRecalculando ? 'bg-emerald-600/50 text-white/50 cursor-not-allowed animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                  {isRecalculando ? "🤖 Recalculando na IA..." : "Salvar e Recalcular na IA"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NOVO ALUNO MANUAL */}
        {modalNovoAluno && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase mb-4">Cadastrar Novo Aluno</h3>
              <form onSubmit={cadastrarNovoAluno} className="space-y-4">
                <div><label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Nome Completo</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={novoAlunoForm.nome} onChange={e => setNovoAlunoForm({ ...novoAlunoForm, nome: e.target.value })} /></div>
                <div><label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">WhatsApp (DDD + Número)</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={novoAlunoForm.whatsapp} onChange={e => setNovoAlunoForm({ ...novoAlunoForm, whatsapp: e.target.value })} /></div>
                <div><label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Objetivo Inicial</label>
                  <select className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={novoAlunoForm.objetivo} onChange={e => setNovoAlunoForm({ ...novoAlunoForm, objetivo: e.target.value })}>
                    <option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2"><button type="button" onClick={() => setModalNovoAluno(false)} className="w-1/3 bg-transparent border border-neutral-800 text-neutral-400 text-xs font-bold p-2.5 rounded-lg uppercase transition-colors hover:bg-neutral-800">Cancelar</button><button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold p-2.5 rounded-lg uppercase shadow-lg transition-colors">Gerar Código</button></div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PRESCREVER TREINO MANUAL */}
        {alunoEmEdicao && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <header className="p-4 md:p-5 border-b border-neutral-800 flex justify-between items-center bg-[#1c1d26]"><div><span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">Prescrevendo Plano Pro</span><h3 className="text-base font-bold text-white uppercase">{alunoEmEdicao.nome}</h3></div><button type="button" onClick={() => setAlunoEmEdicao(null)} className="text-neutral-400 hover:text-white text-sm uppercase font-mono font-bold">Fechar ✕</button></header>
              <form onSubmit={salvarTreinoPersonal} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

                <div className="bg-[#0d0e12] p-4 rounded-xl border border-blue-500/20">
                  <label className="text-[10px] uppercase font-bold text-blue-400 block mb-2">💧 Meta de Hidratação Diária (Calculada pela IA)</label>
                  <input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-sm text-white font-bold" value={aguaForm} onChange={(e) => setAguaForm(e.target.value)} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 border-b border-neutral-800/60 pb-2">Estrutura de Exercícios Semanal</p>

                  <div className="flex gap-2 overflow-x-auto pb-2 border-b border-neutral-800/40 mb-4">
                    {DIAS_SEMANA.map(dia => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => setDiaAbaPersonal(dia)}
                        className={`px-4 py-2 rounded-t-lg text-[10px] font-bold uppercase transition-all flex-shrink-0 ${diaAbaPersonal === dia
                          ? 'bg-neutral-800/50 border-b-2 border-emerald-500 text-emerald-500'
                          : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Treino de {diaAbaPersonal}</p>
                    <button type="button" onClick={adicionarExercicioForm} className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-emerald-600/20 transition-all uppercase">+ Exercício</button>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      const diaObj = treinoForm.find(d => d.dia === diaAbaPersonal) || { exercicios: [] };
                      if (diaObj.exercicios.length === 0) {
                        return <p className="text-xs text-neutral-500 italic text-center py-4 bg-[#0d0e12] rounded-xl border border-neutral-800">Nenhum exercício cadastrado.</p>;
                      }

                      return diaObj.exercicios.map((ex, idx) => (
                        <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl space-y-3 relative group">
                          <button type="button" onClick={() => removerExercicioForm(idx)} className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 text-[10px] uppercase font-mono tracking-wider transition-colors">Remover</button>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 sm:pt-0">
                            <div className="sm:col-span-1"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Movimento</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.nome} onChange={(e) => handleExercicioChange(idx, "nome", e.target.value)} /></div>
                            <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Séries</label><input required type="number" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.series} onChange={(e) => handleExercicioChange(idx, "series", Number(e.target.value))} /></div>
                            <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Repetições/Tempo</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.reps} onChange={(e) => handleExercicioChange(idx, "reps", e.target.value)} /></div>
                          </div>
                          <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Observação</label><input type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.obs || ""} onChange={(e) => handleExercicioChange(idx, "obs", e.target.value)} /></div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800/60">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800/60 mb-3"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Planejamento Nutricional</p><button type="button" onClick={adicionarDietaForm} className="bg-blue-600/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-blue-600/20 transition-all uppercase">+ Refeição</button></div>
                  <div className="space-y-3">
                    {dietaForm.map((ref, idx) => (
                      <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl flex flex-col sm:flex-row gap-3 relative sm:items-center">
                        <div className="w-full sm:w-1/3"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Horário/Refeição</label><input required type="text" placeholder="Ex: Almoço" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ref.refeicao} onChange={(e) => handleDietaChange(idx, "refeicao", e.target.value)} /></div>
                        <div className="w-full sm:w-2/3"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Alimentos e Gramas</label><input required type="text" placeholder="Ex: 100g Frango" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ref.itens} onChange={(e) => handleDietaChange(idx, "itens", e.target.value)} /></div>
                        <button type="button" onClick={() => removerDietaForm(idx)} className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 font-bold text-sm ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="pt-4 border-t border-neutral-800 flex gap-3 justify-end text-xs font-bold"><button type="button" onClick={() => setAlunoEmEdicao(null)} className="bg-transparent border border-neutral-800 text-neutral-400 p-3 rounded-xl uppercase tracking-wider hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg px-6">Salvar e Enviar</button></footer>
              </form>
            </div>
          </div>
        )}

        {/* ✅ TELA DE BLOQUEIO DE PLANOS DA KIWIFY */}
        {modalPlanosPersonal && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#16171d] border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] relative text-center">
              <button onClick={() => setModalPlanosPersonal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>

              <span className="text-4xl block mb-2">🔒</span>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1">Limite do Teste Atingido</h3>
              <p className="text-neutral-400 text-xs mb-6">Você já possui {alunosPersonal.length} alunos cadastrados. Ative a licença PRO para ter alunos ilimitados + Inteligência Artificial.</p>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <a href={KIWIFY_MENSAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border border-neutral-800 hover:border-emerald-500/50 p-5 rounded-2xl flex items-center justify-between transition-all group text-left">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Plano Mensal Recorrente</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Cancele quando quiser</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400">R$ 49,90</p>
                    <p className="text-[9px] text-neutral-500 uppercase font-mono">/mês</p>
                  </div>
                </a>

                <a href={KIWIFY_ANUAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border-2 border-emerald-500/30 hover:border-emerald-500 p-5 rounded-2xl flex items-center justify-between transition-all relative text-left group">
                  <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">Melhor Custo-Benefício</span>
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Plano Anual Elite</p>
                    <p className="text-[10px] text-emerald-500 mt-1">Economize mais de 30%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400">R$ 399,00</p>
                    <p className="text-[9px] text-neutral-500 uppercase font-mono">Equivale a R$ 33,25/mês</p>
                  </div>
                </a>
              </div>
              <p className="text-[9px] text-neutral-500 uppercase font-mono">Liberação automática após o pagamento.</p>
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
          <div>
            <p className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider">Consultoria Privada Treino Fit</p>
            <h2 className="text-md font-bold text-white uppercase tracking-tight">{alunoLogado?.nome}</h2>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Objetivo: {alunoLogado?.objetivo}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setModalAvaliacaoAluno(true)} className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1">
              📋 Avaliação
            </button>
            <button type="button" onClick={() => { setEtapa("triagem"); setAlunoLogado(null); }} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition-colors">
              Sair
            </button>
          </div>
        </header>

        <main className="w-full max-w-md mx-auto flex-1 space-y-6 pb-10">
          <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Check-ins Validados</p><h3 className="text-3xl font-bold text-white mt-1">{alunoLogado?.checkins?.length || 0}</h3></div>
            <button type="button" onClick={iniciarCheckin} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg">Confirmar Treino Hoje</button>
          </div>

          {alunoLogado?.metaAgua && (
            <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl shadow-xl flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">💧 Hidratação Diária</p><h3 className="text-xl font-bold text-white mt-1">{alunoLogado.metaAgua}</h3></div>
              <span className="text-3xl">🚰</span>
            </div>
          )}

          {alunoLogado?.dietaPrescrita && alunoLogado.dietaPrescrita.length > 0 && (
            <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">🍽️ Seu Plano Alimentar</p>
              <div className="space-y-2">
                {alunoLogado.dietaPrescrita.map((ref, idx) => (
                  <div key={idx} className="bg-[#0d0e12] border border-neutral-850 p-3 rounded-lg">
                    <p className="text-[11px] font-bold text-white tracking-tight uppercase mb-1">{ref.refeicao}</p>
                    <p className="text-[10px] text-neutral-400">{ref.itens}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Calendário de Treinos Semanal</p>

            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {DIAS_SEMANA.map((dia) => {
                const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
                const ehHoje = diaAtualSistema.toLowerCase().includes(dia.toLowerCase().slice(0, 4));
                const ativo = diaAbaAluno === dia;

                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => setDiaAbaAluno(dia)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all flex-shrink-0 border ${ativo
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                      : ehHoje
                        ? 'bg-neutral-900 border-blue-500/40 text-blue-400'
                        : 'bg-[#16171d] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                  >
                    {dia.slice(0, 3)} {ehHoje && "•"}
                  </button>
                );
              })}
            </div>

            {(() => {
              const rotinaDoDia = alunoLogado?.treinoSemanal?.find(t => t.dia === diaAbaAluno);

              if (!rotinaDoDia || !rotinaDoDia.exercicios || rotinaDoDia.exercicios.length === 0) {
                return (
                  <div className="bg-[#16171d] border border-neutral-800 p-8 rounded-xl text-center shadow-xl">
                    <p className="text-xs text-neutral-500 font-semibold uppercase font-mono">Nenhum treino para {diaAbaAluno}. Descanso! 🧘‍♂️</p>
                  </div>
                );
              }

              return rotinaDoDia.exercicios.map((ex, i) => {
                const chaveUnica = `${diaAbaAluno}-${i}`;
                const estaconcluido = exerciciosConcluidos.includes(chaveUnica);
                return (
                  <div key={i} className={`bg-[#16171d] border transition-all rounded-xl overflow-hidden shadow-xl ${estaconcluido ? 'border-blue-500/30 opacity-60' : 'border-neutral-800'}`}>
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className={`font-bold uppercase text-base tracking-tight text-white ${estaconcluido ? 'line-through text-neutral-500' : ''}`}>{ex.nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded">{ex.series} Séries × {ex.reps} Reps</span>
                          <button type="button" onClick={() => abrirExercicioVisual(ex, setModalGifAberto)} className="bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase border border-neutral-700">
                            ▶ Ver GIF
                          </button>
                        </div>
                        {ex.obs && <p className="text-xs text-neutral-400 mt-2 bg-[#0d0e12] border border-neutral-800 p-2 rounded-lg font-sans">📌 Obs: {ex.obs}</p>}
                      </div>
                      <button type="button" onClick={() => alternarConclusaoExercicio(chaveUnica)} className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-xs transition-colors ${estaconcluido ? 'bg-blue-600 border-blue-500 text-white' : 'border-neutral-700 bg-transparent text-transparent hover:border-neutral-500'}`}>✓</button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {modalGifAberto && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalGifAberto(null)}>
              <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setModalGifAberto(null)} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors">✕</button>
                <div className="p-4 bg-[#1c1d26] border-b border-neutral-800">
                  <h3 className="font-bold text-white uppercase text-sm pr-8">{modalGifAberto.nome}</h3>
                </div>
                <div className="w-full bg-[#0d0e12] flex justify-center p-4 min-h-[200px] items-center">
                  <img src={modalGifAberto.url} alt={modalGifAberto.nome} className="max-w-full rounded-lg shadow-lg border border-neutral-800" />
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE FEEDBACK PÓS-TREINO (RPE) */}
          {modalFeedbackAberto && (
            <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalFeedbackAberto(false)}>
              <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setModalFeedbackAberto(false)} className="absolute top-4 right-4 text-neutral-500 font-bold hover:text-white">✕</button>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">🔥</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Treino Concluído!</h3>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">Dê o feedback para seu treinador</p>
                </div>

                <form onSubmit={confirmarCheckinComFeedback} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">Qual foi a Intensidade?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Leve 🟢", "Moderado 🟡", "Intenso 🔴", "Extremo ☠️"].map(nivel => (
                        <button key={nivel} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, intensidade: nivel })} className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${feedbackTreino.intensidade === nivel ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-[#0d0e12] border border-neutral-800 text-neutral-500'}`}>
                          {nivel.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">E os Pesos / Cargas?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Pouca ⬇️", "Na medida ✅", "Pesado ⬆️"].map(peso => (
                        <button key={peso} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, carga: peso })} className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${feedbackTreino.carga === peso ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-[#0d0e12] border border-neutral-800 text-neutral-500'}`}>
                          {peso.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">Observações (Opcional)</label>
                    <textarea
                      placeholder="Observações de hoje..."
                      className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-xs text-white outline-none h-20 resize-none"
                      value={feedbackTreino.comentario}
                      onChange={e => setFeedbackTreino({ ...feedbackTreino, comentario: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg mt-2">
                    Enviar e Registrar Check-in
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 🔥 NOVO: MODAL "MINHA AVALIAÇÃO" NO PORTAL DO ALUNO 🔥 */}
          {modalAvaliacaoAluno && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalAvaliacaoAluno(false)}>
              <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 rounded-3xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={() => setModalAvaliacaoAluno(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>

                <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                  <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xl">📊</div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm tracking-tight">Sua Avaliação Física</h3>
                    <p className="text-[10px] text-blue-400 font-mono uppercase">Histórico e Medidas</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Dados Básicos */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Perfil Biométrico</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                        <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Peso</p>
                        <p className="text-sm font-bold text-white">{alunoLogado?.peso ? alunoLogado.peso : '--'} kg</p>
                      </div>
                      <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                        <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Altura</p>
                        <p className="text-sm font-bold text-white">{alunoLogado?.altura ? alunoLogado.altura : '--'} m</p>
                      </div>
                      <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                        <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Idade</p>
                        <p className="text-sm font-bold text-white">{alunoLogado?.idade ? alunoLogado.idade : '--'} anos</p>
                      </div>
                      <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                        <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Gênero</p>
                        <p className="text-sm font-bold text-white">{alunoLogado?.genero ? alunoLogado.genero : '--'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações Extras */}
                  <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl space-y-3">
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase font-bold">Nível de Treino</p>
                      <p className="text-xs text-neutral-300 font-medium">{alunoLogado?.nivel ? alunoLogado.nivel : '--'}</p>
                    </div>
                    {alunoLogado?.restricoes && (
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase font-bold">Restrições Alimentares</p>
                        <p className="text-xs text-neutral-300">{alunoLogado.restricoes}</p>
                      </div>
                    )}
                    {alunoLogado?.lesoes && (
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase font-bold">Histórico de Lesões</p>
                        <p className="text-xs text-neutral-300">{alunoLogado.lesoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Perímetros Corporais (Só exibe se existir) */}
                  {alunoLogado?.medidas && Object.keys(alunoLogado.medidas).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-3 pt-2 border-t border-neutral-800">📏 Suas Medidas (cm)</p>

                      <div className="space-y-3">
                        <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold mb-2">Tronco</p>
                          <div className="grid grid-cols-2 gap-y-2 text-xs">
                            {alunoLogado.medidas.pescoco && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Pescoço:</span><span className="font-mono text-white">{alunoLogado.medidas.pescoco}</span></div>}
                            {alunoLogado.medidas.torax && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Tórax:</span><span className="font-mono text-white">{alunoLogado.medidas.torax}</span></div>}
                            {alunoLogado.medidas.cintura && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Cintura:</span><span className="font-mono text-white">{alunoLogado.medidas.cintura}</span></div>}
                            {alunoLogado.medidas.abdomen && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Abdômen:</span><span className="font-mono text-white">{alunoLogado.medidas.abdomen}</span></div>}
                            {alunoLogado.medidas.quadril && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Quadril:</span><span className="font-mono text-white">{alunoLogado.medidas.quadril}</span></div>}
                          </div>
                        </div>

                        <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold mb-2">Membros Superiores</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            {alunoLogado.medidas.bracoDir && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Braço Dir:</span><span className="font-mono text-white">{alunoLogado.medidas.bracoDir}</span></div>}
                            {alunoLogado.medidas.bracoEsq && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Braço Esq:</span><span className="font-mono text-white">{alunoLogado.medidas.bracoEsq}</span></div>}
                            {alunoLogado.medidas.antebracoDir && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Antebraço Dir:</span><span className="font-mono text-white">{alunoLogado.medidas.antebracoDir}</span></div>}
                            {alunoLogado.medidas.antebracoEsq && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Antebraço Esq:</span><span className="font-mono text-white">{alunoLogado.medidas.antebracoEsq}</span></div>}
                          </div>
                        </div>

                        <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                          <p className="text-[9px] text-neutral-500 uppercase font-bold mb-2">Membros Inferiores</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            {alunoLogado.medidas.coxaDir && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Coxa Dir:</span><span className="font-mono text-white">{alunoLogado.medidas.coxaDir}</span></div>}
                            {alunoLogado.medidas.coxaEsq && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Coxa Esq:</span><span className="font-mono text-white">{alunoLogado.medidas.coxaEsq}</span></div>}
                            {alunoLogado.medidas.panturrilhaDir && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Panturrilha Dir:</span><span className="font-mono text-white">{alunoLogado.medidas.panturrilhaDir}</span></div>}
                            {alunoLogado.medidas.panturrilhaEsq && <div className="flex justify-between border-b border-neutral-800/50 pb-1"><span className="text-neutral-400">Panturrilha Esq:</span><span className="font-mono text-white">{alunoLogado.medidas.panturrilhaEsq}</span></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  if (etapa === "home") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col overflow-hidden font-sans z-30">
        {abaAtiva === "home" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
            <header className="w-full max-w-4xl flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <img src="/logo192.png" alt="Ícone Treino Fit" className="w-8 h-8 rounded" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-tight">{perfil.nome}</h2>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Conta {isVip ? 'Premium Elite' : 'Free Tier'}</p>
                </div>
              </div>
              <button type="button" onClick={() => !isVip && setBloqueado(true)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase font-mono border ${isVip ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5 animate-pulse'}`}>{isVip ? "✓ Vip Ativado" : "Upgrade para Enterprise"}</button>
            </header>

            <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl">
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Composição Corporal</p>
                  <div className="grid grid-cols-2 gap-3"><div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Massa Global</span><span className="text-2xl font-semibold text-white">{perfil.peso}<span className="text-xs text-neutral-500 font-normal ml-0.5">kg</span></span></div><div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Estatura</span><span className="text-2xl font-semibold text-white">{perfil.altura}<span className="text-xs text-neutral-500 font-normal ml-0.5">m</span></span></div></div>
                  <div className="mt-3 text-[10px] text-neutral-400 font-mono flex justify-between border-t border-neutral-800/60 pt-2"><span>Planejamento:</span><span className="text-emerald-500 font-bold uppercase">{perfil.meta}</span></div>
                </div>
                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl text-center"><p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider text-left mb-4">Meta Metabólica Diária</p><div className="inline-flex flex-col items-center justify-center p-6 border border-neutral-800 bg-[#0d0e12] rounded-full w-28 h-28 mx-auto mb-4 border-t-emerald-600"><span className="text-xl font-bold text-white">{perfil.tmb}</span><span className="text-[9px] font-mono text-neutral-500 uppercase">kcal/dia</span></div></div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl"><p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">⚡ Diretriz Técnica Operacional</p><p className="text-xs font-medium text-neutral-300 leading-relaxed">"{perfil.nome}, seus parâmetros apontam foco em oxidação de gordura ativa. Otimize a ingestão proteinada."</p></div>
                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Terminais de Execução</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button type="button" onClick={() => setAbaAtiva("chat")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all shadow-lg">Abrir Chat IA & Consultoria</button><button type="button" onClick={() => setAbaAtiva("treino")} className="bg-transparent hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all">Acessar Biblioteca de Treinos</button></div>
                  <div className="text-center pt-3 border-t border-neutral-800/40"><button type="button" onClick={handleSair} className="text-[10px] font-mono uppercase text-neutral-600 hover:text-red-400 transition-colors">Encerrar sessão de dados</button></div>
                </div>
              </div>
            </main>
          </div>
        )}

        {abaAtiva === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden"><header className="p-4 flex items-center justify-between border-b border-neutral-800 bg-[#16171d]"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Voltar para o Dashboard</button><span className="text-[10px] font-mono uppercase text-neutral-500">Módulo Consultoria de Nutrição</span></header><ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} setTreinoIAPescado={setTreinoIAPescado} aoAtualizarPerfil={atualizarStatusVIP} /></div>
        )}

        {abaAtiva === "treino" && (
          <div className="flex-1 flex flex-col bg-[#0d0e12] p-6 overflow-y-auto">
            <header className="w-full max-w-4xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Retornar</button><span className="text-white font-bold uppercase text-xs tracking-wider">Módulo de Planilhas</span></header>
            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mx-auto"><button type="button" onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="bg-[#16171d] hover:bg-[#1e2029] border border-neutral-800 p-6 rounded-xl flex items-center justify-between transition-all text-left"><div><p className="font-bold uppercase text-sm text-white">Treino Inteligência Artificial</p><p className="text-[9px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">{!isVip ? "Status: Bloqueado corporativo" : "Acesso Elite Ativado"}</p></div><span className="text-xl">🤖</span></button><button type="button" onClick={() => setModalidadeAberta('academia')} className="bg-[#16171d] hover:bg-[#1e2029] border border-neutral-800 p-6 rounded-xl flex items-center justify-between transition-all text-left"><div><p className="font-bold uppercase text-sm text-white">Metodologia Tradicional (ABC)</p><p className="text-[9px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">Acesso Livre</p></div><span className="text-xl">🏋️‍♂️</span></button></div>
            {modalidadeAberta && <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />}
          </div>
        )}

        {bloqueado && <div className="fixed inset-0 z-[500] bg-[#0d0e12]/95 backdrop-blur-sm flex flex-col items-center p-6 overflow-y-auto"><button type="button" onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 w-8 h-8 rounded flex items-center justify-center text-xs">✕</button><TelaPlanos /></div>}
      </div>
    );
  }

  if (etapa === "matricula_externa") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50 overflow-y-auto">
        <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl my-auto">
          <div className="text-center mb-6"><span className="text-4xl mb-3 block">🤖</span><h2 className="text-lg font-bold uppercase tracking-tight text-emerald-500">Auto-Avaliação IA</h2><p className="text-neutral-400 text-[11px] mt-2">Preencha sua biometria para a Inteligência Artificial estruturar a base do seu treino e dieta.</p></div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setEtapa("verificando");
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const refPersonal = urlParams.get('ref');

              // Garante que o objeto vai redondinho pro banco sem strings com vírgula
              const payload = {
                ...perfil,
                peso: parseNumeroSeguro(perfil.peso),
                altura: parseNumeroSeguro(perfil.altura),
                idade: parseInt(perfil.idade) || 0,
                whatsapp: novoAlunoForm.whatsapp,
                objetivo: perfil.meta,
                personalRef: refPersonal
              };

              const res = await fetch(`${API_URL}/aluno/matricula-ia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (res.ok) { alert("🎉 Análise concluída! Sua ficha já está na mesa do Personal."); window.location.href = window.location.origin; }
              else { const data = await res.json(); alert(data.mensagem || "Erro na análise."); setEtapa("matricula_externa"); }
            } catch { alert("Erro de conexão."); setEtapa("matricula_externa"); }
          }} className="space-y-4">
            <input required type="text" placeholder="Nome Completo" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, nome: e.target.value })} />
            <input required type="text" placeholder="WhatsApp (Apenas Números)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setNovoAlunoForm({ ...novoAlunoForm, whatsapp: e.target.value })} />

            <div className="grid grid-cols-3 gap-3">
              <input required type="text" placeholder="Peso (kg)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, peso: e.target.value })} />
              <input required type="text" placeholder="Altura (m)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, altura: e.target.value })} />
              <input required type="number" placeholder="Idade" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, idade: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, genero: e.target.value })}>
                <option value="">Gênero Biológico</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
              </select>
              <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, meta: e.target.value })}>
                <option value="">Objetivo Principal</option><option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, nivel: e.target.value })}>
                <option value="">Nível de Treino</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
              </select>
              <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, diasTreino: e.target.value })}>
                <option value="">Dias de Treino/Semana</option><option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
              </select>
            </div>

            <input type="text" placeholder="Restrições Alimentares?" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, restricoes: e.target.value })} />
            <input type="text" placeholder="Lesões ou Dores?" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, lesoes: e.target.value })} />

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg mt-4 transition-all">⚡ Gerar Diagnóstico com IA</button>
          </form>
        </div>
      </div>
    );
  }

  if (etapa === "onboarding") {
    return (
      <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-8 text-white z-50 overflow-y-auto font-sans">
        <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl my-auto">
          <h2 className="text-md font-bold mb-1 uppercase tracking-tight text-neutral-200">Parâmetros Iniciais</h2><p className="text-neutral-500 text-xs mb-5">Monte seu perfil para a Inteligência Artificial.</p>
          <form onSubmit={salvarOnboarding} className="space-y-4">

            <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Nome Completo</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} /></div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Peso(kg)</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.peso} onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Altura(m)</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.altura} onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Idade</label><input required type="number" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.idade} onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Gênero</label>
                <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.genero} onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}>
                  <option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                </select>
              </div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Objetivo</label>
                <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.meta} onChange={(e) => setPerfil({ ...perfil, meta: e.target.value })}>
                  <option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Nível</label>
                <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.nivel} onChange={(e) => setPerfil({ ...perfil, nivel: e.target.value })}>
                  <option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                </select>
              </div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Dias Treino</label>
                <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.diasTreino} onChange={(e) => setPerfil({ ...perfil, diasTreino: e.target.value })}>
                  <option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
                </select>
              </div>
            </div>

            <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Restrições Alimentares?</label><input type="text" placeholder="Ex: Vegano, Sem Lactose..." className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.restricoes} onChange={(e) => setPerfil({ ...perfil, restricoes: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Lesões ou Dores?</label><input type="text" placeholder="Ex: Dor no Joelho, Lombar..." className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-neutral-700" value={perfil.lesoes} onChange={(e) => setPerfil({ ...perfil, lesoes: e.target.value })} /></div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs transition-colors shadow-lg mt-2">Salvar e Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return <div className="text-white text-center p-10 bg-[#0d0e12] min-h-screen">Layout carregando...</div>;
}

export default App;