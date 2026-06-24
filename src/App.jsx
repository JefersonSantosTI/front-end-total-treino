import './Home.css';
import { toBlob } from 'html-to-image';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useCallback, useRef } from "react";
import ListaExercicios from "./services/ListaExercicio";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

// ✅ IMPORT DO NOVO ONBOARDING ADICIONADO AQUI
import OnboardingNotificacao from "./components/OnboardingNotificacao";

// eslint-disable-next-line no-unused-vars
import { abrirExercicioVisual } from "./components/visual";

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const parseNumeroSeguro = (val) => Number(String(val).replace(',', '.')) || 0;

// ✅ FUNÇÃO OBRIGATÓRIA PARA O PUSH FUNCIONAR NO IPHONE/ANDROID
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

function App() {
    // =========================================================================
    // 1. TODOS OS ESTADOS (HOOKS)
    // =========================================================================
    const [configAgua, setConfigAgua] = useState({ ativo: false, horaInicio: 8, horaFim: 22, intervaloHoras: 2, tipoFrequencia: 'Definitivo' });
    const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario_whatsapp"));
    const [etapa, setEtapa] = useState("verificando");
    const [abaAtiva, setAbaAtiva] = useState(() => localStorage.getItem("treino_fit_aba") || "home");
    const [isVip, setIsVip] = useState(false);
    const [treinoIAPescado, setTreinoIAPescado] = useState(null);
    const [bloqueado, setBloqueado] = useState(false);
    const [modalidadeAberta, setModalidadeAberta] = useState(null);

    const [seriesFeitas, setSeriesFeitas] = useState({});
    const [timerDescanso, setTimerDescanso] = useState(0);
    const [timerAtivo, setTimerAtivo] = useState(false);

    const [personalLogado, setPersonalLogado] = useState(() => {
        const salvo = localStorage.getItem("treino_fit_personal");
        return salvo ? JSON.parse(salvo) : null;
    });

    const [cref, setCref] = useState("");
    const [googleUser, setGoogleUser] = useState(null);
    const [alunoLogado, setAlunoLogado] = useState(null);
    const [codigoAcessoAluno, setCodigoAcessoAluno] = useState("");
    const [exerciciosConcluidos, setExerciciosConcluidos] = useState([]);
    const [alunosPersonal, setAlunosPersonal] = useState([]);

    const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);

    // eslint-disable-next-line no-unused-vars
    const [modalGifAberto, setModalGifAberto] = useState(null);

    const [alunoEditandoPerfil, setAlunoEditandoPerfil] = useState(null);

    // eslint-disable-next-line no-unused-vars
    const [isRecalculando, setIsRecalculando] = useState(false);

    // eslint-disable-next-line no-unused-vars
    const [modoEdicaoBiometria, setModoEdicaoBiometria] = useState(false);

    const [modalFeedbackAberto, setModalFeedbackAberto] = useState(false);
    const [feedbackTreino, setFeedbackTreino] = useState({ intensidade: "Moderado 🟡", carga: "Na medida ✅", comentario: "" });
    const [alunoVerFeedback, setAlunoVerFeedback] = useState(null);
    const [respostasFeedback, setRespostasFeedback] = useState({});

    // eslint-disable-next-line no-unused-vars
    const [modalDobrasAberto, setModalDobrasAberto] = useState(false);

    // eslint-disable-next-line no-unused-vars
    const [dobrasForm, setDobrasForm] = useState({ triceps: '', torax: '', subescapular: '', axilar: '', iliaca: '', abdominal: '', coxa: '' });

    const [modalPlanosPersonal, setModalPlanosPersonal] = useState(false);

    const [modalAvaliacaoAluno, setModalAvaliacaoAluno] = useState(false);
    const [alunoVerAvaliacao, setAlunoVerAvaliacao] = useState(null);

    const [treinoForm, setTreinoForm] = useState([]);
    const [dietaForm, setDietaForm] = useState([]);
    const [aguaForm, setAguaForm] = useState("");
    const [diaAbaAluno, setDiaAbaAluno] = useState("Segunda");
    const [diaAbaPersonal, setDiaAbaPersonal] = useState("Segunda");

    // eslint-disable-next-line no-unused-vars
    const [modalNovoAluno, setModalNovoAluno] = useState(false);
    const [novoAlunoForm, setNovoAlunoForm] = useState({ nome: "", whatsapp: "", objetivo: "Emagrecimento" });

    const [perfil, setPerfil] = useState({
        nome: "Guerreiro(a)", peso: "", altura: "", idade: "", meta: "Emagrecimento",
        genero: "Masculino", nivel: "Intermediário", diasTreino: "5", restricoes: "", lesoes: "",
        imc: "0", tmb: "0", faltam: "0"
    });

    const [quizStep, setQuizStep] = useState(1);
    const [alimentosFavoritos, setAlimentosFavoritos] = useState([]);

    // ESTADOS PARA O CARD DO INSTAGRAM
    const [modalShareAberto, setModalShareAberto] = useState(false);
    const [dadosShare, setDadosShare] = useState(null);

    // ✅ NOVO ESTADO DO ONBOARDING DE NOTIFICAÇÃO
    const [mostrarOnboardingNotificacao, setMostrarOnboardingNotificacao] = useState(false);
    const [menuEntrarAberto, setMenuEntrarAberto] = useState(false);


    const API_URL = "https://api-backend-treino-fit.onrender.com/api";
    const verificandoRef = useRef(false);
    const KIWIFY_MENSAL = "https://pay.kiwify.com.br/O5ggnzX";
    const KIWIFY_ANUAL = "https://pay.kiwify.com.br/vbvKtGY";

    // =========================================================================
    // ✅ NOVO EFFECT DO ONBOARDING (Aparece ao entrar como aluno)
    // =========================================================================
    useEffect(() => {
        if (etapa === "aluno" && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            setMostrarOnboardingNotificacao(true);
        }
    }, [etapa]);


    // =========================================================================
    // 2. LÓGICAS DE CRONÔMETRO, SÉRIES E EXERCÍCIOS
    // =========================================================================

    useEffect(() => {
        let intervalo;
        if (timerAtivo && timerDescanso > 0) {
            intervalo = setInterval(() => {
                setTimerDescanso((prev) => prev - 1);
            }, 1000);
        } else if (timerDescanso === 0) {
            setTimerAtivo(false);
            clearInterval(intervalo);
        }
        return () => clearInterval(intervalo);
    }, [timerAtivo, timerDescanso]);

    // eslint-disable-next-line no-unused-vars
    const marcarSerie = (exIndex, numSerie, totalSeries) => {
        const chaveSerie = `${diaAbaAluno}-${exIndex}-s${numSerie}`;
        const chaveUnicaExercicio = `${diaAbaAluno}-${exIndex}`;
        const jaFeito = seriesFeitas[chaveSerie];

        setSeriesFeitas(prev => {
            const newState = { ...prev, [chaveSerie]: !jaFeito };

            const todasFeitas = Array.from({ length: totalSeries }).every((_, sIdx) =>
                (sIdx + 1 === numSerie ? !jaFeito : newState[`${diaAbaAluno}-${exIndex}-s${sIdx + 1}`])
            );

            if (todasFeitas && !exerciciosConcluidos.includes(chaveUnicaExercicio)) {
                setExerciciosConcluidos([...exerciciosConcluidos, chaveUnicaExercicio]);
            } else if (!todasFeitas && exerciciosConcluidos.includes(chaveUnicaExercicio)) {
                setExerciciosConcluidos(exerciciosConcluidos.filter(id => id !== chaveUnicaExercicio));
            }

            return newState;
        });

        if (!jaFeito) {
            setTimerDescanso(60);
            setTimerAtivo(true);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const alternarConclusaoExercicio = (chaveUnicaExercicio) => {
        if (exerciciosConcluidos.includes(chaveUnicaExercicio)) {
            setExerciciosConcluidos(exerciciosConcluidos.filter(id => id !== chaveUnicaExercicio));
            const novasSeries = { ...seriesFeitas };
            Object.keys(novasSeries).forEach(key => {
                if (key.startsWith(chaveUnicaExercicio)) {
                    novasSeries[key] = false;
                }
            });
            setSeriesFeitas(novasSeries);
        } else {
            setExerciciosConcluidos([...exerciciosConcluidos, chaveUnicaExercicio]);
        }
    };

    // =========================================================================
    // 3. EFEITOS GERAIS E SINCRONIZAÇÃO (API)
    // =========================================================================

    useEffect(() => {
        const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
        const diaFormatado = DIAS_SEMANA.find(d => diaAtualSistema.toLowerCase().includes(d.toLowerCase().slice(0, 4))) || "Segunda";
        setDiaAbaAluno(diaFormatado);
    }, []);

    const carregarAlunosAssessoria = useCallback(async () => {
        if (!personalLogado || !personalLogado._id) return;
        try {
            const response = await fetch(`${API_URL}/personal/alunos?personalId=${personalLogado._id}`);
            if (response.ok) {
                const dados = await response.json();
                setAlunosPersonal(dados);
            }
        } catch (err) { console.error("Erro ao carregar alunos:", err); }
    }, [API_URL, personalLogado]);

    useEffect(() => {
        if (etapa === "personal") carregarAlunosAssessoria();
    }, [etapa, carregarAlunosAssessoria]);

    const calcularSaude = useCallback((peso, altura, idade) => {
        const p = parseFloat(String(peso).replace(',', '.')) || 0;
        const a = parseFloat(String(altura).replace(',', '.')) || 0;
        const i = parseInt(idade) || 25;
        if (p > 0 && a > 0) {
            const imc = (p / (a * a)).toFixed(1);
            const tmb = (10 * p + (6.25 * (a * 100)) - (5 * i)).toFixed(0);
            const falta = (p * 0.1).toFixed(1);
            return { imc, tmb, falta };
        }
        return { imc: "0", tmb: "0", falta: "0" };
    }, []);

    const atualizarStatusVIP = useCallback(async () => {
        if (!usuario) return;
        try {
            const whatsLimpo = String(usuario).replace(/\D/g, "");
            if (!whatsLimpo) return; // Segurança contra chamadas vazias

            const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);
            if (response.ok) {
                const dados = await response.json();
                setIsVip(dados.pago === true);
                if (dados.treinoIA) setTreinoIAPescado(dados.treinoIA);
                if (dados.peso) {
                    const saude = calcularSaude(dados.peso, dados.altura, dados.idade);
                    setPerfil(prev => ({ ...prev, nome: dados.nome || prev.nome, peso: String(dados.peso), altura: String(dados.altura), meta: dados.meta || prev.meta, ...saude }));
                }
            }
        } catch (err) { console.error("Erro ao sincronizar VIP:", err); }
    }, [usuario, API_URL, calcularSaude]);

    const sincronizarComBanco = useCallback(async (whatsappId) => {
        if (!whatsappId || verificandoRef.current) return;
        try {
            verificandoRef.current = true;
            const whatsLimpo = String(whatsappId).replace(/\D/g, "");

            // ✅ PROTEÇÃO: Se não tiver ID válido, barra o 404 e vai pra triagem.
            if (!whatsLimpo) {
                setEtapa("triagem");
                return;
            }

            const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);
            if (response.ok) {
                const dados = await response.json();
                if (!dados.peso || dados.peso === 0) {
                    setEtapa("onboarding");
                } else {
                    const saude = calcularSaude(dados.peso, dados.altura, dados.idade);
                    setPerfil({
                        nome: dados.nome || "Guerreiro(a)", peso: String(dados.peso), altura: String(dados.altura), idade: String(dados.idade || 25),
                        meta: dados.meta || "Emagrecimento", genero: dados.genero || "Masculino", nivel: dados.nivel || "Intermediário",
                        diasTreino: dados.diasTreino || "5", restricoes: dados.restricoes || "", lesoes: dados.lesoes || "", ...saude
                    });
                    setIsVip(dados.pago === true);
                    setTreinoIAPescado(dados.treinoIA || null);
                    setEtapa("home");
                }
            } else { setEtapa("onboarding"); }
        } catch { setEtapa("onboarding"); }
        finally { verificandoRef.current = false; }
    }, [API_URL, calcularSaude]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refPersonal = urlParams.get('ref');

        if (refPersonal) {
            setEtapa("matricula_externa");
            return;
        }

        if (etapa === "verificando") {
            const personalSalvo = localStorage.getItem("treino_fit_personal");
            const usuarioSalvo = localStorage.getItem("usuario_whatsapp");

            if (personalSalvo) {
                setPersonalLogado(JSON.parse(personalSalvo));
                setEtapa("personal");
            } else if (usuarioSalvo) {
                sincronizarComBanco(usuarioSalvo);
            } else {
                setEtapa("triagem");
            }
        }
    }, [etapa, sincronizarComBanco]);


    // =========================================================================
    // 💡 LÓGICA DO RADAR DE RETENÇÃO (CÁLCULO DE DIAS SEM TREINO)
    // =========================================================================
    const calcularDiasSemTreino = (checkins) => {
        if (!checkins || checkins.length === 0) return Infinity;
        const ultimoCheckinStr = checkins[0].data; // Formato "DD/MM"
        const [dia, mes] = ultimoCheckinStr.split('/');
        const hoje = new Date();
        const dataUltimoCheckin = new Date(hoje.getFullYear(), parseInt(mes) - 1, parseInt(dia));

        if (dataUltimoCheckin > hoje) dataUltimoCheckin.setFullYear(hoje.getFullYear() - 1);

        hoje.setHours(0, 0, 0, 0);
        dataUltimoCheckin.setHours(0, 0, 0, 0);
        return Math.round((hoje - dataUltimoCheckin) / (1000 * 60 * 60 * 24));
    };

    const enviarZapRetencao = (aluno, dias) => {
        const primeiroNome = aluno.nome.split(' ')[0];
        let diasTexto = dias === Infinity ? "ainda não registrou nenhum treino no app" : `não treina há ${dias} dias`;
        const mensagem = `Fala ${primeiroNome}, vi no Treino Fit que você ${diasTexto}. Aconteceu algo? Bora voltar pro foco! 💪🔥`;
        const zap = String(aluno.whatsapp).replace(/\D/g, '');
        const url = `https://wa.me/55${zap}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    };

    // =========================================================================
    // 4. FUNÇÕES GERAIS E DO PERSONAL
    // =========================================================================

    const handleLogin = (whatsapp) => {
        const limpo = String(whatsapp).replace(/\D/g, "");
        localStorage.removeItem("treino_fit_personal");
        setPersonalLogado(null);
        localStorage.setItem("usuario_whatsapp", limpo);
        setUsuario(limpo);
        setEtapa("verificando");
    };

    const handleSair = () => {
        localStorage.removeItem("treino_fit_personal");
        localStorage.removeItem("treino_fit_aba");
        localStorage.removeItem("usuario_whatsapp");
        localStorage.clear();
        setUsuario(null);
        setPersonalLogado(null);
        setEtapa("triagem");
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        const dadosGoogle = { nome: decoded.name, email: decoded.email, googleId: decoded.sub, foto: decoded.picture };
        setGoogleUser(dadosGoogle);
        localStorage.removeItem("usuario_whatsapp");
        setUsuario(null);

        try {
            const response = await fetch(`${API_URL}/personal/auth`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosGoogle)
            });
            const data = await response.json();
            if (response.ok && !data.requerCref) {
                setPersonalLogado(data);
                localStorage.setItem("treino_fit_personal", JSON.stringify(data));
                setEtapa("personal");
            } else if (data.requerCref) {
                // Aguarda CREF
            } else { alert(data.mensagem); }
        } catch (err) { console.error("Erro no banco:", err); }
    };

    const handleCadastrarCref = async (e) => {
        e.preventDefault();
        const regexCref = /^\d{4,6}-[GgPp]\/[A-Za-z]{2}$/;
        if (!regexCref.test(cref.trim())) {
            return alert("🚫 Formato de CREF inválido!\n\nO formato correto deve ter os números, a categoria (G) e a sigla do seu Estado.\n\nExemplo correto: 123456-G/SP");
        }
        try {
            const response = await fetch(`${API_URL}/personal/auth`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...googleUser, cref })
            });
            const data = await response.json();
            if (response.ok) {
                setPersonalLogado(data);
                localStorage.setItem("treino_fit_personal", JSON.stringify(data));
                setEtapa("personal");
            } else { alert(data.mensagem); }
        } catch (err) { console.error("Erro CREF:", err); }
    };

    // eslint-disable-next-line no-unused-vars
    const cadastrarNovoAluno = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...novoAlunoForm, personalId: personalLogado._id };
            const response = await fetch(`${API_URL}/aluno`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                setAlunosPersonal([data, ...alunosPersonal]);
                alert(`✅ Aluno Cadastrado!\n\nCódigo de Acesso: ${data.nome}`);
                setModalNovoAluno(false);
                setNovoAlunoForm({ nome: "", whatsapp: "", objetivo: "Emagrecimento" });
            } else { alert(data.mensagem || "Erro ao cadastrar."); }
        } catch { alert("Erro de conexão."); }
    };

    const alterStatusContaAluno = async (id, novoStatus) => {
        try {
            const response = await fetch(`${API_URL}/aluno/${id}/status`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statusConta: novoStatus })
            });
            if (response.ok) {
                setAlunosPersonal(prev => prev.map(a => a.id === id || a._id === id ? { ...a, statusConta: novoStatus } : a));
            }
        } catch { alert("Erro."); }
    };

    // eslint-disable-next-line no-unused-vars
    const atualizarBiometriaAluno = async (e) => {
        e.preventDefault();
        setIsRecalculando(true);
        const alunoId = alunoEditandoPerfil.id || alunoEditandoPerfil._id;

        try {
            const response = await fetch(`${API_URL}/aluno/${alunoId}/atualizar-biometria`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...alunoEditandoPerfil,
                    peso: parseNumeroSeguro(alunoEditandoPerfil.peso),
                    altura: parseNumeroSeguro(alunoEditandoPerfil.altura),
                    idade: parseInt(alunoEditandoPerfil.idade) || 0,
                    meta: alunoEditandoPerfil.objetivo,
                    objetivo: alunoEditandoPerfil.objetivo,
                    genero: alunoEditandoPerfil.genero,
                    nivel: alunoEditandoPerfil.nivel,
                    diasTreino: alunoEditandoPerfil.diasTreino,
                    restricoes: alunoEditandoPerfil.restricoes,
                    lesoes: alunoEditandoPerfil.lesoes,
                    medidas: alunoEditandoPerfil.medidas || {}
                })
            });

            if (response.ok) {
                const alunoAtualizado = await response.json();
                setAlunosPersonal(prev => prev.map(a => (a.id === alunoId || a._id === alunoId) ? alunoAtualizado : a));
                alert(`✅ Ficha de ${alunoAtualizado.nome} atualizada na IA.`);
                setAlunoEditandoPerfil(null);
            } else { alert("Erro ao recriar plano."); }
        } catch { alert("Erro de conexão com a IA."); }
        finally { setIsRecalculando(false); }
    };

    const abrirGeradorTreino = (aluno) => {
        setAlunoEmEdicao(aluno);
        if (aluno.treinoSemanal && aluno.treinoSemanal.length > 0) {
            setTreinoForm(aluno.treinoSemanal);
        } else {
            const structure = DIAS_SEMANA.map(dia => ({ dia, exercicios: dia === "Segunda" ? (aluno.treinoPrescrito || []) : [] }));
            setTreinoForm(structure);
        }
        setDietaForm(aluno.dietaPrescrita || []);
        setAguaForm(aluno.metaAgua || "");
        setDiaAbaPersonal("Segunda");
    };

    const adicionarExercicioForm = () => setTreinoForm(prev => prev.map(diaObj => diaObj.dia === diaAbaPersonal ? { ...diaObj, exercicios: [...diaObj.exercicios, { nome: "", series: 4, reps: "10", obs: "" }] } : diaObj));
    const removerExercicioForm = (indexExercicio) => setTreinoForm(prev => prev.map(diaObj => diaObj.dia === diaAbaPersonal ? { ...diaObj, exercicios: diaObj.exercicios.filter((_, i) => i !== indexExercicio) } : diaObj));
    const handleExercicioChange = (indexExercicio, campo, valor) => setTreinoForm(prev => prev.map(diaObj => { if (diaObj.dia === diaAbaPersonal) { const novosExercicios = [...diaObj.exercicios]; novosExercicios[indexExercicio][campo] = valor; return { ...diaObj, exercicios: novosExercicios }; } return diaObj; }));

    const adicionarDietaForm = () => setDietaForm([...dietaForm, { refeicao: "", itens: "" }]);
    const removerDietaForm = (index) => setDietaForm(dietaForm.filter((_, i) => i !== index));
    const handleDietaChange = (index, campo, valor) => { const novaDieta = [...dietaForm]; novaDieta[index][campo] = valor; setDietaForm(novaDieta); };

    const salvarTreinoPersonal = async (e) => {
        e.preventDefault();
        const alunoId = alunoEmEdicao.id || alunoEmEdicao._id;
        try {
            const response = await fetch(`${API_URL}/aluno/${alunoId}/prescrever`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ treinoSemanal: treinoForm, dietaPrescrita: dietaForm, metaAgua: aguaForm })
            });
            if (response.ok) {
                setAlunosPersonal(prev => prev.map(a => (a.id === alunoId || a._id === alunoId) ? { ...a, statusTreino: "Enviado", treinoSemanal: treinoForm, dietaPrescrita: dietaForm, metaAgua: aguaForm } : a));
                alert(`Plano Semanal aplicado para ${alunoEmEdicao.nome}!`);
                setAlunoEmEdicao(null);
            }
        } catch { alert("Erro de conexão ao salvar plano."); }
    };

    const deletarAluno = async (id) => {
        if (!confirm("Remover este aluno de forma permanente?")) return;
        try {
            const response = await fetch(`${API_URL}/aluno/${id}`, { method: "DELETE" });
            if (response.ok) setAlunosPersonal(prev => prev.filter(a => a.id !== id && a._id !== id));
        } catch { alert("Erro ao deletar aluno."); }
    };

    // eslint-disable-next-line no-unused-vars
    const calcularDobras = () => {
        const tr = parseFloat(String(dobrasForm.triceps).replace(',', '.')) || 0;
        const to = parseFloat(String(dobrasForm.torax).replace(',', '.')) || 0;
        const sub = parseFloat(String(dobrasForm.subescapular).replace(',', '.')) || 0;
        const ax = parseFloat(String(dobrasForm.axilar).replace(',', '.')) || 0;
        const il = parseFloat(String(dobrasForm.iliaca).replace(',', '.')) || 0;
        const ab = parseFloat(String(dobrasForm.abdominal).replace(',', '.')) || 0;
        const co = parseFloat(String(dobrasForm.coxa).replace(',', '.')) || 0;

        const soma7 = tr + to + sub + ax + il + ab + co;
        const idade = parseInt(alunoEditandoPerfil?.idade || perfil.idade) || 25;
        const genero = alunoEditandoPerfil?.genero || perfil.genero || 'Masculino';

        if (soma7 === 0) return alert("Preencha ao menos uma dobra para calcular.");

        let densidade = 0;
        if (genero === 'Masculino') {
            densidade = 1.112 - (0.00043499 * soma7) + (0.00000055 * (soma7 * soma7)) - (0.00028826 * idade);
        } else {
            densidade = 1.097 - (0.00046971 * soma7) + (0.00000056 * (soma7 * soma7)) - (0.00012828 * idade);
        }

        const bf = ((4.95 / densidade) - 4.50) * 100;

        setAlunoEditandoPerfil(prev => prev ? {
            ...prev,
            medidas: { ...prev.medidas, percentualGordura: bf.toFixed(1) }
        } : prev);

        alert(`✅ Avaliação concluída!\n\nPercentual de Gordura Estimado: ${bf.toFixed(1)}%\n\nO valor foi adicionado à ficha do aluno. Clique em "Salvar" para confirmar.`);
        setModalDobrasAberto(false);
    };

    // =========================================================================
    // 5. FUNÇÕES DO ALUNO, CHECK-IN E MÉTODOS DE TELA
    // =========================================================================

    const handleLoginAluno = async (e) => {
        e.preventDefault();
        const termoBusca = codigoAcessoAluno.trim();
        try {
            const response = await fetch(`${API_URL}/aluno/login?nome=${encodeURIComponent(termoBusca)}`);
            if (response.ok) {
                const alunoEncontrado = await response.json();
                if (alunoEncontrado.statusConta === "Off") return alert("Acesso suspenso! Entre em contato com seu Personal Trainer.");
                setAlunoLogado(alunoEncontrado);
                setExerciciosConcluidos([]);
                setEtapa("aluno");
            } else { alert("Aluno não encontrado na assessoria."); }
        } catch { alert("Erro ao conectar."); }
    };

    const iniciarCheckin = () => {
        const hojeObj = new Date();
        const dataFormatada = hojeObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        const jaFezCheckin = alunoLogado.checkins?.some(c => c.data === dataFormatada);

        if (jaFezCheckin) return alert("Check-in de hoje já foi computado! Descanse, guerreiro.");
        setModalFeedbackAberto(true);
    };

    const confirmarCheckinComFeedback = async (e) => {
        e.preventDefault();
        const hojeObj = new Date();
        const dataFormatada = hojeObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        const diaSemanaFormatado = hojeObj.toLocaleDateString("pt-BR", { weekday: 'long' }).charAt(0).toUpperCase() + hojeObj.toLocaleDateString("pt-BR", { weekday: 'long' }).slice(1);

        const novoCheckin = { data: dataFormatada, diaSemana: diaSemanaFormatado, feedback: feedbackTreino };
        const alunoId = alunoLogado.id || alunoLogado._id;

        try {
            const response = await fetch(`${API_URL}/aluno/${alunoId}/checkin`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoCheckin)
            });
            if (response.ok) {
                setAlunoLogado(prev => ({ ...prev, checkins: [novoCheckin, ...(prev.checkins || [])] }));
                setModalFeedbackAberto(false);
                setFeedbackTreino({ intensidade: "Moderado 🟡", carga: "Na medida ✅", comentario: "" });

                // 🚀 ATIVAR O CARD DO INSTAGRAM AQUI
                setDadosShare({
                    treino: diaAbaAluno,
                    intensidade: novoCheckin.feedback.intensidade,
                    carga: novoCheckin.feedback.carga,
                    data: dataFormatada,
                    nomePersonal: personalLogado?.nome || "Treinador Treino Fit"
                });
                setModalShareAberto(true);
            }
        } catch { alert("Erro ao enviar check-in."); }
    };

    const enviarRespostaFeedback = async (alunoId, dataCheckin) => {
        const resposta = respostasFeedback[dataCheckin];
        if (!resposta) return alert("Digite uma resposta antes de enviar.");

        try {
            const response = await fetch(`${API_URL}/aluno/${alunoId}/responder-checkin`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataCheckin, resposta })
            });

            if (response.ok) {
                const alunoAtualizado = await response.json();
                setAlunoVerFeedback(alunoAtualizado);
                setAlunosPersonal(prev => prev.map(a => (a.id || a._id) === alunoId ? alunoAtualizado : a));
                setRespostasFeedback(prev => ({ ...prev, [dataCheckin]: "" }));
                alert("✅ Resposta enviada com sucesso para o aluno!");
            }
        } catch {
            alert("Erro ao enviar resposta.");
        }
    };

    const salvarOnboarding = async (e) => {
        e.preventDefault();
        if (!perfil.nome || !perfil.peso || !perfil.altura || !perfil.idade) { alert("Preencha todos os campos!"); return; }
        try {
            const response = await fetch(`${API_URL}/usuarios/atualizar`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp: usuario,
                    nome: perfil.nome,
                    peso: parseNumeroSeguro(perfil.peso),
                    altura: parseNumeroSeguro(perfil.altura),
                    meta: perfil.meta,
                    idade: parseInt(perfil.idade) || 0,
                    genero: perfil.genero,
                    nivel: perfil.nivel,
                    diasTreino: perfil.diasTreino,
                    restricoes: perfil.restricoes,
                    lesoes: perfil.lesoes
                })
            });
            if (response.ok) {
                const saude = calcularSaude(perfil.peso, perfil.altura, perfil.idade);
                setPerfil(prev => ({ ...prev, ...saude }));
                setEtapa("home");
            }
        } catch { alert("Erro de conexão."); }
    };

    const toggleAlimento = (alimento) => {
        if (alimentosFavoritos.includes(alimento)) {
            setAlimentosFavoritos(alimentosFavoritos.filter(a => a !== alimento));
        } else {
            if (alimentosFavoritos.length < 5) setAlimentosFavoritos([...alimentosFavoritos, alimento]);
        }
    };

    const avançarQuiz = () => {
        if (quizStep === 1 && !perfil.meta) return alert("Selecione um objetivo!");
        if (quizStep === 2 && !perfil.nivel) return alert("Selecione seu nível de experiência!");
        setQuizStep(prev => prev + 1);
    };

    const finalizarQuiz = (e) => {
        e.preventDefault();
        const preferenciasIA = alimentosFavoritos.length > 0 ? `Gosta de: ${alimentosFavoritos.join(", ")}.` : "";
        const novasRestricoes = `${perfil.restricoes} ${preferenciasIA}`.trim();
        setPerfil({ ...perfil, restricoes: novasRestricoes });
        salvarOnboarding(e);
    };

    // =========================================================================
    // 📊 RENDERIZADOR DO MODAL DE AVALIAÇÃO (VISÃO DO ALUNO E DO PERSONAL)
    // =========================================================================
    const renderModalAvaliacao = (alunoData, fecharModal) => {
        if (!alunoData) return null;

        // --- CÁLCULOS DO RADAR DE EVOLUÇÃO ---
        const p = parseFloat(String(alunoData.peso).replace(',', '.')) || 0;
        const a = parseFloat(String(alunoData.altura).replace(',', '.')) || 0;
        const bf = parseFloat(alunoData.medidas?.percentualGordura) || 0;

        let metaPeso = p;
        let textMeta = "Manutenção / Saúde";
        let progressoMeta = 100;

        if (p > 0 && a > 0) {
            const objetivoAluno = alunoData.objetivo || alunoData.meta || "";
            if (objetivoAluno.includes("Emagrecimento")) {
                metaPeso = (23 * (a * a)).toFixed(1); // Meta de IMC 23 para emagrecimento
                textMeta = `Meta Ideal: ${metaPeso}kg`;
                progressoMeta = (metaPeso / p) * 100;
            } else if (objetivoAluno.includes("Hipertrofia")) {
                metaPeso = (26 * (a * a)).toFixed(1); // Meta de IMC 26 para massa muscular
                textMeta = `Meta de Massa: ${metaPeso}kg`;
                progressoMeta = (p / metaPeso) * 100;
            }
        }

        let bfPercent = 0;
        let bfColor = "bg-neutral-500";
        let bfStatus = "N/A";

        if (bf > 0) {
            bfPercent = Math.min(Math.max(((bf - 5) / (40 - 5)) * 100, 0), 100);
            if (alunoData.genero === 'Masculino') {
                if (bf < 10) { bfStatus = "Nível Atleta"; bfColor = "bg-blue-500"; }
                else if (bf < 18) { bfStatus = "Em Forma"; bfColor = "bg-emerald-500"; }
                else if (bf < 25) { bfStatus = "Na Média"; bfColor = "bg-amber-500"; }
                else { bfStatus = "Acima do Ideal"; bfColor = "bg-red-500"; }
            } else {
                if (bf < 18) { bfStatus = "Nível Atleta"; bfColor = "bg-blue-500"; }
                else if (bf < 25) { bfStatus = "Em Forma"; bfColor = "bg-emerald-500"; }
                else if (bf < 32) { bfStatus = "Na Média"; bfColor = "bg-amber-500"; }
                else { bfStatus = "Acima do Ideal"; bfColor = "bg-red-500"; }
            }
        }
        // -------------------------------------

        return (
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={fecharModal}>
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 rounded-3xl p-6 relative shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={fecharModal} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-100 font-bold text-lg bg-[#0d0e12] w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-800 transition-colors">✕</button>

                    <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-2xl shadow-sm">📊</div>
                        <div>
                            <h3 className="font-bold text-neutral-100 uppercase text-base tracking-tight">Avaliação Física</h3>
                            <p className="text-xs text-blue-400 font-semibold font-mono uppercase mt-1">{alunoData.nome}</p>
                        </div>
                    </div>

                    {/* 🚀 NOVO RADAR DE EVOLUÇÃO VISUAL */}
                    <div className="bg-[#0d0e12] border border-neutral-800 p-5 rounded-2xl mb-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                            <span>🚀</span> Radar de Evolução Visual
                        </p>

                        <div className="mb-5">
                            <div className="flex justify-between text-xs uppercase font-bold text-neutral-300 mb-2">
                                <span>Peso Atual: {p}kg</span>
                                <span className="text-emerald-400">{textMeta}</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden relative shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progressoMeta, 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] font-semibold text-right mt-2 text-neutral-400 font-mono uppercase">Proximidade do objetivo: {Math.round(Math.min(progressoMeta, 100))}%</p>
                        </div>

                        {bf > 0 && (
                            <div className="pt-3 border-t border-neutral-800/50 mt-4">
                                <div className="flex justify-between text-xs uppercase font-bold text-neutral-300 mb-2">
                                    <span>Gordura Atual: {bf}%</span>
                                    <span className={bfColor.replace('bg-', 'text-')}>{bfStatus}</span>
                                </div>
                                <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden relative shadow-inner">
                                    <div className={`h-full ${bfColor} transition-all duration-1000 ease-out`} style={{ width: `${bfPercent}%` }}></div>
                                </div>
                            </div>
                        )}
                        {bf === 0 && (
                            <div className="pt-3 border-t border-neutral-800/50 mt-4 text-center">
                                <p className="text-xs text-neutral-400 font-medium italic">Percentual de gordura não registrado nas dobras.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Dados Biométricos Gerais</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Peso Bruto</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.peso ? alunoData.peso : '--'} <span className="text-xs text-neutral-500 font-semibold">kg</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Estatura</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.altura ? alunoData.altura : '--'} <span className="text-xs text-neutral-500 font-semibold">m</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Idade</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.idade ? alunoData.idade : '--'} <span className="text-xs text-neutral-500 font-semibold">anos</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Gênero Bio</p>
                                    <p className="text-base font-bold text-neutral-100 mt-1">{alunoData.genero ? alunoData.genero : '--'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0d0e12] border border-neutral-800 p-5 rounded-xl space-y-4 shadow-sm">
                            <div>
                                <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Nível de Treino</p>
                                <p className="text-sm font-medium text-neutral-200">{alunoData.nivel ? alunoData.nivel : '--'}</p>
                            </div>
                            {alunoData.restricoes && (
                                <div className="pt-3 border-t border-neutral-800/50">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Restrições Alimentares</p>
                                    <p className="text-sm font-medium text-neutral-200">{alunoData.restricoes}</p>
                                </div>
                            )}
                            {alunoData.lesoes && (
                                <div className="pt-3 border-t border-neutral-800/50">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Histórico de Lesões</p>
                                    <p className="text-sm font-medium text-neutral-200">{alunoData.lesoes}</p>
                                </div>
                            )}
                        </div>

                        {alunoData.medidas && Object.keys(alunoData.medidas).length > 0 && (
                            <div className="mt-6 bg-[#0d0e12] border border-neutral-800 p-5 rounded-xl shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4 border-b border-neutral-800 pb-2">
                                    📏 Circunferências (cm)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(alunoData.medidas).map(([key, value]) => {
                                        if (!value || value === "" || value === "0" || key === "_id" || key === "percentualGordura") return null;
                                        const labelFormatada = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                        return (
                                            <div key={key} className="bg-[#16171d] border border-neutral-800 p-3 rounded-lg flex flex-col justify-center">
                                                <span className="text-[10px] text-neutral-400 uppercase font-semibold capitalize mb-1">{labelFormatada}</span>
                                                <span className="text-base font-mono text-neutral-100 font-bold">{value} <span className="text-xs text-neutral-500 font-medium">cm</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // =========================================================================
    // 6. RENDERIZAÇÃO DAS TELAS (HTML)
    // =========================================================================

    if (etapa === "verificando") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-md shadow-emerald-500/10"></div>
                <div className="text-sm text-neutral-300 font-semibold uppercase tracking-widest animate-pulse">Sincronizando Seu Perfil...</div>
            </div>
        );
    }

    if (etapa === "login") return <Login aoLogar={handleLogin} aoVoltar={() => setEtapa("triagem")} />;

    if (etapa === "triagem") {
        // Estado local simples criado para controlar a abertura do menu de login rápido
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return (
            <div className="home-container fixed inset-0 z-50 overflow-y-auto bg-[#0b0f19]">
                <div className="home-content">

                    {/* Menu Superior */}
                    <header className="home-header relative">
                        <div className="home-logo text-3xl font-black italic text-emerald-400">Treino Fit</div>
                        <div className="relative">
                            <button
                                onClick={() => setMenuEntrarAberto(!menuEntrarAberto)}
                                className="text-white hover:text-emerald-400 font-black text-base bg-transparent border-none cursor-pointer transition-colors px-4 py-2 flex items-center gap-1 uppercase tracking-wider"
                            >
                                Entrar <span className="text-xs">{menuEntrarAberto ? "▲" : "▼"}</span>
                            </button>

                            {/* Dropdown de Entrada Rápida */}
                            {menuEntrarAberto && (
                                <div className="absolute right-0 mt-2 w-56 bg-[#16171d] border-2 border-neutral-800 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-2 flex flex-col gap-1 bg-[#16171d]">
                                        <button
                                            onClick={() => { setEtapa("login"); setMenuEntrarAberto(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-black text-white hover:bg-emerald-500 hover:text-black rounded-xl transition-all uppercase tracking-wide flex items-center gap-2 bg-transparent border-none cursor-pointer"
                                        >
                                            <span>💬</span> Consultoria IA
                                        </button>
                                        <button
                                            onClick={() => { setEtapa("login_personal"); setMenuEntrarAberto(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-black text-white hover:bg-blue-500 hover:text-black rounded-xl transition-all uppercase tracking-wide flex items-center gap-2 bg-transparent border-none cursor-pointer"
                                        >
                                            <span>📊</span> Módulo Treinador
                                        </button>
                                        <button
                                            onClick={() => { setEtapa("login_aluno"); setMenuEntrarAberto(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-black text-white hover:bg-amber-500 hover:text-black rounded-xl transition-all uppercase tracking-wide flex items-center gap-2 bg-transparent border-none cursor-pointer"
                                        >
                                            <span>💪</span> Módulo Aluno
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Bloco 1: Usuário Comum / IA */}
                    <section className="home-hero">
                        <h1 className="home-hero-title text-4xl sm:text-5xl font-black text-white leading-tight">Seu Personal e Nutricionista<br /><span>Impulsionados por Inteligência Artificial</span></h1>
                        <p className="home-subtitle font-bold text-lg text-neutral-200 max-w-2xl mx-auto mt-4 leading-relaxed">Não tem acompanhamento profissional? Sem problemas. Nossa IA monta sua estrutura de treinos e rotina alimentar ideal de forma 100% personalizada e automática.</p>

                        <button onClick={() => setEtapa("login")} className="home-btn home-btn-whatsapp py-4 px-10 text-base font-black uppercase tracking-wider shadow-xl shadow-green-500/20 mt-6 active:scale-95 transition-all">
                            <span style={{ marginRight: '12px', fontSize: '24px' }}>💬</span> Iniciar com WhatsApp
                        </button>
                    </section>

                    {/* Bloco 2: Personal Trainer */}
                    <section className="home-section-block border-t-2 border-neutral-900">
                        <div className="home-grid">
                            <div className="home-content-left text-left">
                                <h2 className="text-3xl font-black text-white uppercase italic leading-snug">Você é Personal Trainer?<br /><span className="text-blue-400 not-italic">Ganhe tempo e multiplique alunos.</span></h2>
                                <p className="font-bold text-base text-neutral-300 mt-3 leading-relaxed">Esqueça planilhas confusas. Deixe a IA estruturar a base das rotinas e os check-ins enquanto você foca no ajuste fino e no atendimento premium dos seus alunos.</p>

                                <button onClick={() => setEtapa("login_personal")} className="home-btn home-btn-primary py-4 px-8 text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 mt-6 active:scale-95 transition-all">
                                    Acessar Painel do Personal
                                </button>
                            </div>
                            <div className="home-app-mockup text-left border-2 border-neutral-800 bg-[#16171d] shadow-2xl rounded-3xl p-6">
                                <div className="home-mockup-header text-base border-b-2 border-neutral-800 pb-3 mb-4 flex justify-between items-center">
                                    <span className="font-black text-white">📊 Painel do Treinador</span>
                                    <span className="font-bold opacity-60 ml-2 text-xs bg-neutral-900 px-2 py-0.5 rounded text-blue-400 border border-neutral-800">v1.2</span>
                                </div>
                                <div className="font-black text-sm text-neutral-200 py-2.5 flex items-center"><span className="mr-3 text-xl">🤖</span> Previsão inteligente de evolução</div>
                                <div className="font-black text-sm text-neutral-200 py-2.5 flex items-center"><span className="mr-3 text-xl">📝</span> Criação de treinos automáticos</div>
                                <div className="font-black text-sm text-neutral-200 py-2.5 flex items-center"><span className="mr-3 text-xl">✅</span> Histórico e Check-ins simplificados</div>
                            </div>
                        </div>
                    </section>

                    {/* Bloco 3: Área do Aluno */}
                    <section className="home-section-block border-t-2 border-neutral-900">
                        <div className="home-grid" style={{ direction: 'rtl' }}>
                            <div className="home-content-left text-left" style={{ direction: 'ltr' }}>
                                <h2 className="text-3xl font-black text-white uppercase italic leading-snug">A Área do Aluno<br /><span className="text-emerald-400 not-italic">Tudo integrado e na palma da mão.</span></h2>
                                <p className="font-bold text-base text-neutral-300 mt-3 leading-relaxed">Seu personal te cadastrou? Acesse sua divisão exata de treinos diários e sua base alimentar calculada estritamente conforme suas metas.</p>

                                <button
                                    onClick={() => setEtapa("login_aluno")}
                                    className="py-4 px-8 text-sm font-black uppercase tracking-wider mt-6 transition-all duration-300 active:scale-95 border-2 border-emerald-400 text-emerald-400 rounded-full hover:bg-emerald-400 hover:text-[#0d0e12] shadow-[0_5px_15px_rgba(52,211,153,0.1)] hover:shadow-[0_10px_30px_rgba(52,211,153,0.4)]"
                                >
                                    Acessar Como Aluno
                                </button>
                            </div>
                            <div className="home-app-mockup text-left border-2 border-neutral-800 bg-[#16171d] shadow-2xl rounded-3xl p-6" style={{ direction: 'ltr' }}>
                                <div className="home-mockup-header text-base border-b-2 border-neutral-800 pb-3 mb-4 flex justify-between items-center">
                                    <span className="font-black text-white">💪 Meu Treino Diário</span>
                                    <span className="font-black text-orange-400 text-sm bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded animate-pulse">Meta Batida 🔥</span>
                                </div>
                                <div className="font-black text-sm text-neutral-200 py-2.5 flex items-center"><span className="mr-3 text-xl">🍎</span> Base Alimentar Ajustada</div>
                                <div className="font-black text-sm text-neutral-200 py-2.5 flex items-center"><span className="mr-3 text-xl">💧</span> Controle de Água Integrado</div>
                                <div className="bg-[#0d0e12] border-2 border-neutral-800 rounded-2xl p-5 mt-4 flex items-start shadow-inner relative overflow-hidden">
                                    <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500"></div>
                                    <span className="text-3xl mr-4 select-none">💧</span>
                                    <div className="text-sm text-white font-bold leading-relaxed">
                                        <strong className="text-blue-400 block mb-1 text-xs uppercase tracking-wider font-black">Notificação Treino Fit:</strong>
                                        Hora de beber água! Faltam 1.2L para bater a sua meta de hoje.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', borderTop: '2px solid #1e293b', fontSize: '14px', fontWeight: 'black', textTransform: 'uppercase', trackingWidth: 'widest' }}>
                        &copy; 2026 Treino Fit. Todos os direitos reservados.
                    </footer>
                </div>
            </div>
        );
    }

    if (etapa === "login_personal") {
        const GOOGLE_CLIENT_ID = "588566756758-75ic5m03ser1af56tr26gkeenh8qn9nc.apps.googleusercontent.com";
        return (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50">
                    <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-xl">
                        {!googleUser ? (
                            <>
                                <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-100 mb-2">Acesso Técnico</h2>
                                <p className="text-neutral-400 font-medium text-sm mb-8">Autentique-se com sua conta Google profissional.</p>
                                <div className="flex justify-center mb-8">
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Falha no Login')} theme="filled_black" text="continue_with" />
                                </div>
                                <button type="button" onClick={() => setEtapa("triagem")} className="w-full bg-transparent border border-neutral-800 hover:bg-neutral-800 p-3.5 rounded-xl text-xs uppercase tracking-wider text-neutral-400 transition-colors font-bold">Voltar para Início</button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-6 bg-[#0d0e12] p-4 rounded-xl border border-neutral-800">
                                    <img src={googleUser.foto} alt="Perfil" className="w-12 h-12 rounded-full border border-emerald-500 shadow-sm" />
                                    <div>
                                        <h2 className="text-sm font-bold text-neutral-100 uppercase">{googleUser.nome}</h2>
                                        <p className="text-[10px] text-emerald-400 font-semibold font-mono mt-1">Autenticação Concluída ✓</p>
                                    </div>
                                </div>
                                <p className="text-neutral-300 font-medium text-xs mb-6 leading-relaxed bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">Este é o seu primeiro acesso. Para ativar a sua licença no sistema Treino Fit, insira o seu <strong className="text-white">registo profissional (CREF)</strong> abaixo.</p>
                                <form onSubmit={handleCadastrarCref} className="space-y-4">
                                    <input required type="text" placeholder="Registro CREF (Ex: 123456-G/SP)" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 text-neutral-100 placeholder-neutral-500 uppercase transition-colors" value={cref} onChange={(e) => setCref(e.target.value)} />
                                    <div className="flex gap-3 text-xs font-bold pt-2">
                                        <button type="button" onClick={() => setGoogleUser(null)} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-3.5 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Cancelar</button>
                                        <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl uppercase tracking-wider transition-colors shadow-md">Validar Licença</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </GoogleOAuthProvider>
        );
    }

    if (etapa === "login_aluno") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50">
                <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-100 mb-2 text-center">Portal do Aluno</h2>
                    <p className="text-neutral-400 font-medium text-xs mb-8 text-center bg-[#0d0e12] p-4 rounded-xl border border-neutral-800">Insira o código de acesso fornecido pelo seu Personal Trainer para continuar.</p>
                    <form onSubmit={handleLoginAluno} className="space-y-4">
                        <input required type="text" placeholder="Código de Acesso (Ex: João Silva)" className="w-full bg-[#0d0e12] border border-neutral-700 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 text-neutral-100 placeholder-neutral-500 text-center transition-colors" value={codigoAcessoAluno} onChange={(e) => setCodigoAcessoAluno(e.target.value)} />
                        <div className="flex flex-col gap-3 font-bold">
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md">Entrar no App</button>
                            <button type="button" onClick={() => setEtapa("triagem")} className="w-full bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl text-xs uppercase tracking-wider text-neutral-400 transition-colors">Voltar para Início</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (etapa === "matricula_externa") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-4 md:p-6 text-neutral-200 font-sans z-50 overflow-y-auto">
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-xl my-auto">
                    <div className="text-center mb-8">
                        <span className="text-5xl mb-4 block opacity-90">🤖</span>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-emerald-400 mb-2">Auto-Avaliação IA</h2>
                        <p className="text-neutral-400 font-medium text-xs bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">Preencha sua biometria com atenção. A Inteligência Artificial usará esses dados para estruturar a base do seu treino e da sua dieta.</p>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setEtapa("verificando");
                        try {
                            const urlParams = new URLSearchParams(window.location.search);
                            const refPersonal = urlParams.get('ref');
                            const payload = { ...perfil, nome: perfil.nome, peso: parseNumeroSeguro(perfil.peso), altura: parseNumeroSeguro(perfil.altura), idade: parseInt(perfil.idade) || 0, whatsapp: novoAlunoForm.whatsapp, objetivo: perfil.meta, meta: perfil.meta, genero: perfil.genero, nivel: perfil.nivel, diasTreino: perfil.diasTreino, restricoes: perfil.restricoes, lesoes: perfil.lesoes, personalRef: refPersonal };
                            const res = await fetch(`${API_URL}/aluno/matricula-ia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                            if (res.ok) { alert("🎉 Análise concluída! Sua ficha já está na mesa do Personal."); window.location.href = window.location.origin; }
                            else { const data = await res.json(); alert(data.mensagem || "Erro na análise."); setEtapa("matricula_externa"); }
                        } catch { alert("Erro de conexão."); setEtapa("matricula_externa"); }
                    }} className="space-y-4">

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Nome Completo</label>
                            <input required type="text" placeholder="Como devemos te chamar?" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, nome: e.target.value })} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">WhatsApp (Apenas Números)</label>
                            <input required type="text" placeholder="Ex: 11999999999" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 transition-colors text-neutral-100" onChange={e => setNovoAlunoForm({ ...novoAlunoForm, whatsapp: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Peso (kg)</label>
                                <input required type="text" placeholder="Ex: 80.5" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 text-center transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, peso: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Altura (m)</label>
                                <input required type="text" placeholder="Ex: 1.75" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 text-center transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, altura: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Idade</label>
                                <input required type="number" placeholder="Ex: 28" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 text-center transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, idade: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Gênero Biológico</label>
                                <select required className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 cursor-pointer transition-colors" onChange={e => setPerfil({ ...perfil, genero: e.target.value })}>
                                    <option value="" className="text-neutral-500">Selecione...</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Objetivo Principal</label>
                                <select required className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 cursor-pointer transition-colors" onChange={e => setPerfil({ ...perfil, meta: e.target.value })}>
                                    <option value="" className="text-neutral-500">Selecione...</option><option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Nível de Treino</label>
                                <select required className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 cursor-pointer transition-colors" onChange={e => setPerfil({ ...perfil, nivel: e.target.value })}>
                                    <option value="" className="text-neutral-500">Selecione...</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Dias na Semana</label>
                                <select required className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 cursor-pointer transition-colors" onChange={e => setPerfil({ ...perfil, diasTreino: e.target.value })}>
                                    <option value="" className="text-neutral-500">Selecione...</option><option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1 pt-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Restrições Alimentares? (Opcional)</label>
                            <input type="text" placeholder="Ex: Vegano, Intolerante a lactose..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, restricoes: e.target.value })} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Lesões ou Dores? (Opcional)</label>
                            <input type="text" placeholder="Ex: Dor no joelho direito, Hérnia..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 placeholder-neutral-600 transition-colors text-neutral-100" onChange={e => setPerfil({ ...perfil, lesoes: e.target.value })} />
                        </div>

                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-widest font-bold text-xs shadow-md mt-6 transition-all active:scale-95 flex justify-center items-center gap-2">
                            <span>⚡</span> Gerar Diagnóstico com IA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ✅ NOVO ONBOARDING GAMIFICADO COM O QUIZ
    if (etapa === "onboarding") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-4 md:p-8 text-neutral-200 z-50 overflow-y-auto font-sans">
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-xl my-auto relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-tight text-emerald-400">
                            {quizStep === 1 && "1. Seu Objetivo"}
                            {quizStep === 2 && "2. Sua Rotina"}
                            {quizStep === 3 && "3. Suas Preferências"}
                            {quizStep === 4 && "4. Perfil Físico"}
                        </h2>
                        <span className="text-[10px] font-medium font-mono text-neutral-400 bg-[#0d0e12] px-2.5 py-1 rounded border border-neutral-800">Passo {quizStep} de 4</span>
                    </div>
                    <div className="w-full bg-[#0d0e12] h-2 rounded-full mb-8 overflow-hidden border border-neutral-800 shadow-inner">
                        <div className="bg-emerald-500 h-full transition-all duration-500 ease-out" style={{ width: `${(quizStep / 4) * 100}%` }}></div>
                    </div>
                    {quizStep === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-neutral-200 font-semibold leading-relaxed text-center mb-6">O que você quer que a nossa Inteligência Artificial construa para você hoje?</p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "Emagrecimento", icone: "🔥", desc: "Queima de Gordura Intensa" },
                                    { id: "Hipertrofia", icone: "💪", desc: "Ganho de Massa Magra" },
                                    { id: "Performance", icone: "⚡", desc: "Condicionamento e Saúde" }
                                ].map(obj => (
                                    <button key={obj.id} type="button" onClick={() => setPerfil({ ...perfil, meta: obj.id })}
                                        className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all border ${perfil.meta === obj.id ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' : 'bg-[#0d0e12] border-neutral-800 hover:border-neutral-600'}`}>
                                        <span className="text-3xl opacity-90">{obj.icone}</span>
                                        <div className="text-left">
                                            <p className={`font-bold uppercase text-sm ${perfil.meta === obj.id ? 'text-emerald-400' : 'text-neutral-100'}`}>{obj.id}</p>
                                            <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{obj.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={avançarQuiz} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl uppercase tracking-wider font-bold text-xs shadow-md mt-6 transition-all active:scale-95">Próximo Passo →</button>
                        </div>
                    )}
                    {quizStep === 2 && (
                        <div className="space-y-8">
                            <div className="bg-[#0d0e12] p-5 rounded-xl border border-neutral-800">
                                <p className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-4 text-center">Qual o seu nível de experiência?</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Iniciante", "Intermediário", "Avançado"].map(niv => (
                                        <button key={niv} type="button" onClick={() => setPerfil({ ...perfil, nivel: niv })}
                                            className={`py-3 rounded-lg text-[10px] font-bold uppercase transition-all border ${perfil.nivel === niv ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                                            {niv}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#0d0e12] p-5 rounded-xl border border-neutral-800">
                                <p className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-4 text-center">Quantos dias na semana quer treinar?</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {["3", "4", "5", "6"].map(dias => (
                                        <button key={dias} type="button" onClick={() => setPerfil({ ...perfil, diasTreino: dias })}
                                            className={`py-3 rounded-lg text-lg font-bold transition-all border ${perfil.diasTreino === dias ? 'bg-blue-600 border-blue-500 text-white shadow-sm' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                                            {dias}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setQuizStep(1)} className="w-1/3 bg-transparent border border-neutral-700 text-neutral-300 p-3.5 rounded-xl font-bold text-xs transition-colors hover:bg-neutral-800">Voltar</button>
                                <button type="button" onClick={avançarQuiz} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl uppercase tracking-wider font-bold text-xs shadow-md transition-all active:scale-95">Continuar →</button>
                            </div>
                        </div>
                    )}
                    {quizStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-neutral-200 font-medium leading-relaxed pr-3">Selecione até 5 alimentos que você <span className="text-emerald-400 font-bold uppercase tracking-wide">não quer que falte</span> na sua dieta.</p>
                                    <div className="flex flex-col items-center justify-center bg-[#0d0e12] border border-emerald-500/40 text-emerald-400 w-10 h-10 rounded-full font-bold text-xs shadow-sm flex-shrink-0">
                                        {alimentosFavoritos.length}/5
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                                {[
                                    { nome: "Pão c/ Ovo", emoji: "🍳" }, { nome: "Frango", emoji: "🍗" },
                                    { nome: "Arroz", emoji: "🍚" }, { nome: "Carne", emoji: "🥩" },
                                    { nome: "Batata Doce", emoji: "🍠" }, { nome: "Mandioca", emoji: "🥔" },
                                    { nome: "Iogurte", emoji: "🥛" }, { nome: "Frutas", emoji: "🍎" },
                                    { nome: "Tapioca", emoji: "🌮" }, { nome: "Cuscuz", emoji: "🌽" },
                                    { nome: "Macarrão", emoji: "🍝" }, { nome: "Café", emoji: "☕" }
                                ].map(ali => {
                                    const selecionado = alimentosFavoritos.includes(ali.nome);
                                    return (
                                        <button key={ali.nome} type="button" onClick={() => toggleAlimento(ali.nome)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selecionado ? 'bg-orange-500/20 border-orange-500 shadow-sm scale-[1.02]' : 'bg-[#0d0e12] border-neutral-800 hover:border-neutral-600 hover:bg-[#16171d]'}`}>
                                            <span className="text-3xl mb-1.5 opacity-90">{ali.emoji}</span>
                                            <span className={`text-[9px] font-bold uppercase text-center tracking-tight ${selecionado ? 'text-orange-400' : 'text-neutral-400'}`}>{ali.nome}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-800">
                                <button type="button" onClick={() => setQuizStep(2)} className="w-1/3 bg-transparent border border-neutral-700 text-neutral-300 p-3.5 rounded-xl font-bold text-xs transition-colors hover:bg-neutral-800">Voltar</button>
                                <button type="button" onClick={avançarQuiz} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl uppercase tracking-wider font-bold text-xs shadow-md transition-all active:scale-95">Quase lá! →</button>
                            </div>
                        </div>
                    )}
                    {quizStep === 4 && (
                        <form onSubmit={finalizarQuiz} className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center mb-5 shadow-inner">
                                <span className="text-2xl mb-1.5 block opacity-90">🧠</span>
                                <p className="text-xs font-medium text-neutral-300">Para a Inteligência Artificial calcular seus macronutrientes e calorias diárias, insira dados exatos.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Como devemos te chamar?</label>
                                <input required type="text" placeholder="Seu nome" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500 placeholder-neutral-600 transition-colors" value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Gênero Biológico</label>
                                    <select required className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 cursor-pointer transition-colors" value={perfil.genero} onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}>
                                        <option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Sua Idade</label>
                                    <input required type="number" placeholder="Anos" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500 placeholder-neutral-600 transition-colors text-center" value={perfil.idade} onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Peso (kg)</label>
                                    <input required type="text" placeholder="Ex: 75.5" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500 placeholder-neutral-600 transition-colors text-center" value={perfil.peso} onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Altura (m)</label>
                                    <input required type="text" placeholder="Ex: 1.75" className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500 placeholder-neutral-600 transition-colors text-center" value={perfil.altura} onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1 pt-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Restrições Alimentares? (Opcional)</label>
                                <input type="text" placeholder="Ex: Vegano, Sem Lactose..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 placeholder-neutral-600 transition-colors" value={perfil.restricoes} onChange={(e) => setPerfil({ ...perfil, restricoes: e.target.value })} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Lesões ou Dores? (Opcional)</label>
                                <input type="text" placeholder="Ex: Dor no joelho direito..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 placeholder-neutral-600 transition-colors" value={perfil.lesoes} onChange={(e) => setPerfil({ ...perfil, lesoes: e.target.value })} />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-neutral-800 mt-2">
                                <button type="button" onClick={() => setQuizStep(3)} className="w-1/3 bg-transparent border border-neutral-700 text-neutral-300 p-3.5 rounded-xl font-bold text-xs transition-colors hover:bg-neutral-800">Voltar</button>
                                <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl uppercase tracking-wider font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                    <span className="text-base">⚡</span> Finalizar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    if (etapa === "home") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col overflow-hidden font-sans z-30">
                {abaAtiva === "home" && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center custom-scrollbar">
                        <header className="w-full max-w-4xl flex justify-between items-center border-b border-neutral-800 pb-5 mb-6">
                            <div className="flex items-center space-x-3">
                                <img src="/logo192.png" alt="Ícone Treino Fit" className="w-10 h-10 rounded-lg shadow-sm border border-neutral-700" />
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-tight">{perfil.nome}</h2>
                                    <p className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest mt-0.5">Conta {isVip ? 'Premium Elite' : 'Free Tier'}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => !isVip && setBloqueado(true)} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase font-mono border shadow-sm transition-all ${isVip ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'}`}>{isVip ? "✓ Vip Ativado" : "Upgrade Premium"}</button>
                        </header>

                        <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-12">
                            <div className="md:col-span-1 flex flex-col gap-5">
                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-2xl shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                    <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-3">Composição Corporal</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[#0d0e12] p-3 border border-neutral-800 rounded-xl shadow-inner">
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Massa Global</span>
                                            <span className="text-2xl font-bold text-neutral-100">{perfil.peso}<span className="text-xs text-neutral-500 font-medium ml-1">kg</span></span>
                                        </div>
                                        <div className="bg-[#0d0e12] p-3 border border-neutral-800 rounded-xl shadow-inner">
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Estatura</span>
                                            <span className="text-2xl font-bold text-neutral-100">{perfil.altura}<span className="text-xs text-neutral-500 font-medium ml-1">m</span></span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-[10px] text-neutral-300 font-semibold font-mono flex justify-between border-t border-neutral-800/60 pt-3 bg-[#0d0e12]/50 px-3 py-2 rounded-lg">
                                        <span className="uppercase text-neutral-500">Planejamento:</span>
                                        <span className="text-emerald-400 uppercase">{perfil.meta}</span>
                                    </div>
                                </div>

                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-2xl shadow-md text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-80"></div>
                                    <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest text-left mb-4 mt-1">Meta Metabólica Diária</p>
                                    <div className="inline-flex flex-col items-center justify-center p-6 border-2 border-neutral-800 bg-[#0d0e12] rounded-full w-32 h-32 mx-auto mb-2 border-t-emerald-500 shadow-inner">
                                        <span className="text-3xl font-bold text-neutral-100">{perfil.tmb}</span>
                                        <span className="text-[9px] font-medium font-mono text-neutral-500 uppercase mt-1 tracking-widest">kcal/dia</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-5">
                                <div className="bg-[#16171d] border border-neutral-800 p-6 rounded-2xl shadow-md bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-soft-light">
                                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5">
                                        <span className="text-base">⚡</span> Diretriz Técnica Operacional
                                    </p>
                                    <p className="text-sm font-medium text-neutral-200 leading-relaxed">
                                        "<span className="text-emerald-300 font-semibold">{perfil.nome}</span>, seus parâmetros atuais indicam que o nosso foco principal deve ser a oxidação de gordura ativa. A Inteligência Artificial já está priorizando a ingestão de proteínas no seu cálculo."
                                    </p>
                                </div>

                                <div className="bg-[#16171d] border border-neutral-800 p-6 rounded-2xl shadow-md flex flex-col justify-between">
                                    <div>
                                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-4 border-b border-neutral-800 pb-2">Terminais de Execução</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                            <button type="button" onClick={() => setAbaAtiva("chat")} className="bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-wider text-center transition-all shadow-md active:scale-95 flex flex-col items-center justify-center gap-1.5">
                                                <span className="text-2xl opacity-90">🤖</span>
                                                Chat IA & Consultoria
                                            </button>
                                            <button type="button" onClick={() => setAbaAtiva("treino")} className="bg-[#0d0e12] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-wider text-center transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-1.5">
                                                <span className="text-2xl opacity-90">🏋️‍♂️</span>
                                                Biblioteca de Treinos
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center pt-4 border-t border-neutral-800 mt-auto">
                                        <button
                                            type="button"
                                            onClick={handleSair}
                                            className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-[#0d0e12] border border-red-500/20 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm transition-all duration-300 active:scale-95"
                                        >
                                            <span>Encerrar Sessão no Dispositivo</span>
                                            <span className="text-sm">🚪</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-[#16171d] to-emerald-900/10 border border-emerald-500/20 p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
                                    <div className="absolute -right-6 -bottom-6 text-[80px] opacity-5">🛒</div>
                                    <div className="z-10 text-center sm:text-left flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                                            🛒 Mercado Saudável Oficial
                                        </p>
                                        <p className="text-xs font-medium text-neutral-300 leading-relaxed">A IA montou sua dieta? Peça os ingredientes agora mesmo e receba em casa sem perder o foco.</p>
                                    </div>
                                    <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="z-10 whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 text-center w-full sm:w-auto">
                                        👉 Fazer Pedido
                                    </a>
                                </div>
                            </div>
                        </main>
                    </div>
                )}
                {abaAtiva === "chat" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <header className="p-4 flex items-center justify-between border-b border-neutral-800 bg-[#16171d] shadow-sm z-20">
                            <button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase font-mono flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors">
                                ← Voltar ao Início
                            </button>
                            <span className="text-[10px] font-bold font-mono uppercase text-neutral-500 bg-[#0d0e12] px-2.5 py-1 rounded border border-neutral-800 hidden sm:block">
                                Módulo Nutrição IA
                            </span>
                        </header>
                        <ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} setTreinoIAPescado={setTreinoIAPescado} aoAtualizarPerfil={atualizarStatusVIP} />
                    </div>
                )}
                {abaAtiva === "treino" && (
                    <div className="flex-1 flex flex-col bg-[#0d0e12] p-4 md:p-6 overflow-y-auto custom-scrollbar">
                        <header className="w-full max-w-5xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
                            <button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase font-mono flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors">
                                ← Retornar
                            </button>
                            <span className="text-neutral-100 font-bold uppercase text-sm tracking-widest">Planilhas de Treino</span>
                        </header>

                        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5 mx-auto">
                            <button type="button" onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="bg-gradient-to-br from-[#16171d] to-emerald-900/5 border border-neutral-800 hover:border-emerald-500/50 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between transition-all text-center sm:text-left group shadow-md">
                                <div className="order-2 sm:order-1 mt-3 sm:mt-0">
                                    <p className="font-bold uppercase text-lg text-neutral-100 mb-1.5 group-hover:text-emerald-400 transition-colors">Treino Inteligência Artificial</p>
                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded inline-block border ${!isVip ? 'bg-neutral-900 text-neutral-500 border-neutral-800' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {!isVip ? "Status: Bloqueado" : "Acesso Elite Ativado"}
                                    </p>
                                    <p className="text-xs font-medium text-neutral-400 mt-3 leading-relaxed hidden sm:block max-w-[260px]">O seu personal virtual monta o treino exato para a sua biometria e ajusta a carga ideal.</p>
                                </div>
                                <span className="text-5xl order-1 sm:order-2 opacity-90 group-hover:scale-105 transition-transform">🤖</span>
                            </button>

                            <button type="button" onClick={() => setModalidadeAberta('academia')} className="bg-[#16171d] hover:bg-neutral-800 border border-neutral-800 hover:border-blue-500/50 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between transition-all text-center sm:text-left group shadow-md">
                                <div className="order-2 sm:order-1 mt-3 sm:mt-0">
                                    <p className="font-bold uppercase text-lg text-neutral-100 mb-1.5 group-hover:text-blue-400 transition-colors">Metodologia Tradicional (ABC)</p>
                                    <p className="text-[10px] text-blue-400 font-bold font-mono uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded inline-block border border-blue-500/20">
                                        Acesso Livre Free
                                    </p>
                                    <p className="text-xs font-medium text-neutral-400 mt-3 leading-relaxed hidden sm:block max-w-[260px]">Biblioteca clássica com separação padrão de grupamentos musculares da academia.</p>
                                </div>
                                <span className="text-5xl order-1 sm:order-2 opacity-90 group-hover:scale-105 transition-transform">🏋️‍♂️</span>
                            </button>
                        </div>

                        {modalidadeAberta && <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />}
                    </div>
                )}
                {bloqueado && <div className="fixed inset-0 z-[500] bg-[#0d0e12]/95 backdrop-blur-md flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar"><button type="button" onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-neutral-500 hover:text-white bg-neutral-900 border border-neutral-800 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors z-[510]">✕</button><TelaPlanos /></div>}
            </div>
        );
    }

    if (etapa === "personal") {
        const hojeDataStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-4 md:p-6 overflow-y-auto font-sans z-40 custom-scrollbar">
                <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-end border-b border-neutral-800 pb-5 mb-6 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                        <img src="/logo192.png" alt="Ícone Treino Fit" className="w-12 h-12 rounded-lg shadow-sm border border-neutral-700" />
                        <div>
                            <h2 className="text-xl font-bold text-neutral-100 uppercase tracking-tight">{personalLogado?.nome}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                                <span className="text-[10px] text-neutral-400 font-semibold font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">{personalLogado?.cref}</span>
                                <span className={`text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${personalLogado?.assinaturaAtiva ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                    {personalLogado?.assinaturaAtiva ? "Licença PRO Ativa" : "Modo Teste Grátis"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleSair} className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-[10px] text-neutral-300 font-bold uppercase transition-colors shadow-sm w-full sm:w-auto">Encerrar Sessão</button>
                </header>

                <main className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pb-10">
                    <div className="lg:col-span-1 flex flex-col gap-5">
                        <div className="bg-[#16171d] border border-neutral-800 rounded-2xl p-5 shadow-md">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Resumo da Assessoria</h3>
                            <div className="grid grid-cols-2 gap-3 text-center mb-4">
                                <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-xl flex flex-col justify-center shadow-sm">
                                    <p className="text-2xl font-bold text-neutral-100">{alunosPersonal.length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Alunos</p>
                                </div>
                                <div className="p-3 bg-[#0d0e12] border border-amber-900/30 rounded-xl flex flex-col justify-center shadow-sm">
                                    <p className="text-2xl font-bold text-amber-500">{alunosPersonal.filter(a => a.statusTreino === "Rascunho IA").length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70 mt-1">Alertas IA</p>
                                </div>
                                <div className="p-3 bg-[#0d0e12] border border-red-900/30 rounded-xl flex flex-col justify-center shadow-sm">
                                    <p className="text-2xl font-bold text-red-500">{alunosPersonal.filter(a => calcularDiasSemTreino(a.checkins) >= 5 && a.statusConta !== 'Off').length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-red-500/70 mt-1">Em Risco</p>
                                </div>
                                <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-xl flex flex-col justify-center shadow-sm">
                                    <p className="text-2xl font-bold text-neutral-500">{alunosPersonal.filter(a => a.statusConta === "Off").length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Inativos</p>
                                </div>
                            </div>
                            {!personalLogado?.assinaturaAtiva && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Modo Teste Ativo</p>
                                    <p className="text-lg font-bold text-neutral-100 mt-0.5">{alunosPersonal.length} <span className="text-xs text-neutral-400 font-medium">/ 2 Alunos</span></p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-[#16171d] to-emerald-900/5 border border-emerald-500/20 rounded-2xl p-5 shadow-md relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 p-4 opacity-5 text-7xl transform rotate-12">🛒</div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 border-b border-emerald-500/10 pb-1.5 inline-block">🤝 Parceiro Oficial</p>
                            <h4 className="text-base font-bold text-neutral-100 mb-1.5 mt-1">Hortilife Praticidade</h4>
                            <p className="text-xs font-medium text-neutral-400 mb-5 leading-relaxed">Aumente a adesão dos seus alunos recomendando nosso parceiro. Eles compram a dieta no app e recebem em casa.</p>
                            <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="block w-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-white text-center font-bold py-3.5 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95">
                                👉 Ver Catálogo
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-[#16171d] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-md overflow-hidden flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-neutral-800 pb-5">
                            <h3 className="text-lg font-bold uppercase tracking-tight text-neutral-100">Carteira de Clientes</h3>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button type="button" onClick={carregarAlunosAssessoria} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold px-4 py-2.5 rounded-lg transition-colors uppercase flex-1 sm:flex-none text-center border border-neutral-700 flex items-center justify-center gap-1.5">
                                    <span>🔄</span> Atualizar
                                </button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    const link = `${window.location.origin}?ref=${personalLogado?._id}`;
                                    navigator.clipboard.writeText(link);
                                    alert(`🔗 Link copiado com sucesso!\n\nEnvie este link no WhatsApp do seu aluno:\n\n${link}`);
                                }} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg transition-colors uppercase flex-1 sm:flex-none text-center shadow-sm flex items-center justify-center gap-1.5">
                                    <span>🔗</span> Copiar Link
                                </button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    setModalNovoAluno(true);
                                }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg transition-colors uppercase w-full sm:w-auto text-center shadow-sm flex items-center justify-center gap-1.5 mt-2 sm:mt-0">
                                    <span>+</span> Novo Aluno
                                </button>
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-wider bg-[#0d0e12]/50">
                                        <th className="p-3 font-semibold rounded-tl-lg w-[25%]">Aluno & Contato</th>
                                        <th className="p-3 font-semibold w-[15%]">Objetivo</th>
                                        <th className="p-3 font-semibold w-[15%] text-center">Status Ficha</th>
                                        <th className="p-3 font-semibold w-[15%] text-center">Último Treino</th>
                                        <th className="p-3 font-semibold w-[15%] text-center">Retenção</th>
                                        <th className="p-3 font-semibold text-right rounded-tr-lg w-[15%]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium divide-y divide-neutral-800/50">
                                    {alunosPersonal.map((aluno) => {
                                        const idUnico = aluno.id || aluno._id;
                                        const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);

                                        const diasSemTreino = calcularDiasSemTreino(aluno.checkins);
                                        let corFarol = "bg-neutral-800 text-neutral-400 border-neutral-700";
                                        let iconeFarol = "⚪";
                                        let textoFarol = "Novo";

                                        if (diasSemTreino !== Infinity) {
                                            if (diasSemTreino < 3) {
                                                corFarol = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                                iconeFarol = "🟢";
                                                textoFarol = "Ativo";
                                            } else if (diasSemTreino >= 3 && diasSemTreino < 5) {
                                                corFarol = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                                iconeFarol = "🟡";
                                                textoFarol = "Atenção";
                                            } else {
                                                corFarol = "bg-red-500/10 text-red-400 border-red-500/20";
                                                iconeFarol = "🔴";
                                                textoFarol = "Risco";
                                            }
                                        }

                                        return (
                                            <tr key={idUnico} className={`hover:bg-neutral-800/30 transition-colors ${aluno.statusConta === 'Off' ? 'opacity-40 grayscale-[50%]' : ''}`}>
                                                <td className="p-3">
                                                    <div className="font-bold text-neutral-100 text-sm cursor-pointer hover:text-emerald-400 transition-colors flex items-center gap-1.5 truncate max-w-[200px]" onClick={() => setAlunoVerFeedback(aluno)}>
                                                        {aluno.nome} <span className="text-[10px] opacity-60 bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">ℹ️</span>
                                                    </div>
                                                    <div className="text-[10px] text-neutral-400 font-mono mt-1">{aluno.whatsapp}</div>
                                                </td>
                                                <td className="p-3 text-neutral-300 font-medium text-xs">{aluno.objetivo}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold font-mono uppercase inline-block border ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-900 text-neutral-400 border-neutral-700'}`}>
                                                        {aluno.statusTreino}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {checkinDeHoje ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md animate-pulse hover:bg-emerald-500/20 transition-colors cursor-pointer w-full shadow-sm">
                                                            🔥 HOJE!
                                                        </button>
                                                    ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-medium font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800 w-full hover:border-neutral-600">
                                                            {aluno.checkins[0].data}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-neutral-600 font-medium font-mono block w-full text-center">--/--</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border flex items-center gap-1.5 ${corFarol}`}>
                                                            {iconeFarol} {textoFarol}
                                                        </span>
                                                        {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                            <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="text-[#25D366] hover:scale-110 transition-transform bg-[#25D366]/10 p-1 rounded-md border border-[#25D366]/20" title="Chamar no WhatsApp">
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex flex-col gap-1.5 w-[110px] ml-auto">
                                                        <div className="flex gap-1.5">
                                                            <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold py-1.5 rounded transition-colors uppercase shadow-sm">
                                                                {aluno.statusTreino === "Rascunho IA" ? "Ver IA" : "Treino"}
                                                            </button>
                                                            <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="flex-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[9px] font-bold py-1.5 rounded transition-colors uppercase">
                                                                Perfil
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button type="button" onClick={() => {
                                                                setModoEdicaoBiometria(false);
                                                                setAlunoEditandoPerfil({
                                                                    ...aluno,
                                                                    peso: aluno.peso ?? "",
                                                                    altura: aluno.altura ?? "",
                                                                    idade: aluno.idade ?? "",
                                                                    genero: aluno.genero ?? "Masculino",
                                                                    objetivo: aluno.objetivo ?? aluno.meta ?? "Emagrecimento",
                                                                    nivel: aluno.nivel ?? "Intermediário",
                                                                    diasTreino: aluno.diasTreino ?? "5",
                                                                    restricoes: aluno.restricoes ?? "",
                                                                    lesoes: aluno.lesoes ?? "",
                                                                    medidas: aluno.medidas ?? {}
                                                                });
                                                            }} className="flex-1 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700 text-[9px] font-bold py-1.5 rounded transition-colors uppercase">
                                                                Editar
                                                            </button>
                                                            <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className={`flex-1 border text-[9px] font-bold py-1.5 rounded transition-colors uppercase ${aluno.statusConta === 'Ativo' ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white'}`}>
                                                                {aluno.statusConta === "Ativo" ? "Off" : "On"}
                                                            </button>
                                                            <button type="button" onClick={() => deletarAluno(idUnico)} className="w-7 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded font-bold text-xs transition-colors flex items-center justify-center">
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {alunosPersonal.length === 0 && (
                                <div className="text-center py-12 bg-[#0d0e12]/50 rounded-b-lg">
                                    <p className="text-xs font-bold text-neutral-500 uppercase">Sua carteira de alunos está vazia.</p>
                                    <p className="text-[10px] font-medium text-neutral-600 mt-1.5">Clique em "+ Novo Aluno" ou envie seu Link IA para começar.</p>
                                </div>
                            )}
                        </div>

                        <div className="md:hidden flex flex-col space-y-4">
                            {alunosPersonal.map((aluno) => {
                                const idUnico = aluno.id || aluno._id;
                                const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);

                                const diasSemTreino = calcularDiasSemTreino(aluno.checkins);
                                let corFarol = "bg-neutral-800 text-neutral-400 border-neutral-700";
                                let iconeFarol = "⚪";
                                let textoFarol = "Novo";

                                if (diasSemTreino !== Infinity) {
                                    if (diasSemTreino < 3) {
                                        corFarol = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                        iconeFarol = "🟢";
                                        textoFarol = "Ativo";
                                    } else if (diasSemTreino >= 3 && diasSemTreino < 5) {
                                        corFarol = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                        iconeFarol = "🟡";
                                        textoFarol = "Atenção";
                                    } else {
                                        corFarol = "bg-red-500/10 text-red-400 border-red-500/20";
                                        iconeFarol = "🔴";
                                        textoFarol = "Risco";
                                    }
                                }

                                return (
                                    <div key={idUnico} className={`bg-[#0d0e12] border border-neutral-800 p-5 rounded-2xl flex flex-col space-y-4 shadow-sm ${aluno.statusConta === 'Off' ? 'opacity-50 grayscale-[50%]' : ''}`}>
                                        <div className="flex justify-between items-start border-b border-neutral-800/60 pb-3">
                                            <div className="flex-1 pr-3">
                                                <p className="font-bold text-neutral-100 text-sm cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5" onClick={() => setAlunoVerFeedback(aluno)}>
                                                    {aluno.nome} <span className="text-[10px] opacity-60 bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200 shadow-inner">ℹ️</span>
                                                </p>
                                                <p className="text-[11px] text-neutral-400 font-medium font-mono mt-1">{aluno.whatsapp}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold font-mono uppercase text-center border ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-800 text-neutral-300 border-neutral-700'}`}>
                                                {aluno.statusTreino}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#16171d] p-3 rounded-xl border border-neutral-800/50">
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">Objetivo Base</p>
                                                <p className="text-xs font-semibold text-neutral-200 truncate">{aluno.objetivo}</p>
                                            </div>
                                            <div className="bg-[#16171d] p-3 rounded-xl border border-neutral-800/50 flex flex-col justify-center">
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">Último Treino</p>
                                                {checkinDeHoje ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md animate-pulse cursor-pointer w-full">
                                                        🔥 HOJE!
                                                    </button>
                                                ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-medium font-mono text-neutral-300 cursor-pointer hover:text-white bg-neutral-900 border border-neutral-800 py-1 rounded-md w-full">
                                                        {aluno.checkins[0].data}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-neutral-500 font-medium font-mono block w-full text-center">--/--</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#16171d] p-3 rounded-xl border border-neutral-800/50 mt-1 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border flex items-center gap-1.5 ${corFarol}`}>
                                                    {iconeFarol} {textoFarol}
                                                </span>
                                            </div>
                                            {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all hover:bg-[#25D366]/20">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="pt-2 grid grid-cols-2 gap-2 border-t border-neutral-800/60 mt-1">
                                            <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2.5 rounded-lg transition-colors uppercase shadow-sm flex items-center justify-center gap-1.5">
                                                <span>{aluno.statusTreino === "Rascunho IA" ? "🤖" : "📝"}</span> {aluno.statusTreino === "Rascunho IA" ? "Revisar Plano IA" : "Editar Treino Atual"}
                                            </button>

                                            <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase flex items-center justify-center gap-1">
                                                📊 Avaliação Fís.
                                            </button>

                                            <button type="button" onClick={() => {
                                                setModoEdicaoBiometria(false);
                                                setAlunoEditandoPerfil({
                                                    ...aluno,
                                                    peso: aluno.peso ?? "",
                                                    altura: aluno.altura ?? "",
                                                    idade: aluno.idade ?? "",
                                                    genero: aluno.genero ?? "Masculino",
                                                    objetivo: aluno.objetivo ?? aluno.meta ?? "Emagrecimento",
                                                    nivel: aluno.nivel ?? "Intermediário",
                                                    diasTreino: aluno.diasTreino ?? "5",
                                                    restricoes: aluno.restricoes ?? "",
                                                    lesoes: aluno.lesoes ?? "",
                                                    medidas: aluno.medidas ?? {}
                                                });
                                            }} className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase flex items-center justify-center gap-1">
                                                ✏️ Dados / Perfil
                                            </button>

                                            <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className={`border text-[10px] font-bold py-2 rounded-lg transition-colors uppercase ${aluno.statusConta === 'Ativo' ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white'}`}>
                                                {aluno.statusConta === "Ativo" ? "⏸️ Pausar Conta" : "▶️ Ativar Conta"}
                                            </button>

                                            <button type="button" onClick={() => deletarAluno(idUnico)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg font-bold text-[10px] py-2 uppercase transition-colors flex items-center justify-center gap-1">
                                                ✕ Excluir Aluno
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* MODAL PRESCREVER TREINO MANUAL */}
                {alunoEmEdicao && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] h-full sm:h-auto">
                            <header className="p-5 md:p-6 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1c1d26] gap-3 sm:gap-0">
                                <div>
                                    <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">⚡ Prescrevendo Plano Pro</span>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{alunoEmEdicao.nome}</h3>
                                </div>
                                <button type="button" onClick={() => setAlunoEmEdicao(null)} className="text-neutral-400 hover:text-white text-[11px] uppercase font-mono font-bold border border-neutral-700 hover:bg-neutral-800 px-3.5 py-2 rounded-lg transition-all">Fechar ✕</button>
                            </header>
                            <form onSubmit={salvarTreinoPersonal} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">

                                <div className="bg-[#0d0e12] p-5 rounded-xl border border-blue-500/20 shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 text-5xl opacity-10">💧</div>
                                    <label className="text-[11px] uppercase font-bold tracking-wider text-blue-400 block mb-3 flex items-center gap-1.5">
                                        <span className="text-base">🚰</span> Meta de Hidratação Diária <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-400 ml-2 hidden sm:inline-block">Calculada pela IA</span>
                                    </label>
                                    <input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-3.5 rounded-lg text-sm text-neutral-100 font-semibold outline-none focus:border-blue-500/50 transition-colors placeholder-neutral-600" value={aguaForm} onChange={(e) => setAguaForm(e.target.value)} placeholder="Ex: 3.5 Litros" />
                                </div>

                                <div className="bg-[#0d0e12] border border-neutral-800 p-5 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-5 border-b border-neutral-800/60 pb-3">
                                        <span className="text-xl">🏋️‍♂️</span>
                                        <p className="text-sm font-bold uppercase tracking-widest text-neutral-300">Estrutura de Exercícios Semanal</p>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-3 border-b border-neutral-800/40 mb-5 scrollbar-none snap-x">
                                        {DIAS_SEMANA.map(dia => (
                                            <button
                                                key={dia}
                                                type="button"
                                                onClick={() => setDiaAbaPersonal(dia)}
                                                className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex-shrink-0 border snap-center ${diaAbaPersonal === dia
                                                    ? 'bg-neutral-800 border-emerald-500 text-emerald-400 shadow-sm'
                                                    : 'border-neutral-800/50 text-neutral-500 hover:bg-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
                                                    }`}
                                            >
                                                {dia}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 bg-[#16171d] p-3.5 rounded-lg border border-neutral-800 gap-3 sm:gap-0">
                                        <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Ficha de {diaAbaPersonal}
                                        </p>
                                        <button type="button" onClick={adicionarExercicioForm} className="w-full sm:w-auto bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-4 py-2.5 rounded-lg hover:bg-emerald-600/20 transition-all uppercase flex items-center justify-center gap-1.5">
                                            <span className="text-sm leading-none">+</span> Adicionar Exercício
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(() => {
                                            const diaObj = treinoForm.find(d => d.dia === diaAbaPersonal) || { exercicios: [] };
                                            if (diaObj.exercicios.length === 0) {
                                                return <p className="text-xs text-neutral-500 font-medium uppercase italic text-center py-8 bg-[#16171d] rounded-xl border border-neutral-800 border-dashed">Nenhum exercício para este dia.<br /><span className="text-[10px] text-neutral-600 mt-1.5 block normal-case">O aluno verá como "Dia de Descanso".</span></p>;
                                            }

                                            return diaObj.exercicios.map((ex, idx) => (
                                                <div key={idx} className="bg-[#16171d] border border-neutral-800 hover:border-neutral-700 p-4 sm:p-5 rounded-xl space-y-4 relative group shadow-sm transition-colors">
                                                    <div className="absolute top-3 right-3 z-10">
                                                        <button type="button" onClick={() => removerExercicioForm(idx)} className="text-neutral-500 hover:text-white bg-[#0d0e12] hover:bg-red-600 border border-neutral-700 hover:border-red-500 text-[9px] uppercase font-mono font-bold tracking-widest transition-colors px-2.5 py-1.5 rounded-md flex items-center gap-1">✕ Remover</button>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-1 border-b border-neutral-800/60 pb-2 pr-20">
                                                        <div className="bg-neutral-800 text-neutral-300 font-bold text-[10px] px-2 py-0.5 rounded font-mono">{idx + 1}</div>
                                                        <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Detalhes do Movimento</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                        <div className="sm:col-span-6">
                                                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">Nome do Exercício</label>
                                                            <input required type="text" className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500/50 transition-colors placeholder-neutral-600" value={ex.nome} onChange={(e) => handleExercicioChange(idx, "nome", e.target.value)} placeholder="Ex: Supino Reto com Halteres" />
                                                        </div>
                                                        <div className="sm:col-span-3">
                                                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">Qtd. Séries</label>
                                                            <div className="relative">
                                                                <input required type="number" min="1" max="10" className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500/50 transition-colors text-center pr-8" value={ex.series} onChange={(e) => handleExercicioChange(idx, "series", Number(e.target.value))} />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-[10px] uppercase">x</span>
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-3">
                                                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">Repetições</label>
                                                            <input required type="text" className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-sm font-semibold outline-none text-neutral-100 focus:border-emerald-500/50 transition-colors text-center placeholder-neutral-600" value={ex.reps} onChange={(e) => handleExercicioChange(idx, "reps", e.target.value)} placeholder="8 a 12" />
                                                        </div>
                                                        <div className="sm:col-span-12 pt-1 border-t border-neutral-800/40">
                                                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider flex items-center gap-1.5"><span>📌</span> Observação / Instrução do Coach (Opcional)</label>
                                                            <input type="text" className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-xs font-medium outline-none text-emerald-400 focus:border-emerald-500/50 transition-colors placeholder-neutral-700 italic" value={ex.obs || ""} onChange={(e) => handleExercicioChange(idx, "obs", e.target.value)} placeholder="Ex: Focar na fase excêntrica, 3 segundos descendo..." />
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div className="bg-[#0d0e12] border border-neutral-800 p-5 rounded-xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-neutral-800/60 mb-5 gap-3 sm:gap-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🍽️</span>
                                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-300">Planejamento Nutricional</p>
                                        </div>
                                        <button type="button" onClick={adicionarDietaForm} className="w-full sm:w-auto bg-blue-600/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-4 py-2.5 rounded-lg hover:bg-blue-600/20 transition-all uppercase flex items-center justify-center gap-1.5">
                                            <span className="text-sm leading-none">+</span> Nova Refeição
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {dietaForm.length === 0 && (
                                            <p className="text-xs text-neutral-500 font-medium uppercase italic text-center py-5 bg-[#16171d] rounded-xl border border-neutral-800 border-dashed mb-1">Plano alimentar vazio.</p>
                                        )}
                                        {dietaForm.map((ref, idx) => (
                                            <div key={idx} className="bg-[#16171d] border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row gap-4 relative sm:items-start shadow-sm hover:border-neutral-700 transition-colors pt-8 sm:pt-4 pr-4 sm:pr-12">
                                                <div className="absolute top-3 left-3 sm:hidden bg-neutral-800 text-neutral-400 font-bold text-[9px] px-2 py-0.5 rounded font-mono">Refeição {idx + 1}</div>

                                                <div className="w-full sm:w-1/3">
                                                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">Horário / Nome</label>
                                                    <input required type="text" placeholder="Ex: Café da Manhã (08:00)" className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-xs font-semibold outline-none text-neutral-100 focus:border-blue-500/50 transition-colors placeholder-neutral-600" value={ref.refeicao} onChange={(e) => handleDietaChange(idx, "refeicao", e.target.value)} />
                                                </div>
                                                <div className="w-full sm:w-2/3">
                                                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">Alimentos e Quantidades</label>
                                                    <input required type="text" placeholder="Ex: 3 Ovos inteiros, 2 fatias de pão integral..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3 rounded-lg text-xs font-semibold outline-none text-neutral-100 focus:border-blue-500/50 transition-colors placeholder-neutral-600" value={ref.itens} onChange={(e) => handleDietaChange(idx, "itens", e.target.value)} />
                                                </div>

                                                <button type="button" onClick={() => removerDietaForm(idx)} className="absolute top-3 right-3 text-neutral-500 hover:text-white font-bold text-sm bg-[#0d0e12] hover:bg-red-600 border border-neutral-700 hover:border-red-500 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="Remover refeição">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <footer className="pt-6 mt-4 border-t border-neutral-800 flex flex-col sm:flex-row gap-3 justify-end text-xs font-bold sticky bottom-0 bg-[#16171d] pb-5 sm:pb-0 z-20">
                                    <button type="button" onClick={() => setAlunoEmEdicao(null)} className="bg-[#0d0e12] border border-neutral-700 text-neutral-300 p-4 rounded-lg uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-colors w-full sm:w-auto text-center">Cancelar Alterações</button>
                                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-lg uppercase tracking-widest transition-all shadow-md px-8 w-full sm:w-auto text-center active:scale-95 flex items-center justify-center gap-2">
                                        <span>✓</span> Salvar Planilhas e Enviar
                                    </button>
                                </footer>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DETALHES DO FEEDBACK (RPE E RESPOSTAS) */}
                {alunoVerFeedback && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAlunoVerFeedback(null)}>
                        <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-2xl p-6 relative shadow-xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setAlunoVerFeedback(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold bg-neutral-800 w-7 h-7 rounded flex items-center justify-center transition-colors">✕</button>

                            <div className="flex items-center gap-3 mb-5 border-b border-neutral-800 pb-4">
                                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xl">📋</div>
                                <div>
                                    <h3 className="font-bold text-white uppercase text-sm tracking-tight">Relatório de Treino</h3>
                                    <p className="text-[10px] text-emerald-400 font-bold font-mono uppercase mt-0.5">{alunoVerFeedback.nome}</p>
                                </div>
                            </div>

                            {alunoVerFeedback.checkins && alunoVerFeedback.checkins.length > 0 ? (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {alunoVerFeedback.checkins.slice(0, 3).map((checkin, index) => (
                                        <div key={index} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-inner">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold text-neutral-100 uppercase">{checkin.data} - {checkin.diaSemana}</span>
                                                {index === 0 && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Último</span>}
                                            </div>

                                            {checkin.feedback ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <div className="bg-[#16171d] p-2.5 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Intensidade</p>
                                                            <p className="text-xs font-semibold text-neutral-100">{checkin.feedback.intensidade}</p>
                                                        </div>
                                                        <div className="bg-[#16171d] p-2.5 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Carga</p>
                                                            <p className="text-xs font-semibold text-neutral-100">{checkin.feedback.carga}</p>
                                                        </div>
                                                    </div>
                                                    {checkin.feedback.comentario && (
                                                        <div className="bg-[#16171d] p-3 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Observações do Aluno</p>
                                                            <p className="text-xs font-medium text-neutral-300 italic">"{checkin.feedback.comentario}"</p>
                                                        </div>
                                                    )}

                                                    {/* CAIXA DE RESPOSTA DO PERSONAL */}
                                                    {checkin.respostaPersonal ? (
                                                        <div className="bg-emerald-900/10 p-3 rounded-lg border-l-2 border-emerald-500 mt-3">
                                                            <p className="text-[9px] text-emerald-400 font-bold uppercase mb-1">Sua Resposta</p>
                                                            <p className="text-xs font-medium text-neutral-300 italic">"{checkin.respostaPersonal}"</p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 flex flex-col gap-2 border-t border-neutral-800/60 pt-3">
                                                            <input type="text" placeholder="Responder feedback..." className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs font-medium outline-none text-neutral-100 focus:border-neutral-600 placeholder-neutral-500"
                                                                value={respostasFeedback[checkin.data] || ""}
                                                                onChange={e => setRespostasFeedback({ ...respostasFeedback, [checkin.data]: e.target.value })}
                                                            />
                                                            <button type="button" onClick={() => enviarRespostaFeedback(alunoVerFeedback.id || alunoVerFeedback._id, checkin.data)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-lg text-[10px] uppercase transition-colors shadow-sm">Responder Aluno</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-neutral-500 font-medium italic">Check-in simples (Sem feedback detalhado).</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-[#0d0e12] rounded-xl border border-neutral-800">
                                    <p className="text-xs text-neutral-500 uppercase font-bold">Nenhum treino registrado ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ✅ TELA DE BLOQUEIO DE PLANOS DA KIWIFY */}
                {modalPlanosPersonal && (
                    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#16171d] border border-emerald-500/30 p-6 md:p-8 rounded-2xl shadow-xl relative text-center">
                            <button onClick={() => setModalPlanosPersonal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold bg-neutral-800 w-7 h-7 rounded flex items-center justify-center transition-colors">✕</button>

                            <span className="text-4xl block mb-3">🔒</span>
                            <h3 className="text-xl font-bold uppercase tracking-tight text-neutral-100 mb-1.5">Limite Atingido</h3>
                            <p className="text-neutral-400 font-medium text-xs mb-6 leading-relaxed">Você já possui {alunosPersonal.length} alunos cadastrados. Ative a licença PRO para ter alunos ilimitados + Inteligência Artificial.</p>

                            <div className="grid grid-cols-1 gap-3 mb-5">
                                <a href={KIWIFY_MENSAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border border-neutral-800 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between transition-all group text-left">
                                    <div>
                                        <p className="text-xs font-bold text-neutral-100 uppercase">Plano Mensal Recorrente</p>
                                        <p className="text-[10px] font-medium text-neutral-500 mt-0.5">Cancele quando quiser</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-bold text-emerald-400">R$ 49,90</p>
                                        <p className="text-[9px] font-bold text-neutral-500 uppercase font-mono">/mês</p>
                                    </div>
                                </a>

                                <a href={KIWIFY_ANUAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border border-emerald-500/40 hover:border-emerald-500 p-5 rounded-xl flex items-center justify-between transition-all relative text-left group shadow-sm">
                                    <span className="absolute -top-2.5 right-4 bg-emerald-500 text-neutral-900 font-bold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-sm shadow-sm">Melhor Custo-Benefício</span>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-100 uppercase">Plano Anual Elite</p>
                                        <p className="text-[10px] font-medium text-emerald-400 mt-0.5">Economize mais de 30%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-emerald-400">R$ 399,00</p>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase font-mono mt-0.5">Eq. R$ 33,25/mês</p>
                                    </div>
                                </a>
                            </div>
                            <p className="text-[9px] font-medium text-neutral-500 uppercase font-mono">Liberação automática após o pagamento.</p>
                        </div>
                    </div>
                )}

                {/* ✅ AQUI RENDERIZA A AVALIAÇÃO NO PAINEL DO PERSONAL E DO ALUNO */}
                {alunoVerAvaliacao && renderModalAvaliacao(alunoVerAvaliacao, () => setAlunoVerAvaliacao(null))}
                {/* MODAL DE EDIÇÃO DE PERFIL DO ALUNO */}
                {alunoEditandoPerfil && (
                    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-[#16171d] border-2 border-neutral-800 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden">
                            <header className="p-6 border-b-2 border-neutral-800 flex justify-between items-center bg-gradient-to-r from-[#1c1d26] to-[#16171d]">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Editar Ficha do Aluno</h3>
                                    <p className="text-xs text-emerald-400 font-bold font-mono mt-1">{alunoEditandoPerfil.nome}</p>
                                </div>
                                <button type="button" onClick={() => setAlunoEditandoPerfil(null)} className="text-neutral-400 hover:text-white text-xs font-black uppercase bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-xl transition-colors shadow-sm">✕ Fechar</button>
                            </header>
                            <form onSubmit={atualizarBiometriaAluno} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Peso Atual (kg)</label>
                                        <input required type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-base font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.peso} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, peso: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Altura (m)</label>
                                        <input required type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-base font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.altura} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, altura: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Objetivo Base</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.objetivo} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, objetivo: e.target.value })}>
                                            <option value="Emagrecimento">Emagrecimento</option>
                                            <option value="Hipertrofia">Hipertrofia</option>
                                            <option value="Performance">Performance</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Nível</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.nivel} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, nivel: e.target.value })}>
                                            <option value="Iniciante">Iniciante</option>
                                            <option value="Intermediário">Intermediário</option>
                                            <option value="Avançado">Avançado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Restrições Alimentares</label>
                                    <input type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.restricoes || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, restricoes: e.target.value })} placeholder="Nenhuma" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Dores ou Lesões</label>
                                    <input type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.lesoes || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, lesoes: e.target.value })} placeholder="Nenhuma" />
                                </div>

                                <footer className="pt-6 border-t-2 border-neutral-800 flex flex-col sm:flex-row justify-end gap-4 mt-8">
                                    <button type="button" onClick={() => setAlunoEditandoPerfil(null)} className="bg-transparent border-2 border-neutral-800 text-neutral-300 px-6 py-4 rounded-xl font-black uppercase text-sm hover:bg-neutral-800 transition-colors">Cancelar</button>
                                    <button type="submit" disabled={isRecalculando} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase text-sm shadow-[0_10px_25px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isRecalculando ? "Salvando..." : "✓ Atualizar na IA"}
                                    </button>
                                </footer>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ✅ PAINEL DO ALUNO
    if (etapa === "aluno") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-4 md:p-6 overflow-y-auto font-sans z-40 custom-scrollbar">
                <header className="w-full max-w-md mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-5">
                    <div>
                        <p className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider">Consultoria Privada Treino Fit</p>
                        <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-tight mt-0.5 truncate max-w-[200px]">{alunoLogado?.nome}</h2>
                        <p className="text-[10px] font-semibold text-neutral-400 font-mono mt-0.5">Objetivo: {alunoLogado?.objetivo}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setModalAvaliacaoAluno(true)} className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm">
                            📋 Avaliação
                        </button>
                        <button type="button" onClick={() => { setEtapa("triagem"); setAlunoLogado(null); }} className="px-3 py-1.5 bg-red-600/10 border border-red-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider text-red-500 transition-all duration-200 hover:bg-red-600 hover:text-white shadow-sm">
                            Sair
                        </button>
                    </div>
                </header>

                <main className="w-full max-w-md mx-auto flex-1 space-y-5 pb-8">
                    <div className="bg-gradient-to-br from-[#16171d] to-[#0d0e12] border border-neutral-800 p-5 rounded-2xl shadow-md flex items-center justify-between">
                        <div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Check-ins Validados</p><h3 className="text-4xl font-bold text-neutral-100 mt-1">{alunoLogado?.checkins?.length || 0}</h3></div>
                        <button type="button" onClick={iniciarCheckin} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md active:scale-95">Confirmar Treino Hoje</button>
                    </div>

                    {alunoLogado?.checkins?.[0]?.respostaPersonal && (
                        <div className="bg-emerald-500/10 border-l-2 border-emerald-500 p-4 rounded-r-xl rounded-l-sm shadow-sm mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">💬 Mensagem do seu Treinador</p>
                            <p className="text-xs font-medium text-neutral-200 italic">"{alunoLogado.checkins[0].respostaPersonal}"</p>
                        </div>
                    )}


                    {alunoLogado?.metaAgua && (
                        <div className="bg-gradient-to-br from-[#16171d] to-[#0d0e12] border border-blue-500/20 p-5 rounded-2xl shadow-md flex flex-col mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5"><span className="text-base">💧</span> Hidratação Inteligente</p>
                                    <h3 className="text-2xl font-bold text-neutral-100 mt-1">{alunoLogado.metaAgua}</h3>
                                </div>
                                <span className="text-4xl opacity-80 drop-shadow-md">🚰</span>
                            </div>

                            {/* Formulário Embutido para Configurar as Notificações */}
                            <div className="border-t border-neutral-800/60 pt-4 mt-1">
                                <p className="text-[10px] text-neutral-400 mb-3 uppercase font-bold">Configurar Alerta no Celular</p>

                                <div className="grid grid-cols-2 gap-2.5 mb-4">
                                    <div>
                                        <label className="text-[9px] font-bold text-neutral-500 uppercase">Início (Hora)</label>
                                        <input type="number" min="0" max="23" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-sm font-semibold text-neutral-100 outline-none focus:border-blue-500/50 text-center transition-colors" value={configAgua.horaInicio} onChange={e => setConfigAgua({ ...configAgua, horaInicio: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-neutral-500 uppercase">Fim (Hora)</label>
                                        <input type="number" min="0" max="23" className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-sm font-semibold text-neutral-100 outline-none focus:border-blue-500/50 text-center transition-colors" value={configAgua.horaFim} onChange={e => setConfigAgua({ ...configAgua, horaFim: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-neutral-500 uppercase">Intervalo</label>
                                        <select className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs font-semibold text-neutral-100 outline-none focus:border-blue-500/50 text-center transition-colors cursor-pointer" value={configAgua.intervaloHoras} onChange={e => setConfigAgua({ ...configAgua, intervaloHoras: e.target.value })}>
                                            <option value="1">1h</option>
                                            <option value="2">2h</option>
                                            <option value="3">3h</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-neutral-500 uppercase">Duração</label>
                                        <select className="w-full bg-[#0d0e12] border border-neutral-800 p-2.5 rounded-lg text-xs font-semibold text-neutral-100 outline-none focus:border-blue-500/50 text-center transition-colors cursor-pointer" value={configAgua.tipoFrequencia} onChange={e => setConfigAgua({ ...configAgua, tipoFrequencia: e.target.value })}>
                                            <option value="Diário">Apenas Hoje</option>
                                            <option value="Mensal">Mensal</option>
                                            <option value="Definitivo">Definitivo</option>
                                        </select>
                                    </div>
                                </div>

                                <button onClick={async () => {
                                    try {
                                        const publicVapidKey = 'BH1RQXRkaFukYxIKfMfqqN1MEh_ruMEMk1toExeB_3K2nrVHzS_Px5WNtoPto0i5LosEdNNQ_MTV6amGefJyoXc';
                                        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);
                                        const registration = await navigator.serviceWorker.register('/service-worker.js');
                                        const subscription = await registration.pushManager.subscribe({
                                            userVisibleOnly: true,
                                            applicationServerKey: convertedVapidKey
                                        });

                                        const id = alunoLogado.id || alunoLogado._id;
                                        const payload = { ...configAgua, ativo: true, subscription };

                                        const res = await fetch(`${API_URL}/aluno/${id}/agua`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });

                                        if (res.ok) alert("✅ Notificações ativadas! O seu celular agora pode ler as mensagens.");
                                    } catch (e) {
                                        console.error(e);
                                        alert("Erro ao ativar. Verifique se você permitiu notificações no navegador.");
                                    }
                                }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-[11px] uppercase transition-colors shadow-sm flex justify-center items-center gap-1.5 active:scale-95">
                                    <span className="text-sm">🔔</span> Ativar Alertas
                                </button>
                            </div>
                        </div>
                    )}

                    {alunoLogado?.dietaPrescrita && alunoLogado.dietaPrescrita.length > 0 && (
                        <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-2xl shadow-md space-y-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-3 border-b border-neutral-800/60 pb-2 flex items-center gap-1.5"><span className="text-base">🍽️</span> Seu Plano Alimentar</p>
                            <div className="space-y-2.5">
                                {alunoLogado.dietaPrescrita.map((ref, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl shadow-inner relative overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-blue-500/40"></div>
                                        <p className="text-xs font-bold text-neutral-100 tracking-tight uppercase mb-1 pl-1.5">{ref.refeicao}</p>
                                        <p className="text-[11px] font-medium text-neutral-300 pl-1.5 leading-relaxed">{ref.itens}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 bg-gradient-to-r from-emerald-900/10 to-blue-900/10 border border-emerald-500/20 p-5 rounded-xl text-center shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">🛒 Facilite sua Dieta!</p>
                                <p className="text-[10px] font-medium text-neutral-400 mb-4 leading-relaxed">Peça as carnes, frutas e verduras do seu plano sem sair de casa e sem perder o foco na semana.</p>
                                <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm active:scale-95">
                                    👉 Pedir na Hortilife
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Calendário de Treinos Semanal</p>
                        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none snap-x">
                            {DIAS_SEMANA.map((dia) => {
                                const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
                                const ehHoje = diaAtualSistema.toLowerCase().includes(dia.toLowerCase().slice(0, 4));
                                const ativo = diaAbaAluno === dia;
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setDiaAbaAluno(dia)}
                                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all flex-shrink-0 border snap-center ${ativo
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                            : ehHoje
                                                ? 'bg-neutral-900 border-blue-500/40 text-blue-400'
                                                : 'bg-[#16171d] border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                                            }`}
                                    >
                                        {dia.slice(0, 3)} {ehHoje && "•"}
                                    </button>
                                );
                            })}
                        </div>

                        {(() => {
                            const rotinaDoDia = alunoLogado?.treinoSemanal?.find(t => t.dia === diaAbaAluno);
                            if (!rotinaDoDia || !rotinaDoDia.exercicios || rotinaDoDia.exercicios.length === 0) {
                                return (
                                    <div className="bg-[#16171d] border border-neutral-800 p-8 rounded-2xl text-center shadow-md mt-2 border-dashed">
                                        <span className="text-3xl mb-2 block opacity-50">🧘‍♂️</span>
                                        <p className="text-xs text-neutral-400 font-bold uppercase font-mono tracking-wider">Nenhum treino para {diaAbaAluno}.<br />Dia de Descanso!</p>
                                    </div>
                                );
                            }

                            return rotinaDoDia.exercicios.map((ex, i) => {
                                const chaveUnicaExercicio = `${diaAbaAluno}-${i}`;
                                const estaconcluido = exerciciosConcluidos.includes(chaveUnicaExercicio);
                                const todasSeriesFeitas = Array.from({ length: ex.series || 0 }).every((_, sIdx) => seriesFeitas[`${diaAbaAluno}-${i}-s${sIdx + 1}`]);

                                return (
                                    <div key={i} className={`bg-[#16171d] border transition-all rounded-2xl overflow-hidden shadow-md mt-3 ${estaconcluido || todasSeriesFeitas ? 'border-emerald-500/40 opacity-90' : 'border-neutral-800'}`}>
                                        <div className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 relative">
                                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-neutral-800 to-transparent rounded-bl-full opacity-20 pointer-events-none"></div>
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-2.5 mb-1.5">
                                                    <span className="text-[10px] font-bold text-neutral-500 bg-[#0d0e12] border border-neutral-800 px-1.5 py-0.5 rounded font-mono">{i + 1}</span>
                                                    <h4 className={`font-bold uppercase text-base tracking-tight text-neutral-100 ${estaconcluido || todasSeriesFeitas ? 'text-emerald-400' : ''}`}>{ex.nome}</h4>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow-inner">{ex.series} Séries × {ex.reps} Reps</span>
                                                    <button type="button" onClick={() => abrirExercicioVisual(ex, setModalGifAberto)} className="bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 hover:border-neutral-500 text-[9px] font-bold px-3 py-1 rounded-md transition-colors uppercase border border-neutral-700 shadow-sm flex items-center gap-1">
                                                        <span className="text-[10px]">▶</span> Ver GIF
                                                    </button>
                                                </div>
                                                {ex.obs && <p className="text-xs text-neutral-300 font-medium mt-4 bg-[#0d0e12] border-l-2 border-sky-500 p-3 rounded-r-lg font-sans shadow-inner leading-relaxed"><span className="text-sky-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Dica do Coach:</span> {ex.obs}</p>}
                                            </div>

                                            <button type="button" onClick={() => alternarConclusaoExercicio(chaveUnicaExercicio)} className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 self-end sm:self-center mt-2 sm:mt-0 ${estaconcluido || todasSeriesFeitas ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' : 'border-neutral-600 bg-[#0d0e12] text-transparent hover:border-neutral-400 hover:bg-neutral-800'}`}>✓</button>
                                        </div>

                                        <div className="px-5 pb-5">
                                            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-neutral-800/60 mt-1">
                                                {Array.from({ length: ex.series || 0 }).map((_, sIdx) => {
                                                    const numSerie = sIdx + 1;
                                                    const chaveSerie = `${diaAbaAluno}-${i}-s${numSerie}`;
                                                    const isFeita = seriesFeitas[chaveSerie];

                                                    return (
                                                        <button
                                                            key={numSerie}
                                                            type="button"
                                                            onClick={() => marcarSerie(i, numSerie, ex.series)}
                                                            className={`py-3 rounded-xl flex flex-col items-center justify-center transition-all border ${isFeita ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm scale-[1.02]' : 'bg-[#0d0e12] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}
                                                        >
                                                            <span className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-90">Série {numSerie}</span>
                                                            <span className="text-base font-bold">{isFeita ? '✓' : '⬜'}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {timerAtivo && timerDescanso > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 border border-blue-500 text-white px-6 py-3 rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center gap-4 z-50 animate-bounce">
                            <span className="text-2xl drop-shadow-sm">⏱️</span>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold opacity-90 leading-none mb-1">Descanso</p>
                                <p className="text-2xl font-bold font-mono leading-none">{timerDescanso}s</p>
                            </div>
                            <button type="button" onClick={() => setTimerAtivo(false)} className="ml-3 bg-white/20 hover:bg-white/30 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors border border-white/20">✕</button>
                        </div>
                    )}

                    {modalGifAberto && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalGifAberto(null)}>
                            <div className="w-full max-w-sm bg-[#16171d] border border-sky-500/40 rounded-2xl overflow-hidden shadow-xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalGifAberto(null)} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-lg flex items-center justify-center text-xs font-bold transition-colors border border-neutral-600 hover:border-red-400">✕</button>
                                <div className="p-5 bg-gradient-to-r from-[#1c1d26] to-[#16171d] border-b border-neutral-800">
                                    <h3 className="font-bold text-neutral-100 uppercase text-sm pr-10 tracking-tight leading-tight">{modalGifAberto.nome}</h3>
                                </div>
                                <div className="w-full bg-[#0d0e12] flex justify-center p-5 min-h-[250px] items-center">
                                    <img src={modalGifAberto.url} alt={modalGifAberto.nome} className="max-w-full rounded-lg shadow-md border border-neutral-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {modalFeedbackAberto && (
                        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalFeedbackAberto(false)}>
                            <div className="w-full max-w-md bg-[#16171d] border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalFeedbackAberto(false)} className="absolute top-4 right-4 text-neutral-500 font-bold hover:text-white bg-[#0d0e12] border border-neutral-700 w-8 h-8 rounded-lg flex items-center justify-center transition-colors">✕</button>
                                <div className="text-center mb-6 pt-1">
                                    <span className="text-5xl mb-3 block drop-shadow-sm">🔥</span>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Treino Concluído!</h3>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1.5 bg-emerald-500/10 inline-block px-2.5 py-0.5 rounded border border-emerald-500/20">Dê o feedback para seu treinador</p>
                                </div>

                                <form onSubmit={confirmarCheckinComFeedback} className="space-y-5">
                                    <div className="bg-[#0d0e12] p-4 rounded-xl border border-neutral-800">
                                        <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2.5 text-center">Qual foi a Intensidade?</label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {["Leve 🟢", "Moderado 🟡", "Intenso 🔴", "Extremo ☠️"].map(nivel => (
                                                <button key={nivel} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, intensidade: nivel })} className={`py-3 rounded-lg text-[11px] font-bold uppercase transition-all border ${feedbackTreino.intensidade === nivel ? 'bg-orange-600 border-orange-500 text-white shadow-sm scale-[1.02]' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800'}`}>
                                                    {nivel.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-[#0d0e12] p-4 rounded-xl border border-neutral-800">
                                        <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-2.5 text-center">E os Pesos / Cargas?</label>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {["Pouca ⬇️", "Na medida ✅", "Pesado ⬆️"].map(peso => (
                                                <button key={peso} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, carga: peso })} className={`py-3 rounded-lg text-[9px] font-bold uppercase transition-all border ${feedbackTreino.carga === peso ? 'bg-blue-600 border-blue-500 text-white shadow-sm scale-[1.02]' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800'}`}>
                                                    {peso.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1.5 pl-1">Observações (Opcional)</label>
                                        <textarea
                                            placeholder="Descreva dores, se aumentou carga ou como se sentiu hoje..."
                                            className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-xs font-medium text-neutral-200 outline-none focus:border-emerald-500/50 h-24 resize-none placeholder-neutral-600 transition-colors"
                                            value={feedbackTreino.comentario}
                                            onChange={e => setFeedbackTreino({ ...feedbackTreino, comentario: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md mt-2 active:scale-95 flex justify-center items-center gap-1.5">
                                        <span className="text-sm">✓</span> Registrar e Enviar
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 📸 NOVO MODAL: CARD DE COMPARTILHAMENTO DO INSTAGRAM */}
                    {modalShareAberto && dadosShare && (
                        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalShareAberto(false)}>
                            <div className="w-full max-w-[320px] bg-gradient-to-br from-neutral-900 to-[#0d0e12] border border-emerald-500/30 rounded-3xl p-6 relative shadow-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalShareAberto(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold z-10 bg-neutral-800 w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-700">✕</button>

                                {/* O "Story" Card que o aluno vai printar/compartilhar */}
                                <div id="instagram-card" className="w-full aspect-[9/16] bg-gradient-to-b from-emerald-900/20 to-[#0d0e12] border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-between p-6 relative overflow-hidden mb-6 shadow-inner">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                                    <div className="absolute -left-8 top-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

                                    <div className="text-center w-full mt-4 z-10">
                                        <p className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1 bg-[#0d0e12] inline-block px-2.5 py-0.5 rounded border border-emerald-500/20">Treino Fit App</p>
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-sm mt-2">TREINO<br />PAGO!</h3>
                                        <p className="text-[11px] font-semibold text-neutral-400 mt-1.5">{dadosShare.data}</p>
                                    </div>

                                    <div className="w-full space-y-3 my-auto z-10">
                                        <div className="bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-4 rounded-xl text-center shadow-sm">
                                            <p className="text-[9px] uppercase text-neutral-400 font-bold mb-1 tracking-wider">Foco de Hoje</p>
                                            <p className="text-base font-bold text-neutral-100 uppercase">{dadosShare.treino}</p>
                                        </div>
                                        <div className="flex gap-2.5">
                                            <div className="flex-1 bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-3 rounded-xl text-center shadow-sm">
                                                <p className="text-[9px] uppercase text-neutral-400 font-bold mb-1 tracking-wider">Intensidade</p>
                                                <p className="text-sm font-bold text-emerald-400 uppercase truncate">{dadosShare.intensidade.split(" ")[0]}</p>
                                            </div>
                                            <div className="flex-1 bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-3 rounded-xl text-center shadow-sm">
                                                <p className="text-[9px] uppercase text-neutral-400 font-bold mb-1 tracking-wider">Carga</p>
                                                <p className="text-sm font-bold text-blue-400 uppercase truncate">{dadosShare.carga.split(" ")[0]}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full text-center mb-1 z-10">
                                        <div className="w-12 h-12 bg-neutral-900 rounded-full mx-auto mb-2 border-2 border-emerald-500 flex items-center justify-center text-xl shadow-sm">
                                            💪
                                        </div>
                                        <p className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider bg-[#0d0e12] inline-block px-2 py-0.5 rounded border border-neutral-800 mb-1">Treinador</p>
                                        <p className="text-xs font-bold text-neutral-200">{dadosShare.nomePersonal}</p>
                                    </div>
                                </div>

                                <button type="button" onClick={async () => {
                                    try {
                                        const cardElement = document.getElementById('instagram-card');
                                        if (!cardElement) return;

                                        const blob = await toBlob(cardElement, {
                                            backgroundColor: '#0d0e12',
                                            pixelRatio: 3
                                        });

                                        if (!blob) return alert("Erro ao gerar imagem.");

                                        const file = new File([blob], 'meu-treino-treino-fit.png', { type: 'image/png' });

                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            await navigator.share({
                                                files: [file],
                                                title: 'Treino Concluído!',
                                                text: `Mais um treino pago! 💪 Treinador: ${dadosShare.nomePersonal}`
                                            });
                                        } else {
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'treino-pago-treinofit.png';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                            alert("Imagem salva na sua galeria! Agora é só postar nos Stories 📸");
                                        }

                                    } catch (err) {
                                        console.error("Erro ao gerar/compartilhar imagem", err);
                                        alert("Erro ao preparar a imagem para o Instagram.");
                                    }
                                }} className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                                    <span className="text-lg">📸</span> Compartilhar no Insta
                                </button>
                            </div>
                        </div>
                    )}

                    {modalAvaliacaoAluno && renderModalAvaliacao(alunoLogado, () => setModalAvaliacaoAluno(false))}

                    {/* ✅ MODAL ONBOARDING DE NOTIFICAÇÃO RENDERIZADO AQUI NO FINAL DO MAIN */}
                    {mostrarOnboardingNotificacao && (
                        <OnboardingNotificacao
                            alunoLogado={alunoLogado}
                            aoConcluir={() => setMostrarOnboardingNotificacao(false)}
                        />
                    )}

                </main>
            </div>
        );
    }

    return <div className="text-neutral-300 text-center p-10 bg-[#0d0e12] min-h-screen font-bold text-lg uppercase tracking-widest flex items-center justify-center">Carregando Plataforma...</div>;
}

export default App;