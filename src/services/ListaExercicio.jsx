import { useState, useEffect } from "react";

const ListaExercicios = ({ whatsapp, aoFechar, API_URL, modalidade, perfil, treinoIA }) => {
  const [etapaIA, setEtapaIA] = useState('escolher_objetivo');
  const [treinoFixosAtivo, setTreinoFixosAtivo] = useState('A');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [exerciciosGerados, setExerciciosGerados] = useState([]);
  const [faseTreino, setFaseTreino] = useState("");
  const [timer, setTimer] = useState(0);
  const [descansando, setDescansando] = useState(false);

  // Estado para o GIF que o usuário está visualizando no momento
  const [gifAtivo, setGifAtivo] = useState(null);

  useEffect(() => {
    let interval;
    if (descansando && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && descansando) {
      setDescansando(false);
    }
    return () => clearInterval(interval);
  }, [descansando, timer]);

  // Função para limpar o nome do exercício e buscar o arquivo na pasta public/exercicios
  const formatarNomeArquivo = (nome) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, "-")           // Troca espaços por hífen
      .replace(/[^a-z0-9-]/g, "");    // Remove caracteres especiais
  };

  // --- TREINOS FIXOS ---
  const treinosFixosData = {
    A: [
      { nome: "Supino Reto", series: 3, reps: "12", arquivo: "supino-reto" },
      { nome: "Desenvolvimento", series: 3, reps: "10", arquivo: "desenvolvimento" },
    ],
    B: [
      { nome: "Puxada Frontal", series: 3, reps: "12", arquivo: "puxada-frontal" },
      { nome: "Rosca Direta", series: 3, reps: "12", arquivo: "rosca-direta" },
    ],
    C: [
      { nome: "Agachamento", series: 4, reps: "10", arquivo: "agachamento" },
      { nome: "Leg Press", series: 3, reps: "15", arquivo: "leg-press" },
    ]
  };

  const gerarTreinoIA = async (objetivo) => {
    setCarregandoIA(true);
    try {
      const diasSemanas = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      const diaAtual = diasSemanas[new Date().getDay()];

      const response = await fetch(`${API_URL}/usuarios/gerar-treino-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp,
          objetivo,
          diaAtual,
          perfil: {
            peso: perfil.weight || perfil.peso,
            altura: perfil.height || perfil.altura,
            plano: "Elite"
          }
        })
      });
      const dadosIA = await response.json();

      setExerciciosGerados(dadosIA.treino || []);
      setFaseTreino(dadosIA.fase || "Choque Metabólico");
      setEtapaIA('treino_ia');
    } catch {
      alert("Erro ao conectar com Mentor IA.");
    } finally {
      setCarregandoIA(false);
    }
  };

  const modalStyle = "fixed inset-0 z-[800] bg-gray-950 flex flex-col p-6 overflow-y-auto text-white";

  // --- VIEW DA IA ---
  if (modalidade === 'ia') {
    return (
      <div className={modalStyle}>
        <header className="flex justify-between items-center mb-10">
          <button onClick={aoFechar} className="text-gray-400 font-black text-[10px] uppercase tracking-widest">← Sair</button>
          <div className="text-right">
            <h3 className="font-black italic text-orange-500 uppercase leading-none">Mentor IA</h3>
            {treinoIA && !carregandoIA && etapaIA === 'escolher_objetivo' && (
              <span className="text-[7px] text-emerald-500 font-bold uppercase tracking-tighter block mt-1">Plano Ativo</span>
            )}
          </div>
        </header>

        {etapaIA === 'escolher_objetivo' ? (
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl border-4 border-white/10">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                {carregandoIA ? "Analisando..." : "Defina seu Alvo"}
              </h2>
            </div>

            <div className="space-y-4">
              <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Hipertrofia")} className="w-full bg-orange-600 p-8 rounded-[2.5rem] font-black uppercase italic shadow-xl transition-all">
                💪 Hipertrofia
              </button>
              <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Emagrecimento")} className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] font-black uppercase italic transition-all">
                🔥 Emagrecimento
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-10">
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-[2.5rem] border border-orange-500/30 shadow-2xl relative overflow-hidden">
              <p className="text-[9px] font-black uppercase text-orange-500 tracking-widest mb-1">Status da Missão</p>
              <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter">{faseTreino}</h4>
            </div>

            {/* MAP de exercícios gerados pela IA */}
            {exerciciosGerados.map((ex, i) => (
              <div key={i} className="bg-gray-900 border border-white/5 p-6 rounded-[2.5rem] shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-black uppercase italic text-white leading-tight mb-1">{ex.nome}</h4>
                    <div className="flex gap-2">
                      <span className="bg-orange-600 text-black text-[8px] font-black px-2 py-0.5 rounded uppercase">{ex.tecnica || "Padrão Ouro"}</span>
                      <button
                        onClick={() => setGifAtivo({ nome: ex.nome, arquivo: formatarNomeArquivo(ex.nome) })}
                        className="bg-white/10 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase"
                      >🎬 Ver Execução</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-white leading-none">{ex.series}x</span>
                  </div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl mb-5 border-l-2 border-orange-500">
                  <p className="text-gray-300 text-[10px] font-bold uppercase italic leading-relaxed">
                    <span className="text-orange-500 font-black">Coach:</span> {ex.obs}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-500 font-black text-[11px] tracking-widest">{ex.reps} REPS</span>
                  <button onClick={() => { setTimer(60); setDescansando(true); }} className="bg-orange-600 text-black px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all">⏱️ Descanso</button>
                </div>
              </div>
            ))}

            {/* RODAPÉ DE ENGAJAMENTO - INSERIDO AQUI */}
            <div className="mt-8 bg-orange-600/10 border-2 border-dashed border-orange-500 p-6 rounded-[2.5rem] text-center">
              <p className="text-[10px] font-black uppercase text-orange-500 mb-2">Próximo Desafio</p>
              <h5 className="text-white font-black italic uppercase text-lg">
                {faseTreino.toLowerCase().includes("hipertrofia")
                  ? "Amanhã: Esmagar Costas e Bíceps 🦅"
                  : "Amanhã: Queima Abdominal Extrema 🔥"}
              </h5>
              <p className="text-gray-400 text-[9px] uppercase mt-2">
                Seu Mentor IA já preparou a progressão de carga para sua próxima sessão.
              </p>
            </div>
          </div>
        )}

        {/* MODAL DE GIF INTERNO */}
        {gifAtivo && (
          <div className="fixed inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-gray-900 rounded-[3rem] overflow-hidden border border-white/10">
              <div className="p-6 flex justify-between items-center border-b border-white/5">
                <h4 className="font-black uppercase italic text-xs text-orange-500">{gifAtivo.nome}</h4>
                <button onClick={() => setGifAtivo(null)} className="text-white text-[10px] font-black">FECHAR</button>
              </div>
              <div className="bg-white p-4">
                <img
                  src={`/exercicios/${gifAtivo.arquivo}.gif`}
                  className="w-full h-auto rounded-xl"
                  onError={(e) => { e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"; }}
                />
              </div>
              <div className="p-6 text-center"><p className="text-[9px] text-gray-500 font-black uppercase italic">Foco na técnica e controle</p></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW ACADEMIA / CASA (TREINOS FIXOS) ---
  return (
    <div className={modalStyle}>
      <header className="flex justify-between items-center mb-8">
        <button onClick={aoFechar} className="text-gray-500 font-black text-[10px] uppercase tracking-widest">← Sair</button>
        <h3 className="font-black italic uppercase text-emerald-500 tracking-tighter">{modalidade}</h3>
        {descansando && <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-black animate-pulse">{timer}s</span>}
      </header>

      <div className="grid grid-cols-3 gap-2 mb-8 bg-gray-900 p-2 rounded-[2rem]">
        {['A', 'B', 'C'].map(l => (
          <button key={l} onClick={() => setTreinoFixosAtivo(l)} className={`py-4 rounded-[1.5rem] font-black ${treinoFixosAtivo === l ? 'bg-emerald-500 text-black' : 'text-gray-500'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-6 pb-10">
        {treinosFixosData[treinoFixosAtivo].map((ex, i) => (
          <div key={i} className="bg-gray-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-xl relative">
            <div className="h-48 bg-black relative">
              <img src={`/exercicios/${ex.arquivo}.gif`} className="w-full h-full object-cover opacity-40" onError={(e) => e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"} />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent"></div>
            </div>
            <div className="p-8 relative -mt-16">
              <h4 className="font-black uppercase italic text-2xl text-white tracking-tighter mb-1">{ex.nome}</h4>
              <p className="text-emerald-500 font-black text-[10px] uppercase mb-5">{ex.series} Séries de {ex.reps}</p>
              <button onClick={() => { setTimer(60); setDescansando(true); }} className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase active:bg-emerald-500 transition-all">⏱️ Descanso</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaExercicios;