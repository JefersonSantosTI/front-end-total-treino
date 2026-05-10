import { useState, useEffect, useRef } from "react";
import ListaMessagens from "../components/ListaMessagens";
import ChatBox from "../components/ChatBox";
import { api } from "../services/api";

const ChatReceitas = ({ whatsapp, isVip, aoPedirUpgrade, aoAtualizarPerfil, setTreinoIAPescado, perfil }) => {
    const [loading, setLoading] = useState(false);
    const [mensagens, setMensagens] = useState([]);
    const [mostrarBotãoUpgrade, setMostrarBotãoUpgrade] = useState(false);
    const scrollRef = useRef(null);

    const LIMITE_FREE = 2;

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Extrai dados e salva treino gerado pela IA no estado global
    const extrairEGuardarDados = (texto) => {
        if (!texto) return;
        const txt = texto.toLowerCase();
        if ((txt.includes("séries") || txt.includes("repetições") || txt.includes("treino montado")) && typeof setTreinoIAPescado === 'function') {
            setTreinoIAPescado(texto);
        }
        if (typeof aoAtualizarPerfil === 'function') {
            aoAtualizarPerfil();
        }
    };

    useEffect(() => {
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [mensagens, loading, mostrarBotãoUpgrade]);

    const carregarHistorico = async () => {
        if (!whatsapp) return;
        setLoading(true);
        try {
            const response = await api.get(`/receitas/historico/${whatsapp}`);
            const dados = Array.isArray(response.data) ? response.data : [];

            if (dados.length === 0) {
                onEnviarMensagem("Olá! Inicie minha consultoria agora.", true);
                return;
            }

            // Conta quantas vezes o usuário já falou
            const totalMsgUsuario = dados.filter(m => m.role === "user").length;
            const detectouBloqueio = !isVip && totalMsgUsuario >= LIMITE_FREE;

            const historicoFormatado = dados.map((msg, index) => ({
                id: index,
                texto: msg.content,
                remetente: msg.role === "assistant" ? "bot" : "usuario"
            }));

            setMostrarBotãoUpgrade(detectouBloqueio);
            setMensagens(historicoFormatado);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarHistorico();
    }, [whatsapp, isVip]);

    const onEnviarMensagem = async (textoDigitado, silencioso = false) => {
        if (!textoDigitado.trim()) return;

        // Se for Free e atingiu o limite, bloqueia o envio
        if (!silencioso) {
            const msgsEnviadas = mensagens.filter(m => m.remetente === "usuario").length;
            if (!isVip && msgsEnviadas >= LIMITE_FREE) {
                setMostrarBotãoUpgrade(true);
                return;
            }
            const novaMsgUser = { id: Date.now(), texto: textoDigitado, remetente: "usuario" };
            setMensagens(prev => [...prev, novaMsgUser]);
        }

        setLoading(true);
        try {
            const response = await api.post("/receitas/perguntar", {
                whatsapp,
                mensagemAtual: textoDigitado,
                perfilExtraido: {
                    nome: perfil?.nome || "Guerreiro",
                    peso: perfil?.peso || 75,
                    altura: perfil?.altura || 1.70,
                    idade: perfil?.idade || 25,
                    meta: perfil?.meta || "Emagrecimento",
                    imc: perfil?.imc || "0",
                    tmb: perfil?.tmb || "0"
                }
            });

            const respostaTexto = response.data.resposta || "";
            extrairEGuardarDados(respostaTexto);

            setMensagens(prev => [...prev, {
                id: Date.now() + 1,
                texto: respostaTexto,
                remetente: "bot"
            }]);

            // Se for a última mensagem permitida, mostra o botão logo após a resposta da IA
            const totalAposEnvio = mensagens.filter(m => m.remetente === "usuario").length + 1;
            if (!isVip && totalAposEnvio >= LIMITE_FREE) {
                setMostrarBotãoUpgrade(true);
            }

        } catch (error) {
            console.error("Erro ao enviar:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full font-sans bg-gray-950 text-white">
            <main className="flex-1 relative overflow-hidden bg-gray-950">
                <div className="absolute inset-0 overflow-y-auto px-4 py-4 z-10 custom-scrollbar">
                    <div className="max-w-2xl mx-auto w-full pb-10">
                        <ListaMessagens mensagens={mensagens} loading={loading} />

                        {/* BOTÃO VIP APARECE AQUI APÓS 6 MENSAGENS */}
                        {mostrarBotãoUpgrade && !isVip && (
                            <div className="w-full mt-8 flex flex-col items-center animate-in zoom-in duration-300">
                                <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[2.5rem] text-center mb-6">
                                    <p className="text-orange-500 font-black uppercase text-xs tracking-widest mb-2">Limite do Teste Atingido</p>
                                    <p className="text-gray-400 text-sm italic">Assine o Plano VIP para liberar dietas ilimitadas e seu Mentor de Treino IA.</p>
                                </div>
                                <button onClick={aoPedirUpgrade} className="w-full max-w-xs bg-orange-500 text-white font-black py-5 rounded-[2rem] shadow-[0_10px_30px_rgba(249,115,22,0.3)] uppercase text-sm active:scale-95 transition-all">
                                    🚀 Liberar Acesso VIP Agora
                                </button>
                            </div>
                        )}
                        <div ref={scrollRef} className="h-4 w-full" />
                    </div>
                </div>
            </main>
            <footer className="bg-gray-950 px-4 pb-6 pt-2 z-30">
                <div className="max-w-2xl mx-auto">
                    {/* O ChatBox fica desabilitado se atingir o limite e não for VIP */}
                    <ChatBox
                        onEnviarMensagem={onEnviarMensagem}
                        desabilitado={loading || (mostrarBotãoUpgrade && !isVip)}
                    />
                </div>
            </footer>
        </div>
    );
};

export default ChatReceitas;