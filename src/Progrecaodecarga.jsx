import { useState } from 'react';

// ✅ ADICIONAMOS O 'alunoId' AQUI NAS PROPS
// ✅ ADICIONAMOS A API_URL AQUI NAS PROPS!
export default function ControleDeCarga({ exercicioNome, cargaUltimoTreino, alunoId, API_URL }) {
    const [cargaAtual, setCargaAtual] = useState(cargaUltimoTreino || 0);
    const [esforco, setEsforco] = useState(null);
    const [salvo, setSalvo] = useState(false);

    const alterarCarga = (valor) => {
        setCargaAtual((prev) => (prev + valor > 0 ? prev + valor : 0));
    };

    // 🔥 AGORA A ROTA VAI PARA O SERVIDOR CERTO (Render)
    const salvarProgresso = async () => {
        setSalvo(true);

        try {
            const response = await fetch(`${API_URL}/aluno/progressao-carga`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alunoId: alunoId,
                    exercicioNome: exercicioNome,
                    carga: cargaAtual,
                    esforco: esforco
                })
            });

            const dados = await response.json();
            if (response.ok) {
                console.log("Sucesso! Gravado no MongoDB:", dados);
            } else {
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
        </div>
    );
}