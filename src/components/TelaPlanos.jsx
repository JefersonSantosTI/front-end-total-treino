import React from 'react';

const TelaPlanos = () => {
    const planos = [
        {
            nome: "Trimestral",
            periodo: "3 Meses",
            precoMensal: "17,90",
            total: "53,70",
            destaque: false,
            linkKiwify: "https://pay.kiwify.com.br/bphu4Hm" // Atualize aqui
        },
        {
            nome: "Semestral",
            periodo: "6 Meses",
            precoMensal: "11,90",
            total: "71,40",
            destaque: true,
            linkKiwify: "https://pay.kiwify.com.br/7P3T9XB" // Atualize aqui
        },
        {
            nome: "Anual",
            periodo: "1 Ano",
            precoMensal: "7,90",
            total: "94,80",
            destaque: false,
            linkKiwify: "https://pay.kiwify.com.br/akNIH4p"
        }
    ];

    return (
        <div className="w-full text-center p-4">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-emerald-400 uppercase italic">Acesso VIP Ilimitado</h2>
                <p className="text-gray-400 text-sm mt-1">Liberação imediata via Cartão ou PIX</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planos.map((plano, index) => (
                    <div
                        key={index}
                        className={`relative p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${plano.destaque
                            ? 'border-emerald-500 bg-gray-800 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                            : 'border-gray-700 bg-gray-850 opacity-80 hover:opacity-100'
                            }`}
                    >
                        {plano.destaque && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase">
                                Mais Vendido
                            </span>
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-white">{plano.nome}</h3>
                            <div className="my-4">
                                <span className="text-4xl font-black text-white">R$ {plano.precoMensal}</span>
                                <span className="text-gray-400 text-sm italic"> /mês</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest">Pagamento único de R$ {plano.total}</p>
                        </div>

                        <ul className="text-left text-xs space-y-3 mb-8 text-gray-300">
                            <li>✅ IA desbloqueada sem limites</li>
                            <li>✅ Cardápio completo (Almoço/Jantar)</li>
                            <li>✅ Planilha de Treino personalizada</li>
                            <li>✅ Liberação automática após o pagamento</li>
                        </ul>

                        {/* Trocado de button para <a> para evitar o erro de Immutability */}
                        <a
                            href={plano.linkKiwify}
                            target="_self"
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase text-center block transition-all active:scale-95 ${plano.destaque
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            Assinar Agora
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TelaPlanos;