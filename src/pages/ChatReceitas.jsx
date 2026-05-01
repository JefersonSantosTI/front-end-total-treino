import { useState, useEffect, useRef } from "react";
import ListaMessagens from "../components/ListaMessagens";
import ChatBox from "../components/ChatBox";
import { api } from "../services/api";

// Adicionamos 'perfil' nas props que o componente recebe
const ChatReceitas = ({ whatsapp, isVip, aoPedirUpgrade, aoAtualizarPerfil, setTreinoIAPescado, perfil }) => {
    const [loading, setLoading] = useState(false);
    const [mensagens, setMensagens] = useState([]);
    const [mostrarBotãoUpgrade, setMostrarBotãoUpgrade] = useState(false);
    const scrollRef = useRef(null);

    const LIMITE_FREE = 6;

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const extrairEGuardarDados = (texto) => {
        if (!texto) return;
        const txt = texto.toLowerCase();
        let mudou = false;

        if ((txt.includes("séries") || txt.includes("repetições") || txt.includes("treino montado")) && typeof setTreinoIAPescado === 'function') {
            setTreinoIAPescado(texto);
        }

        // Lógica de extração simplificada (já que agora temos o perfil oficial vindo do App)
        const matchNome = texto.match(/(?:Obrigado|Perfeito|Olá|entendido),?\s+([a-zA-Záàâãéèêíïóôõöúçñ]{3,})/i);
        if (matchNome?.[1]) {
            localStorage.setItem("perfil_nome", matchNome[1]);
            mudou = true;
        }

        if (mudou && typeof aoAtualizarPerfil === 'function') {
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

            // Se o histórico estiver vazio, enviamos uma mensagem oculta para a IA iniciar
            if (dados.length === 0) {
                onEnviarMensagem("Olá! Inicie minha consultoria agora.", true);
                return;
            }

            const totalMsgUsuario = dados.filter(m => m.role === "user").length;
            let detectouBloqueioManual = !isVip && totalMsgUsuario >= LIMITE_FREE;
            let detectouBloqueioIA = false;

            const historicoFormatado = dados.map((msg, index) => {
                let texto = msg.content || "";
                if (isVip) {
                    texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)")
                        .replace(/Para visualizar o restante.*/gi, "Plano VIP Ativado! 💪");
                } else if (texto.toUpperCase().includes("BLOQUEADO")) {
                    detectouBloqueioIA = true;
                }
                return { id: index, texto, remetente: msg.role === "assistant" ? "bot" : "usuario" };
            });

            setMostrarBotãoUpgrade(detectouBloqueioManual || detectouBloqueioIA);
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

    // Adicionamos o parâmetro 'silencioso' para a primeira saudação
    const onEnviarMensagem = async (textoDigitado, silencioso = false) => {
        if (!textoDigitado.trim()) return;

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
                    idade: perfil?.idade || 25, // <--- ADICIONE ESTA LINHA AQUI
                    meta: perfil?.meta || "Emagrecimento",
                    imc: perfil?.imc || "0",
                    tmb: perfil?.tmb || "0"
                }
            });

            const respostaTexto = response.data.resposta || "";
            extrairEGuardarDados(respostaTexto);

            setMensagens(prev => [...prev, {
                id: Date.now() + 1,
                texto: isVip ? respostaTexto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "").replace(/Para visualizar o restante.*/gi, "") : respostaTexto,
                remetente: "bot"
            }]);
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
                        {mostrarBotãoUpgrade && !isVip && (
                            <div className="w-full mt-8 flex flex-col items-center">
                                <button onClick={aoPedirUpgrade} className="w-full max-w-xs bg-orange-500 text-white font-black py-5 rounded-[2rem] shadow-lg uppercase text-sm">
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
                    <ChatBox onEnviarMensagem={onEnviarMensagem} desabilitado={loading || (mostrarBotãoUpgrade && !isVip)} />
                </div>
            </footer>
        </div>
    );
};

export default ChatReceitas;