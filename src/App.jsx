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
    nome: "Guerreiro(a)",
    peso: "0",
    altura: "0",
    idade: "0",
    meta: "Emagrecimento",
    imc: "0",
    tmb: "0",
    faltam: "0"
  });

  const API_URL = "https://api.treinofit.app.br";
  const verificandoRef = useRef(false);

  // --- MANTENDO DADOS PARA O GRÁFICO DE PIZZA ---


  // --- SINCRONIZAÇÃO BACKEND (PRESERVADA) ---
  const atualizarStatusVIP = useCallback(async () => {
    if (!usuario) return;
    try {
      const whatsLimpo = String(usuario).replace(/\D/g, "");
      const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);
      if (response.ok) {
        const dados = await response.json();
        setIsVip(dados.pago === true);
        if (dados.treinoIA) setTreinoIAPescado(dados.treinoIA);

        // Atualiza biometria se houver mudança no banco
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
  }, [usuario, API_URL]);

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
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]">FIT</div>
        <h2 className="text-2xl font-black mb-2 uppercase italic text-emerald-500 text-center">Construa seu Perfil</h2>
        <div className="w-full max-w-sm space-y-4">
          <input type="text" placeholder="Seu Nome" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none" onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} />
          <div className="flex gap-4">
            <input type="number" placeholder="Idade" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none" onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })} />
            <input type="number" placeholder="Peso (kg)" className="w-1/2 bg-white/5 border border-white/10 p-5 rounded-3xl outline-none" onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} />
            <input type="number" placeholder="Altura (m)" className="w-1/2 bg-white/5 border border-white/10 p-5 rounded-3xl outline-none" onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} />
          </div>
          <select className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl outline-none" onChange={(e) => setPerfil({ ...perfil, meta: e.target.value })}>
            <option value="Emagrecimento">Meta: Emagrecimento</option>
            <option value="Hipertrofia">Meta: Hipertrofia</option>
          </select>
          <button onClick={salvarOnboarding} className="w-full bg-emerald-500 text-black font-black py-5 rounded-3xl uppercase">Ativar Protocolo FIT →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 text-white flex flex-col overflow-hidden font-sans">
      {abaAtiva === "home" && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <header className="w-full max-w-md flex justify-between items-center mt-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black shadow-lg">FIT</div>
              <div className="text-left">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Atleta {isVip ? 'Premium' : 'Free'}</p>
                <h2 className="text-xl font-black uppercase tracking-tighter leading-none">{perfil.nome}</h2>
              </div>
            </div>
            <button onClick={() => !isVip && setBloqueado(true)} className={`px-4 py-2 rounded-2xl border ${isVip ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-orange-500 text-orange-500 animate-pulse'} text-[10px] font-black uppercase tracking-widest`}>
              {isVip ? "💎 VIP Ativo" : "⚡ Upgrade VIP"}
            </button>
          </header>

          <main className="w-full max-w-md flex flex-col items-center">
            {/* --- CARDS DE PESO E ALTURA (RECUPERADOS) --- */}
            <div className="flex gap-4 w-full mb-6">
              <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Peso Atual</p>
                <h3 className="text-3xl font-black italic">{perfil.peso}<span className="text-sm ml-1 text-emerald-500">kg</span></h3>
                <div className="mt-2 text-emerald-500 font-bold text-[9px] uppercase tracking-tighter italic">Status: Queima</div>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem]">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Altura</p>
                <h3 className="text-3xl font-black italic">{perfil.altura}<span className="text-sm ml-1 text-emerald-500">m</span></h3>
                <div className="mt-2 text-gray-400 font-bold text-[9px] uppercase tracking-tighter">{perfil.meta}</div>
              </div>
            </div>

            {/* --- GRÁFICO DE PIZZA E CONSUMO ALVO --- */}
            <div className="w-full bg-white/5 border border-white/10 p-8 rounded-[3rem] mb-6 flex flex-col items-center">
              <p className="text-gray-500 text-[10px] font-black uppercase mb-6 tracking-widest">Consumo Alvo Diário</p>
              <div className="relative flex items-center justify-center mb-6">
                {/* Placeholder visual do Gráfico Pizza se não usar a lib externa */}
                <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500 border-t-orange-500 border-l-red-500 animate-pulse"></div>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black italic leading-none">{perfil.tmb}</span>
                  <span className="text-[8px] font-black text-gray-500 uppercase">kcal</span>
                </div>
              </div>
              <div className="flex gap-6 text-[10px] font-black uppercase">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Prot</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Carb</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Gord</div>
              </div>
            </div>

            {/* --- INSIGHT DO COACH --- */}
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem] mb-8">
              <p className="text-emerald-500 text-[10px] font-black uppercase mb-2">🔥 Insight do seu Coach</p>
              <p className="text-sm font-medium italic text-gray-300 leading-relaxed">
                "{perfil.nome}, seu foco hoje é oxidação de gordura. Priorize proteínas e hidratação para acelerar o processo!"
              </p>
            </div>

            <div className="w-full space-y-4 mb-10">
              <button onClick={() => setAbaAtiva("chat")} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.2rem] uppercase text-sm shadow-[0_10px_20px_rgba(16,185,129,0.3)]">💬 Consultoria & Nutrição</button>
              <button onClick={() => setAbaAtiva("treino")} className="w-full bg-white/5 text-white border border-white/10 font-black py-6 rounded-[2.2rem] uppercase text-sm">💪 Área de Treinos</button>
              <button onClick={handleSair} className="w-full text-[10px] font-black uppercase text-gray-600 tracking-widest pt-2 hover:text-red-500 transition-colors">[ Encerrar Sessão ]</button>
            </div>
          </main>
        </div>
      )}

      {/* --- ABAS CHAT E TREINO (MANTIDAS) --- */}
      {abaAtiva === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-4 flex items-center justify-between border-b border-white/5 bg-gray-950">
            <button onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-2"><span className="text-lg">←</span> Início</button>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Mentor IA Nutrição</span>
          </header>
          <ChatReceitas
            whatsapp={usuario}
            isVip={isVip}
            aoPedirUpgrade={() => setBloqueado(true)}
            perfil={perfil}
            setTreinoIAPescado={setTreinoIAPescado}
            aoAtualizarPerfil={atualizarStatusVIP}
          />
        </div>
      )}

      {abaAtiva === "treino" && (
        <div className="flex-1 flex flex-col bg-gray-950 p-6 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <button onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-2"><span className="text-lg">←</span> Voltar</button>
            <h3 className="text-white font-black italic uppercase tracking-tighter">Treinos Fit</h3>
          </header>
          <div className="space-y-4">
            <button onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="w-full bg-gradient-to-r from-orange-600 to-orange-400 p-7 rounded-[2.5rem] flex items-center gap-5 shadow-lg">
              <div className="text-3xl">🤖</div>
              <div className="text-left">
                <p className="font-black uppercase text-lg leading-tight text-white">Mentor IA</p>
                <p className="text-[10px] text-orange-100 uppercase font-bold">{!isVip ? "Bloqueado 🔒" : "Elite Ativo"}</p>
              </div>
            </button>
            <button onClick={() => setModalidadeAberta('academia')} className="w-full bg-blue-600 p-7 rounded-[2.5rem] flex items-center gap-5 shadow-lg">
              <div className="text-3xl">🏋️‍♂️</div>
              <div className="text-left"><p className="font-black uppercase text-lg leading-tight text-white">Academia (ABC)</p></div>
            </button>
          </div>
          {modalidadeAberta && (
            <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />
          )}
        </div>
      )}

      {bloqueado && (
        <div className="fixed inset-0 z-[500] bg-gray-950 flex flex-col items-center p-6 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <button onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-white bg-white/10 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
          <TelaPlanos />
        </div>
      )}
    </div>
  );
}

export default App;