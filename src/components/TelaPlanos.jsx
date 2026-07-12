import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

// ==========================================
// 1. COMPONENTE DE ESPERA HÍBRIDO (SOCKET)
// ==========================================
export function TelaAguardandoPagamento({ emailDoUsuarioLogado, whatsappDoUsuarioLogado, tipoUsuario, setAguardando }) {
    const navigate = useNavigate();
    const [statusTela, setStatusTela] = useState("Aguardando confirmação do pagamento...");

    useEffect(() => {
        // 🔥 URL Oficial de Produção (Resolve o erro 404 e CORS)
        const URL_PRODUCAO = "https://api.treinofit.app.br";

        const socket = io(URL_PRODUCAO, {
            withCredentials: true
        });

        // 🧠 Inteligência Híbrida: Define se escuta o E-mail (Personal) ou o WhatsApp (Aluno)
        const obterSalaCorreta = () => {
            if (tipoUsuario === "personal") {
                return emailDoUsuarioLogado;
            }
            const numeroLimpo = String(whatsappDoUsuarioLogado || "").replace(/\D/g, "");
            return numeroLimpo.startsWith("55") ? numeroLimpo.slice(2) : numeroLimpo;
        };

        const salaAtiva = obterSalaCorreta();

        console.log(`📡 Conectando ao canal de pagamentos da sala: ${salaAtiva}`);
        socket.emit("entrar_sala_pagamento", salaAtiva);

        socket.on("pagamento_aprovado", (dados) => {
            console.log("🔥 Sinal de pagamento capturado via Socket!", dados);
            setStatusTela(dados.mensagem || "💎 Acesso Liberado!");
            localStorage.removeItem("pagamento_iniciado");

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
    }, [emailDoUsuarioLogado, whatsappDoUsuarioLogado, tipoUsuario, navigate]);

    return (
        <div className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="bg-gray-900 border border-sky-500/20 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl">
                <div className="text-5xl mb-4 animate-bounce">💳</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-2">Status do Pagamento</h2>
                <h3 className="text-base font-black italic text-sky-400 uppercase tracking-wide mb-6">
                    {statusTela}
                </h3>

                {statusTela.includes("Aguardando") ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Sincronizando com a Kiwify...</p>
                        <p className="text-xs text-gray-500 mt-2">Complete o pagamento na aba segura. Esta tela atualizará sozinha!</p>

                        {/* Botão de voltar mantido para o Personal Trainer não ficar preso */}
                        {setAguardando && (
                            <button
                                onClick={() => {
                                    localStorage.removeItem("pagamento_iniciado");
                                    setAguardando(false);
                                }}
                                className="mt-6 text-xs text-gray-500 underline hover:text-white transition-colors"
                            >
                                Voltar para os planos
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-emerald-400 font-black text-lg uppercase animate-pulse">🚀 Acesso Liberado!</p>
                        <p className="text-xs text-gray-400">Preparando seu ambiente...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 2. TELA DE PLANOS PRINCIPAL
// ==========================================


const TelaPlanos = ({ emailDoUsuario, whatsappDoUsuario }) => {
    const [aguardandoPagamento, setAguardandoPagamento] = useState(() => {
        return localStorage.getItem("pagamento_iniciado") === "true";
    });

    const planos = [
        {
            nome: "Trimestral",
            periodo: "3 Meses",
            precoMensal: "17,90",
            total: "53,70",
            destaque: false,
            linkKiwify: "https://pay.kiwify.com.br/bphu4Hm"
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

    if (aguardandoPagamento) {
        return (
            <TelaAguardandoPagamento
                emailDoUsuarioLogado={emailDoUsuario}
                whatsappDoUsuarioLogado={whatsappDoUsuario} // 🔥 2. Passe o WhatsApp para a sala
                tipoUsuario="aluno" // 🔥 3. Avise que é a tela do Aluno!
                setAguardando={setAguardandoPagamento}
            />
        );
    }

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
                            onClick={() => {
                                // Salva que o pagamento foi iniciado
                                localStorage.setItem("pagamento_iniciado", "true");
                                setAguardandoPagamento(true);
                            }}
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