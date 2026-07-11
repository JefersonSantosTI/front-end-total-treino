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

  // 🔥 O CÉREBRO DA IA: Para quando a IA inventar nomes
  const dicionarioVideos = {
    "supino-reto": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-reto.gif",
    "supino-inclinado": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-inclinado-com-halteres.gif",
    "peck-deck-voador": "https://gymvisual.com/img/p/5/7/4/0/5740.gif",
    "crucifixo-reto": "https://gymvisual.com/img/p/5/7/4/0/5740.gif",
    "desenvolvimento": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/desenvolvimento-para-ombros-com-halteres.gif",
    "elevacao-lateral": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/ombros-elevacao-lateral-de-ombros-com-halteres.gif",
    "triceps-corda": "https://i.pinimg.com/originals/15/6b/79/156b79c6e5418472dc05fd4bc161cd16.gif",
    "puxada-pulley": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-puxada-atras-no-pulley-alto.gif",
    "puxada-frontal": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-puxada-atras-no-pulley-alto.gif",
    "remada-curvada": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-remada-curvada-com-barra.gif",
    "rosca-direta": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-direta-com-barra-w.gif",
    "rosca-martelo": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-martelo-com-halteres.gif",
    "leg-press-45": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-leg-press-45-graus.gif",
    "leg-press": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-leg-press-45-graus.gif",
    "cadeira-extensora": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-extensao-de-pernas.gif",
    "mesa-flexora": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-flexao-de-pernas-na-mesa-flexora.gif",
    "panturrilha-sentado": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/panturrilhas-elevacao-de-gemeos-sentado.gif",
    "panturrilha-em-pe": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/panturrilhas-elevacao-de-gemeos-sentado.gif",
    "agachamento-livre": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/11/agachamento-livre.gif",
    "flexao-de-bracos": "https://i.pinimg.com/originals/92/6e/c5/926ec5127683c2779b7f5cc627cf75e0.gif",
    "flexao-corporal": "https://i.pinimg.com/originals/92/6e/c5/926ec5127683c2779b7f5cc627cf75e0.gif",
    "afundo": "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-afundo-ou-passada-com-halteres.gif",
    "polichinelos": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJid3R3bmZ3bmZ3bmZ3/3o7TKVUn7iM8FMEU24/giphy.gif"
  };

  const obterUrlDoVideo = (nomeExercicio, arquivoPersonalizado) => {
    const nomeFormatado = formatarNomeArquivo(nomeExercicio);
    if (dicionarioVideos[nomeFormatado]) return dicionarioVideos[nomeFormatado];
    return `/videos/${arquivoPersonalizado || nomeFormatado}.gif`;
  };

  // 🔥 OS SEUS TREINOS GRATUITOS (Agora puxando direto do seu Protocolo Original com Links Oficiais)
  const treinosFixosData = {
    A: [
      { nome: "Supino Reto", series: 4, reps: "10", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-reto.gif" },
      { nome: "Supino Inclinado Halter", series: 3, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-inclinado-com-halteres.gif" },
      { nome: "Peck Deck (Voador)", series: 3, reps: "15", url: "https://gymvisual.com/img/p/5/7/4/0/5740.gif" },
      { nome: "Desenvolvimento Ombro", series: 3, reps: "10", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/desenvolvimento-para-ombros-com-halteres.gif" },
      { nome: "Elevação Lateral", series: 4, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/ombros-elevacao-lateral-de-ombros-com-halteres.gif" },
      { nome: "Tríceps Corda", series: 4, reps: "12", url: "https://i.pinimg.com/originals/15/6b/79/156b79c6e5418472dc05fd4bc161cd16.gif" }
    ],
    B: [
      { nome: "Puxada Pulley", series: 4, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-puxada-atras-no-pulley-alto.gif" },
      { nome: "Remada Curvada", series: 3, reps: "10", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-remada-curvada-com-barra.gif" },
      { nome: "Rosca Direta Barra W", series: 4, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-direta-com-barra-w.gif" },
      { nome: "Rosca Martelo", series: 3, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-martelo-com-halteres.gif" }
    ],
    C: [
      { nome: "Leg Press 45", series: 4, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-leg-press-45-graus.gif" },
      { nome: "Cadeira Extensora", series: 3, reps: "15", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-extensao-de-pernas.gif" },
      { nome: "Mesa Flexora", series: 3, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-flexao-de-pernas-na-mesa-flexora.gif" },
      { nome: "Panturrilha Sentado", series: 4, reps: "20", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/panturrilhas-elevacao-de-gemeos-sentado.gif" }
    ],
    Casa: [
      { nome: "Agachamento Livre", series: 4, reps: "20", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/11/agachamento-livre.gif" },
      { nome: "Flexão de Braços", series: 3, reps: "12", url: "https://i.pinimg.com/originals/92/6e/c5/926ec5127683c2779b7f5cc627cf75e0.gif" },
      { nome: "Afundo", series: 3, reps: "12", url: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-afundo-ou-passada-com-halteres.gif" },
      { nome: "Polichinelos", series: 4, reps: "40", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJid3R3bmZ3bmZ3bmZ3/3o7TKVUn7iM8FMEU24/giphy.gif" }
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

      {/* MODAL DO GIF ATUALIZADO */}
      {gifAtivo && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setGifAtivo(null)}>
          <div className="w-full max-w-sm bg-gray-900 rounded-[2rem] p-4 border border-sky-500/50" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-black uppercase text-sky-400 mb-4 text-lg">{gifAtivo.nome}</h4>
            <img src={gifAtivo.url} className="w-full rounded-xl" onError={(e) => { e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"; }} />
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

          {/* 🔥 ABAS DO TREINO FIXO ATUALIZADAS */}
          {modalidade !== 'ia' && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
              {['A', 'B', 'C', 'Casa'].map(letra => (
                <button
                  key={letra}
                  onClick={() => setTreinoFixosAtivo(letra)}
                  className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap transition-all ${treinoFixosAtivo === letra ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                >
                  {letra === 'Casa' ? 'Treino Casa ⏱️' : `Ficha ${letra}`}
                </button>
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

                  {/* 🔥 LÓGICA DE VÍDEOS HÍBRIDA */}
                  <button onClick={() => {
                    // Se for treino Fixo ele puxa direto a ex.url. Se for IA ele consulta o obterUrlDoVideo.
                    const urlVideo = ex.url || obterUrlDoVideo(ex.nome, ex.arquivo);
                    setGifAtivo({ nome: ex.nome, url: urlVideo });
                  }} className="bg-white/20 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase hover:bg-sky-600 transition-all">▶ Ver GIF</button>
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