import { useState, useEffect, useCallback, useRef } from "react";
import ListaExercicios from "./services/ListaExercicio";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

function App() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario_whatsapp"));
  const [etapa, setEtapa] = useState("verificando");
  const [abaAtiva, setAbaAtiva] = useState("home");
  const [isVip, setIsVip] = useState(false);
  const [treinoIAPescado, setTreinoIAPescado] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [modalidadeAberta, setModalidadeAberta] = useState(null);

  const [perfil, setPerfil] = useState({
    nome: "Guerreiro(a)", // Valor inicial padrão
    peso: "0",
    altura: "0",
    meta: "Emagrecimento",
    imc: "0",
    tmb: "0",
    faltam: "0"
  });

  const API_URL = "https://api-backend-treino-fit.onrender.com/api";
  const verificandoRef = useRef(false);

  const calcularSaude = useCallback((peso, altura) => {
    const p = parseFloat(peso) || 0;
    const a = parseFloat(altura) || 0;
    if (p > 0 && a > 0) {
      const imc = (p / (a * a)).toFixed(1);
      const tmb = (10 * p + (6.25 * (a * 100)) - (5 * 25)).toFixed(0);
      const falta = (p * 0.1).toFixed(1);
      return { imc, tmb, falta };
    }
    return { imc: "0", tmb: "0", falta: "0" };
  }, []);

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
          const saude = calcularSaude(dados.peso, dados.altura);
          setPerfil({
            nome: dados.nome || "Guerreiro(a)",
            peso: String(dados.peso),
            altura: String(dados.altura),
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
    } catch (err) {
      console.error("Erro de conexão:", err);
      setEtapa("onboarding");
    } finally {
      verificandoRef.current = false;
    }
  }, [API_URL, calcularSaude]);

  useEffect(() => {
    if (usuario) {
      if (etapa === "verificando") {
        sincronizarComBanco(usuario);
      }
    } else {
      setEtapa("login");
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
    window.location.reload();
  };

  const salvarOnboarding = async () => {
    if (!perfil.nome || !perfil.peso || !perfil.altura) {
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
          peso: perfil.peso,
          altura: perfil.altura,
          meta: perfil.meta,
          idade: perfil.idade // Enviando o novo dado
        })
      });

      if (response.ok) {
        const saude = calcularSaude(perfil.peso, perfil.altura);
        setPerfil(prev => ({ ...prev, ...saude }));
        setEtapa("home");
      } else {
        alert("Erro ao salvar. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão com o servidor.");
    }
  };

  if (etapa === "verificando") {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <div className="text-emerald-500 font-black italic tracking-widest animate-pulse">CALIBRANDO SEU SHAPE...</div>
      </div>
    );
  }

  if (etapa === "login") return <Login aoLogar={handleLogin} />;

  if (etapa === "onboarding") {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center p-8 text-white z-[999] overflow-y-auto">
        {/* BOTÃO VOLTAR ADICIONADO ABAIXO */}
        <button
          onClick={() => {
            localStorage.clear();
            setEtapa("login");
            setUsuario(null);
          }}
          className="absolute top-8 left-8 text-emerald-500 font-black text-[10px] uppercase flex items-center gap-2 hover:opacity-70 transition-all"
        >
          <span className="text-lg">←</span> Voltar
        </button>
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]">FIT</div>
        <h2 className="text-2xl font-black mb-2 uppercase italic text-emerald-500 text-center leading-tight">Construa seu Perfil</h2>
        <p className="text-gray-400 text-center text-sm mb-8 italic">O Mentor IA precisa desses dados para criar sua dieta expert.</p>

        <div className="w-full max-w-sm space-y-4">
          <input type="text" placeholder="Seu Nome" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500 transition-all" onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} />
          <div className="flex gap-4">
            {/* Adicione este input abaixo do input de Nome */}
            <input
              type="number"
              placeholder="Sua Idade"
              className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500 transition-all"
              onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })}
            />
            <input type="number" placeholder="Peso (kg)" className="w-1/2 bg-white/5 border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500 transition-all" onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} />
            <input type="number" placeholder="Altura (m)" className="w-1/2 bg-white/5 border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500 transition-all" onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} />
          </div>
          <select className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none focus:border-emerald-500" onChange={(e) => setPerfil({ ...perfil, meta: e.target.value })}>
            <option value="Emagrecimento">Meta: Emagrecimento</option>
            <option value="Hipertrofia">Meta: Hipertrofia</option>
          </select>
          <button onClick={salvarOnboarding} className="w-full bg-emerald-500 text-black font-black py-5 rounded-3xl uppercase shadow-lg active:scale-95 transition-all">Ativar Protocolo FIT →</button>
        </div>
      </div>

    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 text-white flex flex-col overflow-hidden font-sans">
      {abaAtiva === "home" && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          {/* Header Superior */}
          <header className="w-full max-w-md flex justify-between items-center mt-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black shadow-lg">FIT</div>
              <div className="text-left">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Atleta {isVip ? 'Premium' : 'Free'}</p>
                <h2 className="text-xl font-black uppercase tracking-tighter leading-none">{perfil.nome}</h2>
              </div>
            </div>
            <button onClick={() => !isVip && setBloqueado(true)} className={`px-4 py-2 rounded-2xl border ${isVip ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-orange-500 text-orange-500 animate-pulse'} text-[10px] font-black uppercase tracking-widest transition-all`}>
              {isVip ? "💎 VIP Ativo" : "⚡ Upgrade VIP"}
            </button>
          </header>

          <main className="w-full max-w-md flex flex-col items-center">
            {/* Gráfico de Progresso Central */}
            <div className="relative w-60 h-60 mb-6 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <circle cx="120" cy="120" r="100" stroke="#111827" strokeWidth="12" fill="transparent" />
                <circle cx="120" cy="120" r="100" stroke="#10b981" strokeWidth="12" fill="transparent" strokeDasharray="628" strokeDashoffset={628 - (628 * 0.80)} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-6xl font-black tracking-tighter leading-none">{perfil.faltam}</span>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1">Faltam para a meta</span>
              </div>
            </div>

            {/* Dashboard de Atleta (Peso e Altura) */}
            <div className="w-full mb-4 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex justify-between items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex gap-8">
                <div className="text-left">
                  <p className="text-emerald-500 font-black italic text-[11px] uppercase mb-1">Peso Atual</p>
                  <h3 className="text-4xl font-black">{perfil.peso}<span className="text-lg text-gray-500 ml-1">kg</span></h3>
                </div>
                <div className="text-left border-l border-white/10 pl-8">
                  <p className="text-emerald-500 font-black italic text-[11px] uppercase mb-1">Altura</p>
                  <h3 className="text-4xl font-black">{perfil.altura}<span className="text-lg text-gray-500 ml-1">m</span></h3>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${perfil.meta === 'Emagrecimento' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {perfil.meta}
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase mt-3">Consumo Alvo</p>
                <p className="text-sm font-bold text-white">{perfil.tmb} kcal/dia</p>
              </div>
            </div>

            {/* Insight Dinâmico do Coach */}
            <div className="w-full p-5 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2rem] mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🔥</span>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Insight do seu Coach</h4>
              </div>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                {parseFloat(perfil.imc) > 25
                  ? `"${perfil.nome}, seu foco hoje é oxidação de gordura. Priorize proteínas e hidratação para acelerar o processo!"`
                  : `"${perfil.nome}, você está em uma zona excelente! Vamos focar em densidade muscular para lapidar esse shape."`}
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="w-full space-y-4 mb-10">
              <button onClick={() => setAbaAtiva("chat")} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.2rem] uppercase text-sm shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all">💬 Consultoria & Nutrição</button>
              <button onClick={() => setAbaAtiva("treino")} className="w-full bg-white/5 text-white border border-white/10 font-black py-6 rounded-[2.2rem] uppercase text-sm hover:bg-white/10 transition-all">💪 Área de Treinos</button>
              <button onClick={handleSair} className="w-full text-[10px] font-black uppercase text-gray-600 tracking-widest pt-2 hover:text-red-500 transition-colors">[ Encerrar Sessão ]</button>
            </div>
          </main>
        </div>
      )}

      {abaAtiva === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-4 flex items-center justify-between border-b border-white/5 bg-gray-950">
            <button onClick={() => setAbaAtiva("home")} className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-2">
              <span className="text-lg">←</span> Início
            </button>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Mentor IA Nutrição</span>
            <div className="w-10"></div>
          </header>
          <ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} />
        </div>
      )}

      {abaAtiva === "treino" && (
        <div className="flex-1 flex flex-col bg-gray-950 p-6 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <button onClick={() => setAbaAtiva("home")} className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-2">
              <span className="text-lg">←</span> Voltar
            </button>
            <h3 className="text-white font-black italic uppercase tracking-tighter">Treinos Fit</h3>
          </header>
          <div className="space-y-4">
            <button onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="w-full bg-gradient-to-r from-orange-600 to-orange-400 p-7 rounded-[2.5rem] flex items-center gap-5 shadow-lg relative overflow-hidden group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🤖</div>
              <div className="text-left">
                <p className="font-black uppercase text-lg leading-tight text-white">Mentor IA</p>
                <p className="text-[10px] text-orange-100 uppercase font-bold">{!isVip ? "Bloqueado 🔒" : "Plano Elite Ativo"}</p>
              </div>
            </button>
            <button onClick={() => setModalidadeAberta('academia')} className="w-full bg-blue-600 p-7 rounded-[2.5rem] flex items-center gap-5 shadow-lg hover:bg-blue-500 transition-all">
              <div className="text-3xl">🏋️‍♂️</div>
              <div className="text-left"><p className="font-black uppercase text-lg leading-tight text-white">Academia (ABC)</p></div>
            </button>
          </div>

          {modalidadeAberta && (
            <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => setModalidadeAberta(null)} />
          )}
        </div>
      )}

      {bloqueado && (
        <div className="fixed inset-0 z-[500] bg-gray-950 flex flex-col items-center p-6 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <button onClick={() => setBloqueado(false)} className="absolute top-6 right-6 text-white bg-white/10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">✕</button>
          <TelaPlanos />
        </div>
      )}
    </div>
  );
}

export default App;