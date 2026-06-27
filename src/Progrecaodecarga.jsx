import { useState } from 'react';

// ✅ ADICIONAMOS O 'alunoId' AQUI NAS PROPS
export default function ControleDeCarga({ exercicioNome, cargaUltimoTreino, alunoId }) {
    const [cargaAtual, setCargaAtual] = useState(cargaUltimoTreino || 0);
    const [esforco, setEsforco] = useState(null);
    const [salvo, setSalvo] = useState(false);

    const alterarCarga = (valor) => {
        setCargaAtual((prev) => (prev + valor > 0 ? prev + valor : 0));
    };

    // 🔥 A FUNÇÃO MÁGICA QUE CONECTA COM O BACKEND
    const salvarProgresso = async () => {
        setSalvo(true); // Fica verde na hora pro aluno ter resposta rápida

        try {
            // Mandando os dados para a rota nova do seu backend
            // (Se o seu front rodar local, usa http://localhost:10000/aluno/progressao-carga)
            // Se já estiver no ar, mude para a URL do seu Render: 'https://sua-api.onrender.com/aluno/progressao-carga'
            const response = await fetch('/aluno/progressao-carga', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alunoId: alunoId, // ID do aluno logado
                    exercicioNome: exercicioNome,
                    carga: cargaAtual,
                    esforco: esforco
                })
            });

            const dados = await response.json();
            if (response.ok) {
                console.log("Sucesso! Gravado no MongoDB:", dados);
            } else {
                console.error("Erro do servidor:", dados.erro);
                setSalvo(false);
            }

        } catch (error) {
            console.error("Erro na requisição:", error);
            setSalvo(false);
        }
    };

    return (
        <div className="bg-[#1c1d26] border border-neutral-800 p-4 rounded-2xl mt-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Carga (kg)</p>
                    {cargaUltimoTreino > 0 && (
                        <p className="text-sky-500 text-[10px]">Última: {cargaUltimoTreino}kg</p>
                    )}
                </div>

                <div className="flex items-center gap-3 bg-[#0d0e12] p-1.5 rounded-xl border border-neutral-800">
                    <button onClick={() => alterarCarga(-1)} className="w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-lg transition-colors">-</button>
                    <input type="number" value={cargaAtual} onChange={(e) => setCargaAtual(Number(e.target.value))} className="w-16 h-10 bg-transparent text-white text-center font-black text-xl outline-none" />
                    <button onClick={() => alterarCarga(1)} className="w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-lg transition-colors">+</button>
                </div>
            </div>

            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Como foi o esforço?</p>
            <div className="flex gap-2 mb-4">
                <button onClick={() => setEsforco('facil')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${esforco === 'facil' ? 'bg-green-500/20 text-green-400 border-2 border-green-500' : 'bg-[#0d0e12] text-gray-500 border-2 border-transparent hover:border-neutral-700'}`}>🟢 Fácil</button>
                <button onClick={() => setEsforco('ideal')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${esforco === 'ideal' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500' : 'bg-[#0d0e12] text-gray-500 border-2 border-transparent hover:border-neutral-700'}`}>🟡 Ideal</button>
                <button onClick={() => setEsforco('dificil')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${esforco === 'dificil' ? 'bg-red-500/20 text-red-400 border-2 border-red-500' : 'bg-[#0d0e12] text-gray-500 border-2 border-transparent hover:border-neutral-700'}`}>🔴 Difícil</button>
            </div>

            <button onClick={salvarProgresso} disabled={esforco === null} className={`w-full py-3 rounded-xl font-black uppercase tracking-wider transition-all ${salvo ? 'bg-green-500 text-white' : esforco !== null ? 'bg-sky-500 text-white hover:bg-sky-400' : 'bg-neutral-800 text-gray-500 cursor-not-allowed'}`}>
                {salvo ? '✓ Salvo!' : 'Confirmar Série'}
            </button>

            {salvo && cargaAtual > (cargaUltimoTreino || 0) && (cargaUltimoTreino || 0) > 0 && (
                <div className="mt-3 text-center animate-bounce">
                    <p className="text-green-400 text-sm font-bold">🔥 Novo Recorde! +{cargaAtual - cargaUltimoTreino}kg</p>
                </div>
            )}
        </div>
    );
}