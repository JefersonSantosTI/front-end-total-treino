import { useState, useEffect } from "react";

const ListaExercicios = ({ whatsapp, aoFechar, API_URL, modalidade, perfil, treinoIA }) => {
  const [etapaIA, setEtapaIA] = useState('escolher_objetivo');
  const [treinoFixosAtivo, setTreinoFixosAtivo] = useState('A');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [faseTreino, setFaseTreino] = useState("");

  // O gifAtivo agora pode receber um .mp4 ou .gif (e até a url2)
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

  // 🔥 SUA LÓGICA DE VÍDEOS DE ALTA PERFORMANCE (Adaptada para rodar aqui dentro)
  const handleAbrirVideo = async (ex) => {
    const nomeLimpo = ex.nome.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-');

    const urlVideoMp4 = `/videos/${nomeLimpo}.mp4`;
    const urlVideoMp4_2 = `/videos/${nomeLimpo}-2.mp4`;
    const urlGif = `/exercicios/${nomeLimpo}.gif`;

    // 1. TENTA O VÍDEO MP4 PRIMEIRO
    try {
      const checkVideo = await fetch(urlVideoMp4, { method: 'HEAD' });
      if (checkVideo.ok) {
        let segundoVideo = null;
        try {
          const checkVideo2 = await fetch(urlVideoMp4_2, { method: 'HEAD' });
          if (checkVideo2.ok) {
            segundoVideo = urlVideoMp4_2;
          }
        } catch {
          // Ignora erro do segundo vídeo silenciosamente
        }

        setGifAtivo({ nome: ex.nome, url: urlVideoMp4, url2: segundoVideo });
        return;
      }
    } catch {
      console.log("Tentando fallback para GIF...");
    }

    // 2. SE NÃO ACHOU O MP4, TENTA O GIF ANTIGO
    const img = new Image();
    img.src = urlGif;

    img.onload = () => setGifAtivo({ nome: ex.nome, url: urlGif });

    // 3. SE NÃO ACHOU NEM O MP4 E NEM O GIF, VAI PRO YOUTUBE
    img.onerror = () => {
      if (ex.videoUrl && ex.videoUrl.trim() !== "") {
        window.open(ex.videoUrl, '_blank');
      } else {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nome)}+shorts+execução`, '_blank');
      }
    };
  };

  const treinosFixosData = {
    A: [
      { nome: "Supino Reto", series: 4, reps: "10" },
      { nome: "Supino Inclinado Halter", series: 3, reps: "12" },
      { nome: "Peck Deck (Voador)", series: 3, reps: "15" },
      { nome: "Desenvolvimento Ombro", series: 3, reps: "10" },
      { nome: "Elevação Lateral", series: 4, reps: "12" },
      { nome: "Tríceps Corda", series: 4, reps: "12" }
    ],
    B: [
      { nome: "Puxada Pulley", series: 4, reps: "12" },
      { nome: "Remada Curvada", series: 3, reps: "10" },
      { nome: "Rosca Direta Barra W", series: 4, reps: "12" },
      { nome: "Rosca Martelo", series: 3, reps: "12" }
    ],
    C: [
      { nome: "Leg Press 45", series: 4, reps: "12" },
      { nome: "Cadeira Extensora", series: 3, reps: "15" },
      { nome: "Mesa Flexora", series: 3, reps: "12" },
      { nome: "Panturrilha Sentado", series: 4, reps: "20" }
    ],
    Casa: [
      { nome: "Agachamento Livre", series: 4, reps: "20" },
      { nome: "Flexão de Braços", series: 3, reps: "12" },
      { nome: "Afundo", series: 3, reps: "12" },
      { nome: "Polichinelos", series: 4, reps: "40" }
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

      {/* 🔥 MODAL DE VÍDEO ATUALIZADO (RODA MP4 E GIF) */}
      {gifAtivo && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setGifAtivo(null)}>
          <div className="w-full max-w-sm bg-gray-900 rounded-[2rem] p-4 border border-sky-500/50" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-black uppercase text-sky-400 mb-4 text-lg">{gifAtivo.nome}</h4>

            {/* Verifica se a URL é um MP4 ou um GIF */}
            {gifAtivo.url?.includes('.mp4') ? (
              <video src={gifAtivo.url} autoPlay loop muted playsInline className="w-full rounded-xl mb-2" />
            ) : (
              <img src={gifAtivo.url} className="w-full rounded-xl mb-2" onError={(e) => { e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"; }} />
            )}

            {/* Se houver o 2º ângulo da câmera (-2.mp4), ele renderiza aqui embaixo! */}
            {gifAtivo.url2 && (
              <video src={gifAtivo.url2} autoPlay loop muted playsInline className="w-full rounded-xl mt-2" />
            )}

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

                  {/* 🔥 BOTÃO QUE ACIONA A INTELIGÊNCIA UNIVERSAL */}
                  <button onClick={() => handleAbrirVideo(ex)} className="bg-white/20 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase hover:bg-sky-600 transition-all">▶ VER VÍDEO</button>
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