import { useState, useEffect } from "react";

const ListaExercicios = ({ whatsapp, aoFechar, API_URL, modalidade, perfil, treinoIA }) => {
  const [etapaIA, setEtapaIA] = useState('escolher_objetivo');
  const [treinoFixosAtivo, setTreinoFixosAtivo] = useState('A');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [faseTreino, setFaseTreino] = useState("");
  const [gifAtivo, setGifAtivo] = useState(null);

  const [planoSemanalIA, setPlanoSemanalIA] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState("");

  const diasSemanas = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaAtualSistema = diasSemanas[new Date().getDay()];

  useEffect(() => {
    if (modalidade === 'ia' && treinoIA && treinoIA.length > 0) {
      setPlanoSemanalIA(treinoIA);
      setDiaSelecionado(diaAtualSistema);
      setEtapaIA('treino_ia');
    } else {
      setDiaSelecionado(diaAtualSistema);
    }
  }, [treinoIA, modalidade, diaAtualSistema]);

  const formatarNomeArquivo = (nome) => {
    return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const treinosFixosData = {
    A: [
      { nome: "Supino Reto", series: 4, reps: "10", arquivo: "supino-reto", obs: "Foco na contração peitoral." },
      { nome: "Supino Inclinado Halter", series: 4, reps: "10", arquivo: "supino-inclinado" },
      { nome: "Crucifixo Máquina", series: 3, reps: "12", arquivo: "crucifixo" },
      { nome: "Cross Over", series: 3, reps: "15", arquivo: "cross-over" },
      { nome: "Tríceps Pulley", series: 4, reps: "12", arquivo: "triceps-pulley" },
      { nome: "Tríceps Testa", series: 3, reps: "10", arquivo: "triceps-testa" },
      { nome: "Tríceps Corda", series: 3, reps: "12", arquivo: "triceps-corda" },
      { nome: "Tríceps Francês", series: 3, reps: "10", arquivo: "triceps-frances" }
    ],
    B: [
      { nome: "Puxada Frontal", series: 4, reps: "10", arquivo: "puxada-frontal" },
      { nome: "Remada Curvada", series: 4, reps: "10", arquivo: "remada-curvada" },
      { nome: "Remada Baixa", series: 3, reps: "12", arquivo: "remada-baixa" },
      { nome: "Pulldown", series: 3, reps: "15", arquivo: "pulldown" },
      { nome: "Rosca Direta", series: 4, reps: "10", arquivo: "rosca-direta" },
      { nome: "Rosca Alternada", series: 3, reps: "12", arquivo: "rosca-alternada" },
      { nome: "Rosca Martelo", series: 3, reps: "10", arquivo: "rosca-martelo" },
      { nome: "Rosca Scott", series: 3, reps: "12", arquivo: "rosca-scott" }
    ],
    C: [
      { nome: "Agachamento Livre", series: 4, reps: "10", arquivo: "agachamento" },
      { nome: "Leg Press 45", series: 4, reps: "12", arquivo: "leg-press" },
      { nome: "Cadeira Extensora", series: 3, reps: "15", arquivo: "extensora" },
      { nome: "Stiff", series: 3, reps: "10", arquivo: "stiff" },
      { nome: "Mesa Flexora", series: 3, reps: "12", arquivo: "flexora" },
      { nome: "Cadeira Adutora", series: 3, reps: "15", arquivo: "adutora" },
      { nome: "Panturrilha em pé", series: 4, reps: "20", arquivo: "panturrilha" },
      { nome: "Panturrilha Sentado", series: 4, reps: "20", arquivo: "panturrilha-sentado" }
    ],
    D: [
      { nome: "Desenvolvimento Militar", series: 4, reps: "10", arquivo: "desenvolvimento" },
      { nome: "Elevação Lateral", series: 4, reps: "15", arquivo: "elevacao-lateral" },
      { nome: "Elevação Frontal", series: 3, reps: "12", arquivo: "elevacao-frontal" },
      { nome: "Crucifixo Inverso", series: 3, reps: "12", arquivo: "crucifixo-inverso" },
      { nome: "Encolhimento Barra", series: 4, reps: "12", arquivo: "encolhimento" },
      { nome: "Encolhimento Halter", series: 4, reps: "12", arquivo: "encolhimento-halter" },
      { nome: "Remada Alta", series: 3, reps: "12", arquivo: "remada-alta" },
      { nome: "Rotação Externa Polia", series: 3, reps: "15", arquivo: "rotacao-polia" }
    ]
  };

  const gerarTreinoIA = async (objetivo) => {
    setCarregandoIA(true);
    try {
      const response = await fetch(`${API_URL}/usuarios/gerar-treino-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, objetivo, perfil })
      });
      const dadosIA = await response.json();
      if (dadosIA.treinoSemanal) {
        setPlanoSemanalIA(dadosIA.treinoSemanal);
        setFaseTreino(dadosIA.fase || "Plano Elite IA");
        setEtapaIA('treino_ia');
      } else { alert("Tente novamente."); }
    } catch { alert("Erro de conexão."); } finally { setCarregandoIA(false); }
  };

  return (
    <div className="fixed inset-0 z-[800] bg-[#0d0e12] flex flex-col p-6 overflow-y-auto text-white">
      <header className="flex justify-between items-center mb-6">
        <button onClick={aoFechar} className="text-sky-400 font-bold text-xs uppercase tracking-widest hover:text-white">← Sair</button>
        <h3 className="font-black italic text-sky-400 uppercase tracking-widest">{modalidade === 'ia' ? 'Mentor IA Pro' : 'Treino Fixo'}</h3>
      </header>

      {gifAtivo && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setGifAtivo(null)}>
          <div className="w-full max-w-sm bg-gray-900 rounded-[2rem] p-4 border border-sky-500/50" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-black uppercase text-sky-400 mb-4 text-lg">{gifAtivo.nome}</h4>
            <img src={`/exercicios/${gifAtivo.arquivo}.gif`} className="w-full rounded-xl" onError={(e) => { e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"; }} />
            <button onClick={() => setGifAtivo(null)} className="w-full mt-4 bg-sky-600 text-white py-3 rounded-xl font-black uppercase hover:bg-sky-500 transition-all text-base">Fechar</button>
          </div>
        </div>
      )}

      {modalidade === 'ia' && etapaIA === 'escolher_objetivo' ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="text-center mb-4">
            <div className={`text-6xl mb-4 ${carregandoIA ? 'animate-pulse' : ''}`}>🤖</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{carregandoIA ? "Calculando..." : "Defina seu Foco"}</h2>
          </div>
          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Hipertrofia")} className="w-full bg-sky-600 p-8 rounded-[2rem] font-black uppercase italic shadow-lg shadow-sky-900/50 active:scale-95 transition-all text-lg">💪 Hipertrofia</button>
          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Emagrecimento")} className="w-full bg-white/10 border border-white/20 p-8 rounded-[2rem] font-black uppercase italic active:scale-95 transition-all text-lg">🔥 Emagrecimento</button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-10">
          {modalidade === 'ia' && planoSemanalIA.length > 0 && (
            <>
              <div className="bg-gray-900 border border-sky-500/30 p-4 rounded-[1.5rem] mb-2 text-center">
                <p className="text-xs text-sky-400 uppercase font-black tracking-widest mb-1">Planejamento Ativo</p>
                <h4 className="text-base font-black uppercase italic">{faseTreino}</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain w-full max-w-full">
                {diasSemanas.map((dia) => (
                  <button key={dia} onClick={() => setDiaSelecionado(dia)} className={`px-4 py-2 rounded-full text-xs font-black uppercase transition-all ${diaSelecionado === dia ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' : 'bg-gray-800 text-gray-300'}`}>{dia.slice(0, 3)}</button>
                ))}
              </div>
            </>
          )}

          {modalidade !== 'ia' && (
            <div className="flex gap-2 mb-4">
              {['A', 'B', 'C', 'D'].map(letra => (
                <button key={letra} onClick={() => setTreinoFixosAtivo(letra)} className={`px-4 py-2 rounded-full text-sm font-black ${treinoFixosAtivo === letra ? 'bg-sky-600' : 'bg-white/20 text-gray-200'}`}>Ficha {letra}</button>
              ))}
            </div>
          )}

          {(() => {
            let exerciciosDoDia = [];
            if (modalidade === 'ia') {
              const rotina = planoSemanalIA.find(t => t.dia.toLowerCase().includes(diaSelecionado.toLowerCase()));
              exerciciosDoDia = rotina ? rotina.exercicios : [];
              if (exerciciosDoDia.length === 0) return <div className="bg-gray-900 p-8 rounded-[2rem] text-center border border-white/10"><p className="text-gray-400 text-sm font-black uppercase italic">Descanso! 🧘‍♂️</p></div>;
            } else { exerciciosDoDia = treinosFixosData[treinoFixosAtivo]; }

            return exerciciosDoDia.map((ex, i) => (
              <div key={i} className="bg-gray-900 border border-white/10 p-5 rounded-[2rem] shadow-xl">
                <h4 className="text-base font-black uppercase italic text-white mb-3">{ex.nome}</h4>
                <div className="flex gap-2">
                  <span className="bg-sky-600/20 text-sky-400 border border-sky-500/40 text-xs font-black px-3 py-1.5 rounded uppercase">{ex.series}X {ex.reps} REPS</span>
                  <button onClick={() => setGifAtivo({ nome: ex.nome, arquivo: ex.arquivo || formatarNomeArquivo(ex.nome) })} className="bg-white/20 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase hover:bg-sky-600 transition-all">▶ Ver GIF</button>
                </div>
                {ex.obs && <div className="bg-black/50 p-3 rounded-xl mt-3 border-l-4 border-sky-500"><p className="text-gray-300 text-xs font-bold uppercase italic"><span className="text-sky-400 font-black">Coach:</span> {ex.obs}</p></div>}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

export default ListaExercicios;