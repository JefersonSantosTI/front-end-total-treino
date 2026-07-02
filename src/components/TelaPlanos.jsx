import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const URL_DO_BACKEND = 'https://sua-api-treinofit.onrender.com';

// ==========================================
// 1. COMPONENTE DE ESPERA (SOCKET)
// ==========================================
export function TelaAguardandoPagamento({ emailDoUsuarioLogado, setAguardando }) {
    const navigate = useNavigate();
    const [statusTela, setStatusTela] = useState("Aguardando confirmação do pagamento...");

    useEffect(() => {
        const socket = io(URL_DO_BACKEND);
        socket.emit("entrar_sala_pagamento", emailDoUsuarioLogado);

        socket.on("pagamento_aprovado", (dados) => {
            console.log("🔥 Pagamento confirmado via Socket!", dados);
            setStatusTela(dados.mensagem);

            setTimeout(() => {
                if (dados.tipo === "personal") {
                    navigate("/painel-personal");
                } else if (dados.tipo === "aluno") {
                    navigate("/area-aluno");
                }
            }, 2000);
        });

        return () => {
            socket.disconnect();
        };
    }, [emailDoUsuarioLogado, navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }} className="text-white">
            <h2 className="text-2xl font-black mb-4">💳 Status do Pagamento:</h2>
            <h3 className="text-xl text-emerald-400 mb-6">{statusTela}</h3>

            {statusTela.includes("Aguardando") ? (
                <div>
                    <p className="mb-4">⏳ Escutando a Kiwify...</p>
                    <p className="text-sm text-gray-400">Complete o pagamento na outra aba. Esta tela atualizará sozinha!</p>
                    {/* Botão caso o usuário queira voltar ou tenha fechado a aba da Kiwify sem querer */}
                    <button onClick={() => setAguardando(false)} className="mt-8 text-sm text-gray-500 underline">
                        Voltar para os planos
                    </button>
                </div>
            ) : (
                <p className="text-2xl font-bold text-emerald-500">✅ Acesso Liberado!</p>
            )}
        </div>
    );
}

// ==========================================
// 2. TELA DE PLANOS PRINCIPAL
// ==========================================
const TelaPlanos = ({ emailDoUsuario }) => {
    // Criamos um estado para controlar se mostramos os planos ou a tela de espera
    const [aguardandoPagamento, setAguardandoPagamento] = useState(false);

    const planos = [
        {
            nome: "Trimestral",
            periodo: "3 Meses",
            precoMensal: "17,90",
            total: "53,70",
            destaque: false,
            linkKiwify: "https://pay.kiwify.com.br/3TMozok"
        },
        {
            nome: "Semestral",
            periodo: "6 Meses",
            precoMensal: "11,90",
            total: "71,40",
            destaque: true,
            linkKiwify: "https://pay.kiwify.com.br/7P3T9XB"
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

    // Se o usuário clicou em comprar, mostramos a tela do Socket
    if (aguardandoPagamento) {
        return (
            <TelaAguardandoPagamento
                emailDoUsuarioLogado={emailDoUsuario}
                setAguardando={setAguardandoPagamento}
            />
        );
    }

    // Se não clicou ainda, mostramos os planos normais
    return (
        <div className="w-full text-center p-4">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-emerald-400 uppercase italic">Acesso VIP Ilimitado</h2>
                <p className="text-gray-300 font-bold text-base mt-1">Liberação imediata via Cartão ou PIX</p>
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
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-black px-4 py-1 rounded-full uppercase">
                                Mais Vendido
                            </span>
                        )}

                        <div>
                            <h3 className="text-xl font-black text-white">{plano.nome}</h3>
                            <div className="my-4">
                                <span className="text-4xl font-black text-white">R$ {plano.precoMensal}</span>
                                <span className="text-gray-300 font-bold text-base italic"> /mês</span>
                            </div>
                            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">Pagamento único de R$ {plano.total}</p>
                        </div>

                        <ul className="text-left text-sm font-bold space-y-3 mb-8 text-gray-200">
                            <li>✅ IA desbloqueada sem limites</li>
                            <li>✅ Cardápio completo (Almoço/Jantar)</li>
                            <li>✅ Planilha de Treino personalizada</li>
                            <li>✅ Liberação automática após o pagamento</li>
                        </ul>

                        <a
                            href={plano.linkKiwify}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setAguardandoPagamento(true)} // 🚀 A mágica acontece aqui!
                            className={`w-full py-4 rounded-xl font-black text-base uppercase text-center block transition-all active:scale-95 ${plano.destaque
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