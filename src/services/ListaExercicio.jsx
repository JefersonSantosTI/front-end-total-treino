import { useState, useEffect } from "react";

const ListaExercicios = ({ whatsapp, aoFechar, API_URL, modalidade, perfil, treinoIA }) => {
  const [etapaIA, setEtapaIA] = useState('escolher_objetivo');
  const [treinoFixosAtivo, setTreinoFixosAtivo] = useState('A');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [faseTreino, setFaseTreino] = useState("");
  const [gifAtivo, setGifAtivo] = useState(null);

  // Novo estado para controlar o Plano Completo e o Dia que o aluno está olhando
  const [planoSemanalIA, setPlanoSemanalIA] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState("");

  const diasSemanas = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaAtualSistema = diasSemanas[new Date().getDay()];

  // 1. EFEITO DE MEMÓRIA: Verifica se o aluno já tem um treino salvo no banco
  useEffect(() => {
    if (modalidade === 'ia' && treinoIA && treinoIA.length > 0) {
      setPlanoSemanalIA(treinoIA);
      setDiaSelecionado(diaAtualSistema);
      setEtapaIA('treino_ia'); // Pula a tela de gerar treino!
    } else {
      setDiaSelecionado(diaAtualSistema);
    }
  }, [treinoIA, modalidade, diaAtualSistema]);

  const formatarNomeArquivo = (nome) => {
    return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
      // Mandamos todos os dados do aluno para a IA ser extremamente precisa
      const response = await fetch(`${API_URL}/usuarios/gerar-treino-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp,
          objetivo,
          perfil: {
            peso: perfil.peso,
            altura: perfil.altura,
            idade: perfil.idade,
            nivel: perfil.nivel,
            diasTreino: perfil.diasTreino,
            restricoes: perfil.restricoes,
            lesoes: perfil.lesoes
          }
        })
      });
      const dadosIA = await response.json();

      if (dadosIA.treinoSemanal) {
        setPlanoSemanalIA(dadosIA.treinoSemanal);
        setFaseTreino(dadosIA.fase || "Plano Elite IA");
        setDiaSelecionado(diaAtualSistema);
        setEtapaIA('treino_ia');

        // ⚠️ IMPORTANTE: O seu backend agora precisa salvar esse "dadosIA.treinoSemanal" 
        // no banco de dados do usuário para ele não sumir amanhã!
      } else {
        alert("A IA não retornou o formato semanal corretamente. Tente novamente.");
      }
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
        <h3 className="font-black italic text-orange-500 uppercase">{modalidade === 'ia' ? 'Mentor IA Elite' : 'Treino Fixo'}</h3>
      </header>

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

      {/* TELA DE GERAÇÃO (SÓ APARECE SE NÃO TIVER TREINO SALVO) */}
      {modalidade === 'ia' && etapaIA === 'escolher_objetivo' ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="text-center mb-4">
            <div className={`text-5xl mb-4 ${carregandoIA ? 'animate-pulse' : ''}`}>🤖</div>
            <h2 className="text-xl font-bold uppercase tracking-tighter text-white">
              {carregandoIA ? "A IA ESTÁ CALCULANDO..." : "Defina seu Foco"}
            </h2>
            {carregandoIA && (
              <p className="text-orange-500 text-[10px] font-black uppercase mt-2 animate-bounce">Processando biometria e estruturando planilha...</p>
            )}
          </div>
          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Hipertrofia")} className="w-full bg-orange-600 p-8 rounded-[2.5rem] font-black uppercase italic shadow-xl active:scale-95 transition-all disabled:opacity-50">💪 Hipertrofia Absoluta</button>
          <button disabled={carregandoIA} onClick={() => gerarTreinoIA("Emagrecimento")} className="w-full bg-white/5 border p-8 rounded-[2.5rem] font-black uppercase italic active:scale-95 transition-all disabled:opacity-50">🔥 Queima Acelerada</button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-10">

          {/* NAVEGAÇÃO DOS DIAS DA SEMANA (SÓ PARA A IA) */}
          {modalidade === 'ia' && planoSemanalIA.length > 0 && (
            <>
              <div className="bg-gray-900 border border-orange-500/20 p-4 rounded-[1.5rem] mb-2 text-center">
                <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest mb-1">Planejamento Ativo</p>
                <h4 className="text-lg font-black uppercase italic text-white">{faseTreino}</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {diasSemanas.map((dia) => (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(dia)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all flex-shrink-0 ${diaSelecionado === dia ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-800 text-gray-400'}`}
                  >
                    {dia.slice(0, 3)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* NAVEGAÇÃO DO TREINO FIXO (A, B, C) */}
          {modalidade !== 'ia' && (
            <div className="flex gap-2 mb-4">
              {['A', 'B', 'C'].map(letra => (
                <button key={letra} onClick={() => setTreinoFixosAtivo(letra)} className={`px-4 py-2 rounded-full text-xs font-black ${treinoFixosAtivo === letra ? 'bg-orange-600' : 'bg-white/10'}`}>{letra}</button>
              ))}
            </div>
          )}

          {/* RENDERIZAÇÃO DOS EXERCÍCIOS */}
          {(() => {
            let exerciciosDoDia = [];

            if (modalidade === 'ia') {
              const rotina = planoSemanalIA.find(t => t.dia === diaSelecionado);
              exerciciosDoDia = rotina ? rotina.exercicios : [];

              if (exerciciosDoDia.length === 0) {
                return (
                  <div className="bg-gray-900 p-8 rounded-[2rem] text-center border border-white/5">
                    <p className="text-gray-500 text-xs font-black uppercase italic">Nenhum treino prescrito. Dia de Descanso! 🧘‍♂️</p>
                  </div>
                );
              }
            } else {
              exerciciosDoDia = treinosFixosData[treinoFixosAtivo];
            }

            return exerciciosDoDia.map((ex, i) => (
              <div key={i} className="bg-gray-900 border border-white/5 p-5 rounded-[2rem] shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="text-base font-black uppercase italic text-white leading-tight mb-2">{ex.nome}</h4>
                    <div className="flex gap-2">
                      <span className="bg-orange-600/20 text-orange-500 border border-orange-500/30 text-[9px] font-black px-2 py-1 rounded uppercase">{ex.series}X {ex.reps} REPS</span>
                      <button
                        onClick={() => setGifAtivo({ nome: ex.nome, arquivo: ex.arquivo || formatarNomeArquivo(ex.nome) })}
                        className="bg-white/10 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase active:bg-white active:text-black transition-all"
                      >
                        ▶ Ver GIF
                      </button>
                    </div>
                  </div>
                </div>
                {ex.obs && (
                  <div className="bg-black/40 p-3 rounded-xl mt-3 border-l-2 border-orange-500">
                    <p className="text-gray-400 text-[9px] font-bold uppercase italic leading-relaxed"><span className="text-orange-500 font-black">Coach:</span> {ex.obs}</p>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

export default ListaExercicios;