import React, { useState } from 'react';

// ✅ REMOVIDO o 'alunoLogado' daqui de cima, deixando apenas o que realmente usamos.
export default function OnboardingNotificacao({ aoConcluir }) {
    const [passo, setPasso] = useState(1);

    // Função que dispara o pedido oficial do navegador
    const solicitarPermissao = async () => {
        try {
            const permissao = await Notification.requestPermission();
            if (permissao === 'granted') {
                alert("✅ Tudo pronto! Agora você receberá nossos alertas.");
                aoConcluir(); // Fecha o modal e segue a vida
            } else {
                alert("❌ Permissão negada. Você não receberá os lembretes de água.");
                aoConcluir(); // Fecha o modal mesmo assim
            }
        } catch (error) {
            console.error("Erro ao pedir permissão:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#16171d] border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">

                {/* Efeito de brilho de fundo */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full"></div>

                {passo === 1 && (
                    <div className="flex flex-col items-center text-center animate-fade-in">
                        <div className="text-6xl mb-4 animate-bounce">💧</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Não deixe sua performance cair!
                        </h2>
                        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                            Para garantir que você atinja sua meta diária de água, preparamos alertas inteligentes.
                            <strong> Nós avisamos, você bebe.</strong> Simples assim.
                        </p>

                        <button
                            onClick={() => setPasso(2)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30"
                        >
                            Quero receber os avisos
                        </button>
                        <button
                            onClick={aoConcluir}
                            className="mt-4 text-xs text-neutral-500 hover:text-white transition-colors"
                        >
                            Pular esta etapa (Não recomendado)
                        </button>
                    </div>
                )}

                {passo === 2 && (
                    <div className="flex flex-col items-center text-center animate-fade-in">
                        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 w-full mb-6">
                            <p className="text-neutral-300 text-sm font-medium mb-3">
                                Fique atento ao aviso do seu navegador:
                            </p>
                            {/* Ilustração simplificada do prompt do navegador */}
                            <div className="bg-white rounded p-3 text-left shadow-lg">
                                <p className="text-black text-xs font-bold mb-2">treinofit quer enviar notificações</p>
                                <div className="flex justify-end gap-2">
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">Bloquear</span>
                                    <span className="text-[10px] text-white bg-blue-600 px-2 py-1 rounded font-bold animate-pulse">Permitir</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">
                            Clique em "Permitir"
                        </h3>
                        <p className="text-neutral-400 text-xs mb-6">
                            Ao clicar no botão abaixo, o seu celular vai pedir uma autorização. Clique em <strong>Permitir</strong> para habilitar o alerta silencioso.
                        </p>

                        <button
                            onClick={solicitarPermissao}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30"
                        >
                            Habilitar Notificações Agora
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}