import { useState, useEffect } from "react";

const ListaExercicios = ({ whatsapp, aoFechar, API_URL, modalidade, perfil }) => {
  const [etapaIA, setEtapaIA] = useState('escolher_objetivo');
  const [treinoFixosAtivo, setTreinoFixosAtivo] = useState('A');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [exerciciosGerados, setExerciciosGerados] = useState([]);
  const [faseTreino, setFaseTreino] = useState("");
  const [timer, setTimer] = useState(0);
  const [descansando, setDescansando] = useState(false);
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

  const formatarNomeArquivo = (nome) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

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
      { nome: "Agachamento livre", series: 4, reps: "10", arquivo: "agachamento" },
      { nome: "Leg Press", series: 3, reps: "15", arquivo: "leg-press" },
    ]
  };

  const gerarTreinoIA = async (objetivo) => {
    setCarregandoIA(true);
    try {
      const diasSemanas = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaAtual = diasSemanas[new Date().getDay()];

      const response = await fetch(`${API_URL}/usuarios/gerar-treino-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, objetivo, diaAtual, perfil })
      });
      const dadosIA = await response.json();

      const listaExercicios = dadosIA.treinoSemanal
        ? (dadosIA.treinoSemanal.find(d => d.dia === diaAtual)?.exercicios || dadosIA.treinoSemanal[0].exercicios)
        : dadosIA.treino || [];

      setExerciciosGerados(listaExercicios);
      setFaseTreino(dadosIA.fase || "Choque Metabólico");
      setEtapaIA('treino_ia');
    } catch {
      alert("Erro ao conectar com Mentor IA.");
    } finally {
      setCarregandoIA(false);
    }
  };

  const modalStyle = "fixed inset-0 z-[800] bg-gray-950 flex flex-col p-6 overflow-y-auto text-white";

  return (
    <div className={modalStyle}>
      <header className="flex justify-between items-center mb-6">
        <button onClick={aoFechar} className="text-gray-400 font-black text-[10px] uppercase tracking-widest">← Sair</button>
        <h3 className="font-black italic text-orange-500 uppercase">{modalidade === 'ia' ? 'Mentor IA' : 'Treino Fixo'}</h3>
      </header>

      {faseTreino && <p className="text-[10px] text-gray-500 uppercase font-bold mb-4 italic">Fase: {faseTreino}</p>}

      {/* MODAL GIF COM Z-INDEX SUPERIOR */}
      {gifAtivo && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setGifAtivo(null)}>
          <div className="w-full max-w-sm bg-gray-900 rounded-[2rem] p-4 border border-orange-500/50" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-black uppercase text-orange-500 mb-4">{gifAtivo.nome}</h4>
            <img
              src={`/exercicios/${gifAtivo.arquivo}.gif`}
              className="w-full rounded-xl"
              onError={(e) => { e.target.src = "https://media.giphy.com/media/3o7TKMGpxxS06DclhS/giphy.gif"; }}
            />
            <button onClick={() => setGifAtivo(null)} className="w-full mt-4 bg-white text-black py-3 rounded-xl font-black uppercase hover:bg-gray-200 transition-all">Fechar</button>
          </div>
        </div>
      )}

      {modalidade === 'ia' && etapaIA === 'escolher_objetivo' ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-4 animate-pulse">🤖</div>
            <h2 className="text-xl font-bold uppercase tracking-tighter text-white">
              {carregandoIA ? "A IA ESTÁ CALCULANDO..." : "Defina seu Foco"}
            </h2>

            {/* ✅ AQUI A MENSAGEM EXTRA DE CARREGAMENTO */}
            {carregandoIA && (
              <p className="text-orange-500 text-[10px] font-black uppercase mt-2 animate-bounce">
                Montando seu plano de elite...
              </p>
            )}
          </div>

          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Hipertrofia")} className="w-full bg-orange-600 p-8 rounded-[2.5rem] font-black uppercase italic shadow-xl disabled:opacity-50">
            {carregandoIA ? "PROCESSANDO..." : "💪 Hipertrofia"}
          </button>

          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Emagrecimento")} className="w-full bg-white/5 border p-8 rounded-[2.5rem] font-black uppercase italic disabled:opacity-50">
            {carregandoIA ? "PROCESSANDO..." : "🔥 Emagrecimento"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-10">
          {modalidade !== 'ia' && (
            <div className="flex gap-2 mb-4">
              {['A', 'B', 'C'].map(letra => (
                <button key={letra} onClick={() => setTreinoFixosAtivo(letra)} className={`px-4 py-2 rounded-full text-xs font-black ${treinoFixosAtivo === letra ? 'bg-orange-600' : 'bg-white/10'}`}>{letra}</button>
              ))}
            </div>
          )}

          {(modalidade === 'ia' ? exerciciosGerados : treinosFixosData[treinoFixosAtivo]).map((ex, i) => (
            <div key={i} className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] shadow-lg">
              <h4 className="text-lg font-black uppercase italic text-white mb-2">{ex.nome}</h4>
              <div className="flex gap-2">
                <span className="bg-orange-600 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase">{ex.series} Séries</span>
                {/* BOTÃO COM EFEITO DE CLICK */}
                <button
                  onClick={() => setGifAtivo({ nome: ex.nome, arquivo: ex.arquivo || formatarNomeArquivo(ex.nome) })}
                  className="bg-white/10 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase active:bg-white active:text-black transition-all"
                >
                  ▶ Ver GIF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaExercicios;