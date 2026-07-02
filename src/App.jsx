import ControleDeCarga from './Progrecaodecarga';
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

        const preferenciasIA = alimentosFavoritos.length > 0
            ? `Alimentos OBRIGATÓRIOS na dieta: ${alimentosFavoritos.join(", ")}.`
            : "";

        const restricoesFinais = `${perfil.restricoes || ""} ${preferenciasIA}`.trim();

        try {
            // 3. Salva no banco de dados usando a variável garantida (restricoesFinais)
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
                    restricoes: restricoesFinais, // <-- A MÁGICA ACONTECE AQUI
                    lesoes: perfil.lesoes,
                    medidas: {}
                })
            });


            if (response.ok) {
                const saude = calcularSaude(perfil.peso, perfil.altura, perfil.idade);
                // Atualiza o perfil na tela com as restrições preenchidas
                setPerfil(prev => ({ ...prev, restricoes: restricoesFinais, ...saude }));
                setEtapa("home");
            }
        } catch {
            alert("Erro de conexão com o servidor.");
        }
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
                <div className="w-full max-w-md bg-[#16171d] border-2 border-neutral-800 rounded-3xl p-6 relative shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={fecharModal} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-100 font-bold text-lg bg-[#0d0e12] w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-800 transition-colors">✕</button>

                    <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                        <div className="w-12 h-12 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl flex items-center justify-center text-2xl shadow-sm">📊</div>
                        <div>
                            <h3 className="font-bold text-neutral-100 uppercase text-base tracking-tight">Avaliação Física</h3>
                            <p className="text-xs text-blue-400 font-semibold font-mono uppercase mt-1">{alunoData.nome}</p>
                        </div>
                    </div>

                    {/* 🚀 NOVO RADAR DE EVOLUÇÃO VISUAL */}
                    <div className="bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl mb-6 shadow-inner">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                            <span>🚀</span> Radar de Evolução Visual
                        </p>

                        <div className="mb-5">
                            <div className="flex justify-between text-xs uppercase font-bold text-neutral-300 mb-2">
                                <span>Peso Atual: {p}kg</span>
                                <span className="text-emerald-400">{textMeta}</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-4 rounded-full overflow-hidden relative shadow-inner">
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
                                <div className="w-full bg-neutral-800 h-4 rounded-full overflow-hidden relative shadow-inner">
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
                                <div className="bg-[#0d0e12] border-2 border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Peso Bruto</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.peso ? alunoData.peso : '--'} <span className="text-xs text-neutral-500 font-semibold">kg</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border-2 border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Estatura</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.altura ? alunoData.altura : '--'} <span className="text-xs text-neutral-500 font-semibold">m</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border-2 border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Idade</p>
                                    <p className="text-lg font-bold text-neutral-100">{alunoData.idade ? alunoData.idade : '--'} <span className="text-xs text-neutral-500 font-semibold">anos</span></p>
                                </div>
                                <div className="bg-[#0d0e12] border-2 border-neutral-800 p-4 rounded-xl shadow-sm">
                                    <p className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Gênero Bio</p>
                                    <p className="text-base font-bold text-neutral-100 mt-1">{alunoData.genero ? alunoData.genero : '--'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl space-y-4 shadow-sm">
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
                            <div className="mt-6 bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl shadow-sm">
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
                    <div className="w-full max-w-sm bg-[#16171d] border-2 border-neutral-800 p-8 rounded-2xl shadow-xl">
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
                            const payload = { ...perfil, nome: perfil.nome, peso: parseNumeroSeguro(perfil.peso), altura: parseNumeroSeguro(perfil.altura), idade: parseInt(perfil.idade) || 0, whatsapp: novoAlunoForm.whatsapp, objetivo: perfil.meta, meta: perfil.meta, genero: perfil.genero, nivel: perfil.nivel, diasTreino: perfil.diasTreino, restricoes: perfil.restricoes, lesoes: perfil.lesoes, personalRef: refPersonal, medidas: {} };
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
                                <input type="text" placeholder="Ex: Dor no joelho direito, lombar..." className="w-full bg-[#0d0e12] border border-neutral-700 p-3.5 rounded-xl text-sm font-medium outline-none text-neutral-200 focus:border-emerald-500 placeholder-neutral-600 transition-colors" value={perfil.lesoes} onChange={(e) => setPerfil({ ...perfil, lesoes: e.target.value })} />
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
                        <header className="w-full max-w-4xl flex justify-between items-center border-b-2 border-neutral-800 pb-5 mb-8">
                            <div className="flex items-center space-x-4">
                                <img src="/logo192.png" alt="Ícone Treino Fit" className="w-12 h-12 rounded-xl shadow-lg border border-neutral-700" />
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{perfil.nome}</h2>
                                    <p className="text-xs font-black text-neutral-400 font-mono uppercase tracking-widest mt-1">Conta {isVip ? 'Premium Elite' : 'Free Tier'}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => !isVip && setBloqueado(true)} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase font-mono border-2 shadow-lg transition-all ${isVip ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10 animate-pulse hover:bg-amber-500/20'}`}>{isVip ? "✓ Vip Ativado" : "Upgrade Premium"}</button>
                        </header>

                        <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-12">
                            <div className="md:col-span-1 flex flex-col gap-6">
                                <div className="bg-[#16171d] border-2 border-neutral-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-4">Composição Corporal</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#0d0e12] p-4 border border-neutral-700 rounded-2xl shadow-inner">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Massa Global</span>
                                            <span className="text-3xl font-black text-white">{perfil.peso}<span className="text-sm text-neutral-500 font-bold ml-1">kg</span></span>
                                        </div>
                                        <div className="bg-[#0d0e12] p-4 border border-neutral-700 rounded-2xl shadow-inner">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Estatura</span>
                                            <span className="text-3xl font-black text-white">{perfil.altura}<span className="text-sm text-neutral-500 font-bold ml-1">m</span></span>
                                        </div>
                                    </div>
                                    <div className="mt-5 text-xs text-neutral-300 font-black font-mono flex justify-between border-t border-neutral-800 pt-4 bg-neutral-900/30 p-3 rounded-lg">
                                        <span className="uppercase">Planejamento:</span>
                                        <span className="text-emerald-400 uppercase">{perfil.meta}</span>
                                    </div>
                                </div>

                                <div className="bg-[#16171d] border-2 border-neutral-800 p-6 rounded-3xl shadow-xl text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest text-left mb-6">Meta Metabólica Diária</p>
                                    <div className="inline-flex flex-col items-center justify-center p-8 border-4 border-neutral-800 bg-[#0d0e12] rounded-full w-40 h-40 mx-auto mb-2 border-t-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <span className="text-4xl font-black text-white">{perfil.tmb}</span>
                                        <span className="text-xs font-bold font-mono text-neutral-500 uppercase mt-2 tracking-widest">kcal/dia</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-6">
                                <div className="bg-[#16171d] border-2 border-neutral-800 p-7 rounded-3xl shadow-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                                        <span className="text-lg">⚡</span> Diretriz Técnica Operacional
                                    </p>
                                    <p className="text-base font-bold text-white leading-relaxed">
                                        "<span className="text-emerald-300">{perfil.nome}</span>, seus parâmetros atuais indicam que o nosso foco principal deve ser a oxidação de gordura ativa. A Inteligência Artificial já está priorizando a ingestão de proteínas no seu cálculo."
                                    </p>
                                </div>

                                <div className="bg-[#16171d] border-2 border-neutral-800 p-7 rounded-3xl shadow-xl flex flex-col justify-between">
                                    <div>
                                        <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-5 border-b border-neutral-800 pb-3">Terminais de Execução</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                            <button type="button" onClick={() => setAbaAtiva("chat")} className="bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-6 px-4 rounded-2xl text-sm uppercase tracking-wider text-center transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] active:scale-95 flex flex-col items-center justify-center gap-2">
                                                <span className="text-3xl">🤖</span>
                                                Chat IA & Consultoria
                                            </button>
                                            <button type="button" onClick={() => setAbaAtiva("treino")} className="bg-[#0d0e12] hover:bg-neutral-800 border-2 border-neutral-700 text-white font-black py-6 px-4 rounded-2xl text-sm uppercase tracking-wider text-center transition-all shadow-lg active:scale-95 flex flex-col items-center justify-center gap-2">
                                                <span className="text-3xl">🏋️‍♂️</span>
                                                Biblioteca de Treinos
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center pt-5 border-t-2 border-neutral-800 mt-auto">
                                        <button type="button" onClick={handleSair} className="text-xs font-black font-mono uppercase text-neutral-500 hover:text-red-500 transition-colors bg-neutral-900/50 px-4 py-2 rounded-lg">Encerrar sessão no dispositivo</button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-[#16171d] to-emerald-900/20 border-2 border-emerald-500/30 p-7 rounded-3xl shadow-[0_15px_40px_rgba(16,185,129,0.1)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -bottom-10 text-[120px] opacity-5">🛒</div>
                                    <div className="z-10 text-center sm:text-left">
                                        <p className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-2 drop-shadow-md flex items-center justify-center sm:justify-start gap-2">
                                            🛒 Mercado Saudável Oficial
                                        </p>
                                        <p className="text-sm font-bold text-neutral-200 leading-relaxed max-w-sm">A IA montou sua dieta? Peça os ingredientes agora mesmo e receba no conforto de casa sem sair do foco.</p>
                                    </div>
                                    <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="z-10 whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4.5 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(16,185,129,0.4)] active:scale-95 text-center w-full sm:w-auto">
                                        👉 Fazer Pedido Online
                                    </a>
                                </div>
                            </div>
                        </main>
                    </div>
                )}
                {abaAtiva === "chat" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <header className="p-5 flex items-center justify-between border-b-2 border-neutral-800 bg-[#16171d] shadow-md z-20">
                            <button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-400 hover:text-white font-black text-sm uppercase font-mono flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800 transition-colors">
                                ← Voltar ao Início
                            </button>
                            <span className="text-xs font-black font-mono uppercase text-neutral-400 bg-[#0d0e12] px-3 py-1.5 rounded-lg border border-neutral-800 hidden sm:block">
                                Módulo Nutrição IA
                            </span>
                        </header>
                        <ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} setTreinoIAPescado={setTreinoIAPescado} aoAtualizarPerfil={atualizarStatusVIP} />
                    </div>
                )}
                {abaAtiva === "treino" && (
                    <div className="flex-1 flex flex-col bg-[#0d0e12] p-4 md:p-8 overflow-y-auto custom-scrollbar">
                        <header className="w-full max-w-5xl mx-auto flex justify-between items-center border-b-2 border-neutral-800 pb-6 mb-8">
                            <button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-400 hover:text-white font-black text-sm uppercase font-mono flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800 transition-colors">
                                ← Retornar
                            </button>
                            <span className="text-white font-black uppercase text-base tracking-widest">Planilhas de Treino</span>
                        </header>

                        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto">
                            <button type="button" onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="bg-gradient-to-br from-[#16171d] to-emerald-900/10 border-2 border-neutral-700 hover:border-emerald-500 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start justify-between transition-all text-center sm:text-left group shadow-xl">
                                <div className="order-2 sm:order-1 mt-4 sm:mt-0">
                                    <p className="font-black uppercase text-xl text-white mb-2 group-hover:text-emerald-400 transition-colors">Treino Inteligência Artificial</p>
                                    <p className={`text-xs font-black font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block border ${!isVip ? 'bg-neutral-900 text-neutral-500 border-neutral-800' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                        {!isVip ? "Status: Bloqueado" : "Acesso Elite Ativado"}
                                    </p>
                                    <p className="text-sm font-bold text-neutral-400 mt-4 leading-relaxed hidden sm:block max-w-[280px]">O seu personal virtual monta o treino exato para a sua biometria e ajusta a carga ideal.</p>
                                </div>
                                <span className="text-6xl order-1 sm:order-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">🤖</span>
                            </button>

                            <button type="button" onClick={() => setModalidadeAberta('academia')} className="bg-[#16171d] hover:bg-neutral-800 border-2 border-neutral-700 hover:border-blue-500 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start justify-between transition-all text-center sm:text-left group shadow-xl">
                                <div className="order-2 sm:order-1 mt-4 sm:mt-0">
                                    <p className="font-black uppercase text-xl text-white mb-2 group-hover:text-blue-400 transition-colors">Metodologia Tradicional (ABC)</p>
                                    <p className="text-xs text-blue-400 font-black font-mono uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg inline-block border border-blue-500/30">
                                        Acesso Livre Free
                                    </p>
                                    <p className="text-sm font-bold text-neutral-400 mt-4 leading-relaxed hidden sm:block max-w-[280px]">Biblioteca clássica com separação padrão de grupamentos musculares da academia.</p>
                                </div>
                                <span className="text-6xl order-1 sm:order-2 drop-shadow-lg group-hover:scale-110 transition-transform">🏋️‍♂️</span>
                            </button>
                        </div>

                        {modalidadeAberta && <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />}
                    </div>
                )}
                {bloqueado && <div className="fixed inset-0 z-[500] bg-[#0d0e12]/95 backdrop-blur-md flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar"><button type="button" onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-neutral-900 border-2 border-neutral-800 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-colors z-[510] shadow-lg">✕</button><TelaPlanos /></div>}
            </div>
        );
    }

    if (etapa === "personal") {
        const hojeDataStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-4 md:p-8 overflow-y-auto font-sans z-40 custom-scrollbar">
                <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-end border-b-2 border-neutral-800 pb-6 mb-8 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                        <img src="/logo192.png" alt="Ícone Treino Fit" className="w-14 h-14 rounded-xl shadow-lg border border-neutral-700" />
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{personalLogado?.nome}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                <span className="text-xs text-neutral-400 font-bold font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">{personalLogado?.cref}</span>
                                <span className={`text-[10px] font-black font-mono uppercase tracking-widest px-2 py-1 rounded border ${personalLogado?.assinaturaAtiva ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                    {personalLogado?.assinaturaAtiva ? "Licença PRO Ativa" : "Modo Teste Grátis"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleSair} className="px-6 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl hover:bg-neutral-800 text-xs text-neutral-300 font-black uppercase transition-colors shadow-md w-full sm:w-auto">Encerrar Sessão</button>
                </header>

                <main className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pb-12">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-[#16171d] border-2 border-neutral-800 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-6 border-b border-neutral-800 pb-3">Resumo da Assessoria</h3>
                            <div className="grid grid-cols-2 gap-3 text-center mb-6">
                                <div className="p-4 bg-[#0d0e12] border border-neutral-800 rounded-2xl flex flex-col justify-center shadow-inner">
                                    <p className="text-3xl font-black text-white">{alunosPersonal.length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-2">Alunos</p>
                                </div>
                                <div className="p-4 bg-[#0d0e12] border border-amber-900/30 rounded-2xl flex flex-col justify-center shadow-inner">
                                    <p className="text-3xl font-black text-amber-500">{alunosPersonal.filter(a => a.statusTreino === "Rascunho IA").length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mt-2">Alertas IA</p>
                                </div>
                                <div className="p-4 bg-[#0d0e12] border border-red-900/30 rounded-2xl flex flex-col justify-center shadow-inner">
                                    <p className="text-3xl font-black text-red-500">{alunosPersonal.filter(a => calcularDiasSemTreino(a.checkins) >= 5 && a.statusConta !== 'Off').length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70 mt-2">Em Risco</p>
                                </div>
                                <div className="p-4 bg-[#0d0e12] border border-neutral-800 rounded-2xl flex flex-col justify-center shadow-inner">
                                    <p className="text-3xl font-black text-neutral-500">{alunosPersonal.filter(a => a.statusConta === "Off").length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mt-2">Inativos</p>
                                </div>
                            </div>
                            {!personalLogado?.assinaturaAtiva && (
                                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-4 rounded-xl text-center">
                                    <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">Modo Teste Ativo</p>
                                    <p className="text-xl font-black text-white mt-1">{alunosPersonal.length} <span className="text-sm text-neutral-400">/ 2 Alunos</span></p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-[#16171d] to-emerald-900/10 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 p-4 opacity-5 text-8xl transform rotate-12">🛒</div>
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 border-b border-emerald-500/20 pb-2 inline-block">🤝 Parceiro Oficial</p>
                            <h4 className="text-lg font-black text-white mb-2 mt-2">Hortilife Praticidade</h4>
                            <p className="text-sm font-bold text-neutral-300 mb-6 leading-relaxed">Aumente a adesão dos seus alunos recomendando nosso parceiro. Eles compram a dieta no app e recebem em casa.</p>
                            <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="block w-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 text-white text-center font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                                👉 Ver Catálogo
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-[#16171d] border-2 border-neutral-800 rounded-3xl p-5 md:p-8 shadow-xl overflow-hidden flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b-2 border-neutral-800 pb-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Carteira de Clientes</h3>
                            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                                <button type="button" onClick={carregarAlunosAssessoria} className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black px-5 py-3.5 rounded-xl transition-colors uppercase flex-1 sm:flex-none text-center shadow-md border border-neutral-600 flex items-center justify-center gap-2">
                                    <span>🔄</span> Atualizar
                                </button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    const link = `${window.location.origin}?ref=${personalLogado?._id}`;
                                    navigator.clipboard.writeText(link);
                                    alert(`🔗 Link copiado com sucesso!\n\nEnvie este link no WhatsApp do seu aluno:\n\n${link}`);
                                }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-5 py-3.5 rounded-xl transition-colors uppercase flex-1 sm:flex-none text-center shadow-[0_5px_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2">
                                    <span>🔗</span> Copiar Link
                                </button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    setModalNovoAluno(true);
                                }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-5 py-3.5 rounded-xl transition-colors uppercase w-full sm:w-auto text-center shadow-[0_5px_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 mt-2 sm:mt-0">
                                    <span>+</span> Novo Aluno
                                </button>
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b-2 border-neutral-800 text-[11px] uppercase text-neutral-500 tracking-widest bg-[#0d0e12]">
                                        <th className="p-4 font-black rounded-tl-xl w-[25%]">Aluno & Contato</th>
                                        <th className="p-4 font-black w-[15%]">Objetivo</th>
                                        <th className="p-4 font-black w-[15%] text-center">Status Ficha</th>
                                        <th className="p-4 font-black w-[15%] text-center">Último Treino</th>
                                        <th className="p-4 font-black w-[15%] text-center">Retenção</th>
                                        <th className="p-4 font-black text-right rounded-tr-xl w-[15%]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold divide-y-2 divide-neutral-800/50">
                                    {alunosPersonal.map((aluno) => {
                                        const idUnico = aluno.id || aluno._id;
                                        const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);

                                        const diasSemTreino = calcularDiasSemTreino(aluno.checkins);
                                        let corFarol = "bg-neutral-800 text-neutral-400 border-neutral-700";
                                        let iconeFarol = "⚪";
                                        let textoFarol = "Novo";

                                        if (diasSemTreino !== Infinity) {
                                            if (diasSemTreino < 3) {
                                                corFarol = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                                                iconeFarol = "🟢";
                                                textoFarol = "Ativo";
                                            } else if (diasSemTreino >= 3 && diasSemTreino < 5) {
                                                corFarol = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                                                iconeFarol = "🟡";
                                                textoFarol = "Atenção";
                                            } else {
                                                corFarol = "bg-red-500/10 text-red-400 border-red-500/30";
                                                iconeFarol = "🔴";
                                                textoFarol = "Risco";
                                            }
                                        }

                                        return (
                                            <tr key={idUnico} className={`hover:bg-neutral-800/30 transition-colors ${aluno.statusConta === 'Off' ? 'opacity-40 grayscale-[50%]' : ''}`}>
                                                <td className="p-4">
                                                    <div className="font-black text-white text-base cursor-pointer hover:text-emerald-400 transition-colors flex items-center gap-2 truncate max-w-[200px]" onClick={() => setAlunoVerFeedback(aluno)}>
                                                        {aluno.nome} <span className="text-xs opacity-50 bg-neutral-800 px-1.5 py-0.5 rounded text-white">ℹ️</span>
                                                    </div>
                                                    <div className="text-xs text-neutral-400 font-bold font-mono mt-1.5">{aluno.whatsapp}</div>
                                                </td>
                                                <td className="p-4 text-neutral-300 font-bold text-sm">{aluno.objetivo}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black font-mono uppercase inline-block border ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-neutral-900 text-neutral-400 border-neutral-700'}`}>
                                                        {aluno.statusTreino}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {checkinDeHoje ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-pulse hover:bg-emerald-500/20 transition-colors cursor-pointer w-full shadow-inner">
                                                            🔥 HOJE!
                                                        </button>
                                                    ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[11px] font-bold font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 w-full hover:border-neutral-600">
                                                            {aluno.checkins[0].data}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-neutral-600 font-bold font-mono block w-full text-center">--/--</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border flex items-center gap-1.5 shadow-inner ${corFarol}`}>
                                                            {iconeFarol} {textoFarol}
                                                        </span>
                                                        {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                            <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="text-[#25D366] hover:scale-110 transition-transform bg-[#25D366]/10 p-1.5 rounded-lg border border-[#25D366]/30 shadow-sm" title="Chamar no WhatsApp">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col gap-2 w-[120px] ml-auto">
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-2 rounded-lg transition-colors uppercase shadow-sm">
                                                                {aluno.statusTreino === "Rascunho IA" ? "Ver IA" : "Treino"}
                                                            </button>
                                                            <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-black py-2 rounded-lg transition-colors uppercase">
                                                                Perfil
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
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
                                                            }} className="flex-1 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-600/50 text-[10px] font-black py-2 rounded-lg transition-colors uppercase">
                                                                Editar
                                                            </button>
                                                            <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className={`flex-1 border text-[10px] font-black py-2 rounded-lg transition-colors uppercase ${aluno.statusConta === 'Ativo' ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white'}`}>
                                                                {aluno.statusConta === "Ativo" ? "Off" : "On"}
                                                            </button>
                                                            <button type="button" onClick={() => deletarAluno(idUnico)} className="w-8 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg font-black text-xs transition-colors flex items-center justify-center">
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
                                <div className="text-center py-16 bg-[#0d0e12] rounded-b-xl">
                                    <p className="text-sm font-black text-neutral-500 uppercase">Sua carteira de alunos está vazia.</p>
                                    <p className="text-xs font-bold text-neutral-600 mt-2">Clique em "+ Novo Aluno" ou envie seu Link IA para começar.</p>
                                </div>
                            )}
                        </div>

                        <div className="md:hidden flex flex-col space-y-6">
                            {alunosPersonal.map((aluno) => {
                                const idUnico = aluno.id || aluno._id;
                                const checkinDeHoje = aluno.checkins?.find(c => c.data === hojeDataStr);

                                const diasSemTreino = calcularDiasSemTreino(aluno.checkins);
                                let corFarol = "bg-neutral-800 text-neutral-400 border-neutral-700";
                                let iconeFarol = "⚪";
                                let textoFarol = "Novo";

                                if (diasSemTreino !== Infinity) {
                                    if (diasSemTreino < 3) {
                                        corFarol = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                                        iconeFarol = "🟢";
                                        textoFarol = "Ativo";
                                    } else if (diasSemTreino >= 3 && diasSemTreino < 5) {
                                        corFarol = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                                        iconeFarol = "🟡";
                                        textoFarol = "Atenção";
                                    } else {
                                        corFarol = "bg-red-500/10 text-red-400 border-red-500/30";
                                        iconeFarol = "🔴";
                                        textoFarol = "Risco";
                                    }
                                }

                                return (
                                    <div key={idUnico} className={`bg-[#0d0e12] border-2 border-neutral-800 p-6 rounded-3xl flex flex-col space-y-5 shadow-lg ${aluno.statusConta === 'Off' ? 'opacity-50 grayscale-[50%]' : ''}`}>
                                        <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
                                            <div className="flex-1 pr-4">
                                                <p className="font-black text-white text-lg cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-2" onClick={() => setAlunoVerFeedback(aluno)}>
                                                    {aluno.nome} <span className="text-xs opacity-60 bg-neutral-800 px-2 py-1 rounded text-white shadow-inner">ℹ️</span>
                                                </p>
                                                <p className="text-sm text-neutral-400 font-bold font-mono mt-1.5">{aluno.whatsapp}</p>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black font-mono uppercase text-center shadow-inner border ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-neutral-800 text-neutral-300 border-neutral-700'}`}>
                                                {aluno.statusTreino}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#16171d] p-4 rounded-2xl border border-neutral-800/50 shadow-inner">
                                                <p className="text-[10px] uppercase text-neutral-500 font-black mb-1">Objetivo Base</p>
                                                <p className="text-sm font-black text-white truncate">{aluno.objetivo}</p>
                                            </div>
                                            <div className="bg-[#16171d] p-4 rounded-2xl border border-neutral-800/50 shadow-inner flex flex-col justify-center">
                                                <p className="text-[10px] uppercase text-neutral-500 font-black mb-1.5">Último Treino</p>
                                                {checkinDeHoje ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md animate-pulse cursor-pointer w-full shadow-sm">
                                                        🔥 HOJE!
                                                    </button>
                                                ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-xs font-black font-mono text-neutral-300 cursor-pointer hover:text-white bg-neutral-900 border border-neutral-800 py-1.5 rounded-lg w-full">
                                                        {aluno.checkins[0].data}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-neutral-500 font-black font-mono block w-full text-center">--/--</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#16171d] p-4 rounded-2xl border border-neutral-800/50 mt-1 flex justify-between items-center shadow-inner">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase border flex items-center gap-2 shadow-sm ${corFarol}`}>
                                                    {iconeFarol} {textoFarol}
                                                </span>
                                            </div>
                                            {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-4 py-2 rounded-lg text-xs font-black uppercase transition-all hover:bg-[#25D366]/20 shadow-sm">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                    WhatsApp
                                                </button>
                                            )}
                                        </div>

                                        <div className="pt-2 grid grid-cols-2 gap-3 border-t border-neutral-800 mt-2">
                                            <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-4 rounded-xl transition-colors uppercase shadow-[0_5px_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
                                                <span>{aluno.statusTreino === "Rascunho IA" ? "🤖" : "📝"}</span> {aluno.statusTreino === "Rascunho IA" ? "Revisar Plano IA" : "Editar Treino Atual"}
                                            </button>

                                            <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border-2 border-blue-500/30 text-[11px] font-black py-3.5 rounded-xl transition-colors uppercase flex items-center justify-center gap-1.5 shadow-sm">
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
                                            }} className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border-2 border-neutral-700 text-[11px] font-black py-3.5 rounded-xl transition-colors uppercase flex items-center justify-center gap-1.5 shadow-sm">
                                                ✏️ Dados / Perfil
                                            </button>

                                            <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className={`border-2 text-[11px] font-black py-3 rounded-xl transition-colors uppercase shadow-sm ${aluno.statusConta === 'Ativo' ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white'}`}>
                                                {aluno.statusConta === "Ativo" ? "⏸️ Pausar Conta" : "▶️ Ativar Conta"}
                                            </button>

                                            <button type="button" onClick={() => deletarAluno(idUnico)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-2 border-red-500/20 rounded-xl font-black text-[11px] py-3 uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm">
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
                {/* MODAL PRESCREVER TREINO MANUAL OU VIA IA */}
                {alunoEmEdicao && (
                    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-3xl bg-[#16171d] border-2 border-neutral-800 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh] h-full sm:h-auto">
                            <header className="p-6 md:p-8 border-b-2 border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-[#1c1d26] to-[#16171d] gap-4 sm:gap-0">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-black uppercase tracking-widest mb-2 shadow-inner">⚡ Prescrevendo Plano Pro</span>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">{alunoEmEdicao.nome}</h3>
                                </div>
                                <button type="button" onClick={() => setAlunoEmEdicao(null)} className="text-neutral-400 hover:text-white text-xs uppercase font-mono font-black border-2 border-neutral-700 hover:bg-neutral-800 px-4 py-2.5 rounded-xl transition-all shadow-sm">Fechar ✕</button>
                            </header>

                            {/* 🔥 BOTÃO MÁGICO: GERADOR AUTOMÁTICO BASEADO NA BIOMETRIA RECENTE 🔥 */}
                            <div className="px-6 md:px-8 pt-4 bg-[#16171d]">
                                <button
                                    type="button"
                                    disabled={isRecalculando}
                                    onClick={async () => {
                                        setIsRecalculando(true);
                                        const alunoId = alunoEmEdicao.id || alunoEmEdicao._id;
                                        try {
                                            const response = await fetch(`${API_URL}/aluno/${alunoId}/gerar-plano-ia-personal`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" }
                                            });
                                            if (response.ok) {
                                                const dadosGerados = await response.json();
                                                // Preenche o formulário na tela instantaneamente com o que a IA calculou
                                                if (dadosGerados.treinoSemanal) setTreinoForm(dadosGerados.treinoSemanal);
                                                if (dadosGerados.dietaPrescrita) setDietaForm(dadosGerados.dietaPrescrita);
                                                if (dadosGerados.metaAgua) setAguaForm(dadosGerados.metaAgua);
                                                alert("✨ IA releu a nova biometria, recalculou a água, dieta e macros, e montou a estrutura com sucesso! Revise e clique em 'Salvar e Enviar'.");
                                            } else {
                                                alert("Erro ao acionar a IA do servidor. Verifique o Back-end.");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert("Erro de conexão ao tentar gerar com IA.");
                                        } finally {
                                            setIsRecalculando(false);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border-2 ${isRecalculando
                                        ? 'bg-purple-900/40 border-purple-500/30 text-purple-400 animate-pulse cursor-not-allowed'
                                        : 'bg-purple-600/10 border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white shadow-[0_0_20px_rgba(147,51,234,0.1)] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]'
                                        }`}
                                >
                                    <span>{isRecalculando ? "🧠 Inteligência Computando..." : "✨ Gerar Todo o Plano Automatizado com IA"}</span>
                                </button>
                            </div>

                            <form onSubmit={salvarTreinoPersonal} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

                                <div className="bg-gradient-to-br from-[#0d0e12] to-blue-900/10 p-6 rounded-3xl border-2 border-blue-500/30 shadow-inner relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 text-7xl opacity-10">💧</div>
                                    <label className="text-sm uppercase font-black tracking-wider text-blue-400 block mb-4 flex items-center gap-2">
                                        <span className="text-xl">🚰</span> Meta de Hidratação Diária
                                    </label>
                                    <input required type="text" className="w-full bg-[#16171d] border-2 border-neutral-800 p-4 rounded-xl text-lg text-white font-black outline-none focus:border-blue-400 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all placeholder-neutral-600" value={aguaForm} onChange={(e) => setAguaForm(e.target.value)} placeholder="Ex: 3.5 Litros" />
                                </div>

                                <div>
                                    <p className="text-sm font-black uppercase tracking-wider text-neutral-300 mb-4 border-b border-neutral-800/60 pb-2">Estrutura de Exercícios Semanal</p>

                                    <div className="flex gap-2 overflow-x-auto pb-3 border-b border-neutral-800/40 mb-5 scrollbar-none">
                                        {DIAS_SEMANA.map(dia => (
                                            <button
                                                key={dia}
                                                type="button"
                                                onClick={() => setDiaAbaPersonal(dia)}
                                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex-shrink-0 border-2 ${diaAbaPersonal === dia
                                                    ? 'bg-neutral-800/50 border-emerald-500 text-emerald-400 shadow-lg'
                                                    : 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                                                    }`}
                                            >
                                                {dia}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-xs font-mono text-emerald-400 font-black uppercase">Treino de {diaAbaPersonal}</p>
                                        <button type="button" onClick={adicionarExercicioForm} className="bg-emerald-600/10 text-emerald-400 border-2 border-emerald-500/30 text-xs font-black px-4 py-2 rounded-xl hover:bg-emerald-600/20 transition-all uppercase shadow-sm">+ Exercício</button>
                                    </div>

                                    <div className="space-y-4">
                                        {(() => {
                                            const diaObj = treinoForm.find(d => d.dia === diaAbaPersonal) || { exercicios: [] };
                                            if (diaObj.exercicios.length === 0) {
                                                return <p className="text-sm text-neutral-400 font-bold uppercase italic text-center py-6 bg-[#0d0e12] rounded-2xl border-2 border-neutral-800">Nenhum exercício cadastrado para {diaAbaPersonal}.</p>;
                                            }

                                            return diaObj.exercicios.map((ex, idx) => (
                                                <div key={idx} className="bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl space-y-4 relative group shadow-sm">
                                                    <button type="button" onClick={() => removerExercicioForm(idx)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 text-[10px] uppercase font-mono font-black tracking-wider transition-colors bg-[#16171d] px-2 py-1 rounded border border-neutral-800">Remover</button>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 sm:pt-0">
                                                        <div className="sm:col-span-1"><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Movimento</label><input required type="text" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-emerald-500/50" value={ex.nome || ""} onChange={(e) => handleExercicioChange(idx, "nome", e.target.value)} /></div>
                                                        <div><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Séries</label><input required type="number" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-emerald-500/50" value={ex.series || 0} onChange={(e) => handleExercicioChange(idx, "series", Number(e.target.value))} /></div>
                                                        <div><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Repetições/Tempo</label><input required type="text" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-emerald-500/50" value={ex.reps || ""} onChange={(e) => handleExercicioChange(idx, "reps", e.target.value)} /></div>
                                                    </div>
                                                    <div><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Observação</label><input type="text" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-emerald-500/50 placeholder-neutral-600" value={ex.obs || ""} onChange={(e) => handleExercicioChange(idx, "obs", e.target.value)} /></div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-neutral-800/60">
                                    <div className="flex justify-between items-center pb-3 border-b border-neutral-800/60 mb-4"><p className="text-sm font-black uppercase tracking-wider text-neutral-300">Planejamento Nutricional</p><button type="button" onClick={adicionarDietaForm} className="bg-blue-600/10 text-blue-400 border-2 border-blue-500/30 text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-600/20 transition-all uppercase shadow-sm">+ Refeição</button></div>
                                    <div className="space-y-4">
                                        {dietaForm.map((ref, idx) => (
                                            <div key={idx} className="bg-[#0d0e12] border-2 border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 relative sm:items-center shadow-sm">
                                                <div className="w-full sm:w-1/3"><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Horário/Refeição</label><input required type="text" placeholder="Ex: Almoço" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-blue-500/50 placeholder-neutral-600" value={ref.refeicao || ""} onChange={(e) => handleDietaChange(idx, "refeicao", e.target.value)} /></div>
                                                <div className="w-full sm:w-2/3 pr-8"><label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Alimentos e Gramas</label><input required type="text" placeholder="Ex: 100g Frango" className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-blue-500/50 placeholder-neutral-600" value={ref.itens || ""} onChange={(e) => handleDietaChange(idx, "itens", e.target.value)} /></div>
                                                <button type="button" onClick={() => removerDietaForm(idx)} className="absolute top-4 right-4 sm:top-auto sm:bottom-4 text-neutral-500 hover:text-red-400 font-black text-lg bg-[#16171d] w-8 h-8 rounded-lg border border-neutral-800 flex items-center justify-center transition-colors">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <footer className="pt-6 border-t border-neutral-800 flex gap-4 justify-end text-sm font-black"><button type="button" onClick={() => setAlunoEmEdicao(null)} className="bg-transparent border-2 border-neutral-800 text-neutral-300 p-4 rounded-xl uppercase tracking-wider hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-[0_10px_20px_rgba(16,185,129,0.2)] px-8">Salvar e Enviar para Aluno</button></footer>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DE EDIÇÃO DE PERFIL DO ALUNO */}
                {alunoEditandoPerfil && (
                    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-[#16171d] border-2 border-neutral-800 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] overflow-hidden">
                            <header className="p-6 border-b-2 border-neutral-800 flex justify-between items-center bg-gradient-to-r from-[#1c1d26] to-[#16171d]">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Editar Ficha do Aluno</h3>
                                    <p className="text-xs text-emerald-400 font-bold font-mono mt-1">{alunoEditandoPerfil.nome}</p>
                                </div>
                                <button type="button" onClick={() => setAlunoEditandoPerfil(null)} className="text-neutral-400 hover:text-white text-xs font-black uppercase bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-xl transition-colors shadow-sm">✕ Fechar</button>
                            </header>
                            <form onSubmit={atualizarBiometriaAluno} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Peso (kg)</label>
                                        <input required type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors text-center" value={alunoEditandoPerfil.peso} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, peso: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Altura (m)</label>
                                        <input required type="text" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors text-center" value={alunoEditandoPerfil.altura} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, altura: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Idade</label>
                                        <input required type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors text-center" value={alunoEditandoPerfil.idade} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, idade: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Gênero</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.genero} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, genero: e.target.value })}>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Objetivo Base</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.objetivo} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, objetivo: e.target.value })}>
                                            <option value="Emagrecimento">Emagrecimento</option>
                                            <option value="Hipertrofia">Hipertrofia</option>
                                            <option value="Performance">Performance</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Nível de Treino</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.nivel} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, nivel: e.target.value })}>
                                            <option value="Iniciante">Iniciante</option>
                                            <option value="Intermediário">Intermediário</option>
                                            <option value="Avançado">Avançado</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Dias de Treino</label>
                                        <select className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.diasTreino} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, diasTreino: e.target.value })}>
                                            <option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
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

                                {/* 🔥 BLOCO DE MEDIDAS E NOVA AVALIAÇÃO DE DOBRAS 🔥 */}
                                <div className="pt-6 border-t-2 border-neutral-800 mt-6 mb-2">
                                    <div className="flex justify-between items-center mb-5">
                                        <p className="text-sm font-black uppercase tracking-wider text-emerald-400">📏 Perímetros (cm)</p>
                                        <button type="button" onClick={() => setModalDobrasAberto(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-colors uppercase shadow-sm flex items-center gap-1.5">
                                            <span>✚</span> Protocolo 7 Dobras
                                        </button>
                                    </div>

                                    {alunoEditandoPerfil.medidas?.percentualGordura && (
                                        <div className="mb-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl p-4 flex justify-between items-center shadow-inner">
                                            <span className="text-xs font-black uppercase text-emerald-400">Percentual de Gordura Atual:</span>
                                            <span className="text-xl font-black text-white">{alunoEditandoPerfil.medidas.percentualGordura}%</span>
                                        </div>
                                    )}

                                    {/* Tronco */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Pescoço</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.pescoco || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), pescoco: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Tórax</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.torax || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), torax: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Cintura</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.cintura || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), cintura: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Abdômen</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.abdomen || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), abdomen: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Quadril</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.quadril || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), quadril: e.target.value } })} />
                                        </div>
                                    </div>

                                    {/* Membros Superiores */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Braço Dir.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.bracoDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), bracoDir: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Braço Esq.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.bracoEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), bracoEsq: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Antebraço Dir.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.antebracoDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), antebracoDir: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Antebraço Esq.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.antebracoEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), antebracoEsq: e.target.value } })} />
                                        </div>
                                    </div>

                                    {/* Membros Inferiores */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Coxa Dir.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.coxaDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), coxaDir: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Coxa Esq.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.coxaEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), coxaEsq: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Panturrilha Dir.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.panturrilhaDir || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), panturrilhaDir: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 ml-1">Panturrilha Esq.</label>
                                            <input type="number" step="0.1" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3.5 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" value={alunoEditandoPerfil.medidas?.panturrilhaEsq || ""} onChange={e => setAlunoEditandoPerfil({ ...alunoEditandoPerfil, medidas: { ...(alunoEditandoPerfil.medidas || {}), panturrilhaEsq: e.target.value } })} />
                                        </div>
                                    </div>
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

                {/* MODAL DETALHES DO FEEDBACK (RPE E RESPOSTAS) */}
                {alunoVerFeedback && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAlunoVerFeedback(null)}>
                        <div className="w-full max-w-sm bg-[#16171d] border-2 border-neutral-800 rounded-3xl p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setAlunoVerFeedback(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-white font-black bg-neutral-800 w-8 h-8 rounded-lg flex items-center justify-center">✕</button>

                            <div className="flex items-center gap-4 mb-6 border-b border-neutral-800 pb-5">
                                <div className="w-12 h-12 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl flex items-center justify-center text-2xl">📋</div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-base tracking-tight">Relatório de Treino</h3>
                                    <p className="text-xs text-emerald-400 font-bold font-mono uppercase mt-1">{alunoVerFeedback.nome}</p>
                                </div>
                            </div>

                            {alunoVerFeedback.checkins && alunoVerFeedback.checkins.length > 0 ? (
                                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {alunoVerFeedback.checkins.slice(0, 3).map((checkin, index) => (
                                        <div key={index} className="bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl shadow-inner">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm font-black text-white uppercase">{checkin.data} - {checkin.diaSemana}</span>
                                                {index === 0 && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-1 rounded uppercase">Último</span>}
                                            </div>

                                            {checkin.feedback ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-[#16171d] p-3 rounded-xl border border-neutral-800/50">
                                                            <p className="text-[10px] text-neutral-400 font-black uppercase mb-1.5">Intensidade</p>
                                                            <p className="text-sm font-bold text-white">{checkin.feedback.intensidade}</p>
                                                        </div>
                                                        <div className="bg-[#16171d] p-3 rounded-xl border border-neutral-800/50">
                                                            <p className="text-[10px] text-neutral-400 font-black uppercase mb-1.5">Carga</p>
                                                            <p className="text-sm font-bold text-white">{checkin.feedback.carga}</p>
                                                        </div>
                                                    </div>
                                                    {checkin.feedback.comentario && (
                                                        <div className="bg-[#16171d] p-4 rounded-xl border border-neutral-800/50">
                                                            <p className="text-[10px] text-neutral-400 font-black uppercase mb-1.5">Observações do Aluno</p>
                                                            <p className="text-sm font-bold text-neutral-200 italic">"{checkin.feedback.comentario}"</p>
                                                        </div>
                                                    )}

                                                    {/* CAIXA DE RESPOSTA DO PERSONAL */}
                                                    {checkin.respostaPersonal ? (
                                                        <div className="bg-emerald-900/20 p-4 rounded-xl border-l-4 border-emerald-500 mt-4">
                                                            <p className="text-[10px] text-emerald-400 font-black uppercase mb-1.5">Sua Resposta</p>
                                                            <p className="text-sm font-bold text-neutral-200 italic">"{checkin.respostaPersonal}"</p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-800 pt-4">
                                                            <input type="text" placeholder="Responder feedback..." className="w-full bg-[#16171d] border-2 border-neutral-800 p-3 rounded-xl text-sm font-bold outline-none text-white focus:border-neutral-600 placeholder-neutral-500"
                                                                value={respostasFeedback[checkin.data] || ""}
                                                                onChange={e => setRespostasFeedback({ ...respostasFeedback, [checkin.data]: e.target.value })}
                                                            />
                                                            <button type="button" onClick={() => enviarRespostaFeedback(alunoVerFeedback.id || alunoVerFeedback._id, checkin.data)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black p-3 rounded-xl text-xs uppercase transition-colors shadow-md">Responder Aluno</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-neutral-400 font-bold italic">Check-in simples (Sem feedback detalhado).</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-[#0d0e12] rounded-2xl border-2 border-neutral-800">
                                    <p className="text-sm text-neutral-400 uppercase font-black">Nenhum treino registrado ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CALCULADORA DE DOBRAS (ANTROPOMETRIA) */}
                {modalDobrasAberto && (
                    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-[#16171d] border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl relative">
                            <button onClick={() => setModalDobrasAberto(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-black bg-[#0d0e12] border border-neutral-700 w-8 h-8 rounded-lg flex items-center justify-center transition-colors">✕</button>

                            <div className="flex items-center gap-4 mb-6 border-b-2 border-neutral-800 pb-4">
                                <div className="w-12 h-12 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl flex items-center justify-center text-2xl shadow-inner">📏</div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-base tracking-tight">Avaliação Antropométrica</h3>
                                    <p className="text-[10px] font-bold text-blue-400 font-mono uppercase tracking-widest mt-1">Protocolo 7 Dobras</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Tríceps (mm)</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.triceps} onChange={e => setDobrasForm({ ...dobrasForm, triceps: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Tórax (mm)</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.torax} onChange={e => setDobrasForm({ ...dobrasForm, torax: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Subescapular</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.subescapular} onChange={e => setDobrasForm({ ...dobrasForm, subescapular: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Axilar Média</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.axilar} onChange={e => setDobrasForm({ ...dobrasForm, axilar: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Suprailíaca</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.iliaca} onChange={e => setDobrasForm({ ...dobrasForm, iliaca: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Abdominal</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.abdominal} onChange={e => setDobrasForm({ ...dobrasForm, abdominal: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-neutral-400 block ml-1">Coxa (mm)</label><input type="number" className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/70 transition-colors text-center" value={dobrasForm.coxa} onChange={e => setDobrasForm({ ...dobrasForm, coxa: e.target.value })} /></div>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setModalDobrasAberto(false)} className="w-1/3 bg-transparent border-2 border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-black p-4 rounded-xl text-xs uppercase transition-colors">Cancelar</button>
                                <button type="button" onClick={calcularDobras} className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-black p-4 rounded-xl text-xs uppercase transition-colors shadow-[0_5px_15px_rgba(37,99,235,0.3)]">Calcular BF %</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ TELA DE BLOQUEIO DE PLANOS DA KIWIFY */}
                {modalPlanosPersonal && (
                    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#16171d] border-2 border-emerald-500/40 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] relative text-center">
                            <button onClick={() => setModalPlanosPersonal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-black bg-neutral-800 w-8 h-8 rounded-lg">✕</button>

                            <span className="text-5xl block mb-4">🔒</span>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Limite Atingido</h3>
                            <p className="text-neutral-300 font-bold text-sm mb-8">Você já possui {alunosPersonal.length} alunos cadastrados. Ative a licença PRO para ter alunos ilimitados + Inteligência Artificial.</p>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <a href={KIWIFY_MENSAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border-2 border-neutral-800 hover:border-emerald-500/50 p-5 rounded-2xl flex items-center justify-between transition-all group text-left">
                                    <div>
                                        <p className="text-sm font-black text-white uppercase">Plano Mensal Recorrente</p>
                                        <p className="text-xs font-bold text-neutral-400 mt-1">Cancele quando quiser</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-emerald-400">R$ 49,90</p>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase font-mono">/mês</p>
                                    </div>
                                </a>

                                <a href={KIWIFY_ANUAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border-2 border-emerald-500/50 hover:border-emerald-400 p-6 rounded-2xl flex items-center justify-between transition-all relative text-left group shadow-lg shadow-emerald-500/10">
                                    <span className="absolute -top-3 right-4 bg-emerald-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">Melhor Custo-Benefício</span>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase">Plano Anual Elite</p>
                                        <p className="text-xs font-bold text-emerald-400 mt-1">Economize mais de 30%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-emerald-400">R$ 399,00</p>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase font-mono mt-1">Eq. R$ 33,25/mês</p>
                                    </div>
                                </a>
                            </div>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Liberação automática após o pagamento.</p>
                        </div>
                    </div>
                )}

                {/* ✅ AQUI RENDERIZA A AVALIAÇÃO NO PAINEL DO PERSONAL E DO ALUNO */}
                {alunoVerAvaliacao && renderModalAvaliacao(alunoVerAvaliacao, () => setAlunoVerAvaliacao(null))}

            </div>
        );
    }

    // ✅ PAINEL DO ALUNO
    if (etapa === "aluno") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-6 overflow-y-auto font-sans z-40 custom-scrollbar">
                <header className="w-full max-w-md mx-auto flex justify-between items-center border-b-2 border-neutral-800 pb-5 mb-6">
                    <div>
                        <p className="text-[10px] text-blue-400 font-mono font-black uppercase tracking-wider">Consultoria Privada Treino Fit</p>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1 truncate max-w-[200px]">{alunoLogado?.nome}</h2>
                        <p className="text-xs font-bold text-neutral-400 font-mono mt-1">Objetivo: {alunoLogado?.objetivo}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setModalAvaliacaoAluno(true)} className="px-4 py-2 bg-blue-600/10 border-2 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm">
                            📋 Avaliação
                        </button>
                        <button type="button" onClick={() => { setEtapa("triagem"); setAlunoLogado(null); }} className="px-4 py-2 bg-red-600/10 border-2 border-red-500/30 rounded-lg text-xs font-black uppercase tracking-wider text-red-500 transition-all duration-200 hover:bg-red-600 hover:text-white shadow-sm">
                            Sair
                        </button>
                    </div>
                </header>

                <main className="w-full max-w-md mx-auto flex-1 space-y-6 pb-10">
                    <div className="bg-gradient-to-br from-[#16171d] to-[#0d0e12] border-2 border-neutral-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                        <div><p className="text-xs font-black uppercase tracking-wider text-neutral-400">Check-ins Validados</p><h3 className="text-5xl font-black text-white mt-2">{alunoLogado?.checkins?.length || 0}</h3></div>
                        <button type="button" onClick={iniciarCheckin} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95">Confirmar Treino Hoje</button>
                    </div>

                    {alunoLogado?.checkins?.[0]?.respostaPersonal && (
                        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-5 rounded-r-2xl rounded-l-md shadow-xl mt-5">
                            <p className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">💬 Mensagem do seu Treinador</p>
                            <p className="text-sm font-bold text-neutral-200 italic">"{alunoLogado.checkins[0].respostaPersonal}"</p>
                        </div>
                    )}


                    {alunoLogado?.metaAgua && (
                        <div className="bg-blue-600/10 border-2 border-blue-500/30 p-5 rounded-2xl shadow-xl flex flex-col mt-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5"><span className="text-lg">💧</span> Hidratação Inteligente</p>
                                    <h3 className="text-2xl font-black text-white mt-2">{alunoLogado.metaAgua}</h3>
                                </div>
                                <span className="text-5xl opacity-80 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">🚰</span>
                            </div>

                            {/* Formulário de Configuração das Notificações */}
                            <div className="border-t-2 border-neutral-800/60 pt-4 mt-1">
                                <p className="text-xs text-neutral-200 mb-3 uppercase font-black tracking-wide">Configurar Alerta no Celular</p>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Início (Hora)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="23"
                                            className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-black text-white outline-none focus:border-blue-500/50 text-center transition-colors"
                                            value={configAgua.horaInicio}
                                            onChange={e => setConfigAgua({ ...configAgua, horaInicio: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Fim (Hora)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="23"
                                            className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-sm font-black text-white outline-none focus:border-blue-500/50 text-center transition-colors"
                                            value={configAgua.horaFim}
                                            onChange={e => setConfigAgua({ ...configAgua, horaFim: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Intervalo</label>
                                        <select
                                            className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-xs font-black text-white outline-none focus:border-blue-500/50 text-center transition-colors cursor-pointer"
                                            value={configAgua.intervaloHoras}
                                            onChange={e => setConfigAgua({ ...configAgua, intervaloHoras: e.target.value })}
                                        >
                                            <option value="1">1 em 1h</option>
                                            <option value="2">2 em 2h</option>
                                            <option value="3">3 em 3h</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Frequência</label>
                                        <select
                                            className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-3 rounded-xl text-xs font-black text-white outline-none focus:border-blue-500/50 text-center transition-colors cursor-pointer"
                                            value={configAgua.tipoFrequencia}
                                            onChange={e => setConfigAgua({ ...configAgua, tipoFrequencia: e.target.value })}
                                        >
                                            <option value="Diário">Apenas Hoje</option>
                                            <option value="Mensal">Mensal</option>
                                            <option value="Definitivo">Fixo</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
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
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md active:scale-95 flex justify-center items-center gap-1.5"
                                >
                                    <span>🔔</span> Ativar Alertas
                                </button>
                            </div>
                        </div>
                    )}

                    {alunoLogado?.dietaPrescrita && alunoLogado.dietaPrescrita.length > 0 && (
                        <div className="bg-[#16171d] border-2 border-neutral-800 p-6 rounded-3xl shadow-xl space-y-4">
                            <p className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4 border-b-2 border-neutral-800/60 pb-3 flex items-center gap-2"><span className="text-lg">🍽️</span> Seu Plano Alimentar</p>
                            <div className="space-y-3">
                                {alunoLogado.dietaPrescrita.map((ref, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border-2 border-neutral-800 p-5 rounded-2xl shadow-inner relative overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500/50"></div>
                                        <p className="text-sm font-black text-white tracking-tight uppercase mb-1.5 pl-2">{ref.refeicao}</p>
                                        <p className="text-xs font-bold text-neutral-300 pl-2 leading-relaxed">{ref.itens}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-2 border-emerald-500/30 p-6 rounded-2xl text-center shadow-lg">
                                <p className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-2">🛒 Facilite sua Dieta!</p>
                                <p className="text-xs font-bold text-neutral-300 mb-5 leading-relaxed">Peça as carnes, frutas e verduras do seu plano sem sair de casa e sem perder o foco na semana.</p>
                                <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95">
                                    👉 Pedir na Hortilife
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        <p className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3">Calendário de Treinos Semanal</p>
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none snap-x">
                            {DIAS_SEMANA.map((dia) => {
                                const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
                                const ehHoje = diaAtualSistema.toLowerCase().includes(dia.toLowerCase().slice(0, 4));
                                const ativo = diaAbaAluno === dia;
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setDiaAbaAluno(dia)}
                                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all flex-shrink-0 border-2 snap-center ${ativo
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-[0_5px_15px_rgba(37,99,235,0.3)] scale-105'
                                            : ehHoje
                                                ? 'bg-neutral-900 border-blue-500/50 text-blue-400'
                                                : 'bg-[#16171d] border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white hover:border-neutral-700'
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
                                    <div className="bg-[#16171d] border-2 border-neutral-800 p-10 rounded-3xl text-center shadow-xl mt-2 border-dashed">
                                        <span className="text-4xl mb-3 block opacity-50">🧘‍♂️</span>
                                        <p className="text-sm text-neutral-400 font-black uppercase font-mono tracking-wider">Nenhum treino para {diaAbaAluno}.<br />Dia de Descanso!</p>
                                    </div>
                                );
                            }

                            return rotinaDoDia.exercicios.map((ex, i) => {
                                const chaveUnicaExercicio = `${diaAbaAluno}-${i}`;
                                const estaconcluido = exerciciosConcluidos.includes(chaveUnicaExercicio);
                                const todasSeriesFeitas = Array.from({ length: ex.series || 0 }).every((_, sIdx) => seriesFeitas[`${diaAbaAluno}-${i}-s${sIdx + 1}`]);

                                return (
                                    <div key={i} className={`bg-[#16171d] border-2 transition-all rounded-3xl overflow-hidden shadow-xl mt-4 ${estaconcluido || todasSeriesFeitas ? 'border-emerald-500/50 opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-neutral-800'}`}>

                                        {/* CABEÇALHO DO EXERCÍCIO */}
                                        <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start justify-between gap-5 relative">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neutral-800 to-transparent rounded-bl-full opacity-30 pointer-events-none"></div>
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-black text-neutral-500 bg-[#0d0e12] border border-neutral-800 px-2 py-1 rounded font-mono">{i + 1}</span>
                                                    <h4 className={`font-black uppercase text-xl tracking-tight text-white ${estaconcluido || todasSeriesFeitas ? 'text-emerald-400' : ''}`}>{ex.nome}</h4>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <span className="bg-blue-600/20 border-2 border-blue-500/30 text-blue-400 font-mono text-xs font-black uppercase px-3.5 py-1.5 rounded-lg shadow-inner">{ex.series} Séries × {ex.reps} Reps</span>
                                                    <button type="button" onClick={() => abrirExercicioVisual(ex, setModalGifAberto)} className="bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 hover:border-neutral-500 text-[10px] font-black px-4 py-2 rounded-lg transition-colors uppercase border-2 border-neutral-700 shadow-sm flex items-center gap-1.5">
                                                        <span className="text-sm">▶</span> Ver GIF
                                                    </button>
                                                </div>
                                                {ex.obs && <p className="text-sm text-neutral-300 font-bold mt-5 bg-[#0d0e12] border-l-4 border-sky-500 p-4 rounded-r-xl font-sans shadow-inner leading-relaxed"><span className="text-sky-400 font-black uppercase text-xs tracking-wider block mb-1">Dica do Coach:</span> {ex.obs}</p>}
                                            </div>

                                            <button type="button" onClick={() => alternarConclusaoExercicio(chaveUnicaExercicio)} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all flex-shrink-0 self-end sm:self-center mt-2 sm:mt-0 ${estaconcluido || todasSeriesFeitas ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' : 'border-neutral-600 bg-[#0d0e12] text-transparent hover:border-neutral-400 hover:bg-neutral-800'}`}>✓</button>
                                        </div>

                                        {/* GAVETA DE SÉRIES E PROGRESSÃO */}
                                        <div className="px-6 md:px-8 pb-6 md:pb-8">

                                            {/* BOTÕES DE MARCAR AS SÉRIES */}
                                            <div className="grid grid-cols-4 gap-3 pt-5 border-t-2 border-neutral-800/60 mt-2">
                                                {Array.from({ length: ex.series || 0 }).map((_, sIdx) => {
                                                    const numSerie = sIdx + 1;
                                                    const chaveSerie = `${diaAbaAluno}-${i}-s${numSerie}`;
                                                    const isFeita = seriesFeitas[chaveSerie];

                                                    return (
                                                        <button
                                                            key={numSerie}
                                                            type="button"
                                                            onClick={() => marcarSerie(i, numSerie, ex.series)}
                                                            className={`py-4 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${isFeita ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)] scale-105' : 'bg-[#0d0e12] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-80">Série {numSerie}</span>
                                                            <span className="text-xl font-black">{isFeita ? '✓' : '⬜'}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* 🚀 O BLOCO DE PROGRESSÃO DE CARGA 🚀 */}
                                            <div className="mt-6 border-t-2 border-neutral-800/60 pt-6">
                                                <ControleDeCarga
                                                    exercicioNome={ex.nome}
                                                    cargaUltimoTreino={0}
                                                    alunoId={alunoLogado?.id || alunoLogado?._id}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {timerAtivo && timerDescanso > 0 && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 border-2 border-blue-400 text-white px-8 py-4 rounded-2xl shadow-[0_15px_50px_rgba(37,99,235,0.6)] flex items-center gap-5 z-50 animate-bounce">
                            <span className="text-4xl drop-shadow-md">⏱️</span>
                            <div>
                                <p className="text-xs uppercase tracking-widest font-black opacity-90 leading-none mb-1">Descanso</p>
                                <p className="text-3xl font-black font-mono leading-none">{timerDescanso}s</p>
                            </div>
                            <button type="button" onClick={() => setTimerAtivo(false)} className="ml-4 bg-white/20 hover:bg-white/40 rounded-xl w-10 h-10 flex items-center justify-center text-sm font-black transition-colors border border-white/30">✕</button>
                        </div>
                    )}

                    {/* MODAL LIMPO E INTELIGENTE COM SUPORTE A 2 VÍDEOS */}
                    {modalGifAberto && (
                        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setModalGifAberto(null)}>
                            <div className="w-full max-w-sm bg-[#16171d] border-2 border-sky-500/50 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(14,165,233,0.3)] relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalGifAberto(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-red-500 text-white rounded-xl flex items-center justify-center text-sm font-black transition-colors border border-neutral-600 hover:border-red-400">✕</button>
                                <div className="p-6 bg-gradient-to-r from-[#1c1d26] to-[#16171d] border-b-2 border-neutral-800">
                                    {/* Adicionado a interrogação por segurança: */}
                                    <h3 className="font-black text-white uppercase text-lg pr-12 tracking-tight leading-tight">{modalGifAberto?.nome}</h3>
                                </div>

                                {/* Adicionamos flex-col e gap-4 para os vídeos ficarem alinhados um embaixo do outro */}
                                <div className="w-full bg-[#0d0e12] flex flex-col justify-center p-6 min-h-[300px] items-center gap-4">

                                    {/* LÊ A URL E DECIDE SOZINHO O QUE MOSTRAR */}
                                    {modalGifAberto?.url?.includes('.mp4') ? (
                                        <>
                                            {/* Vídeo Principal */}
                                            <video
                                                src={modalGifAberto.url}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="max-w-full w-full rounded-xl shadow-2xl border-2 border-sky-500/30 object-cover"
                                            />

                                            {/* Vídeo Secundário (Só aparece se o arquivo -2 existir lá no visual.js) */}
                                            {modalGifAberto.url2 && (
                                                <video
                                                    src={modalGifAberto.url2}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="max-w-full w-full rounded-xl shadow-2xl border-2 border-neutral-700 object-cover mt-2"
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <img
                                            src={modalGifAberto?.url}
                                            alt={modalGifAberto?.nome}
                                            className="max-w-full rounded-xl shadow-2xl border-2 border-neutral-800"
                                        />
                                    )}

                                </div>
                            </div>
                        </div>
                    )}

                    {modalFeedbackAberto && (
                        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalFeedbackAberto(false)}>
                            <div className="w-full max-w-md bg-[#16171d] border-2 border-emerald-500/40 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalFeedbackAberto(false)} className="absolute top-5 right-5 text-neutral-500 font-black hover:text-white bg-[#0d0e12] border border-neutral-700 w-10 h-10 rounded-xl flex items-center justify-center transition-colors">✕</button>
                                <div className="text-center mb-8 pt-2">
                                    <span className="text-6xl mb-4 block drop-shadow-lg">🔥</span>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Treino Concluído!</h3>
                                    <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mt-2 bg-emerald-500/10 inline-block px-3 py-1 rounded border border-emerald-500/20">Dê o feedback para seu treinador</p>
                                </div>

                                <form onSubmit={confirmarCheckinComFeedback} className="space-y-6">
                                    <div className="bg-[#0d0e12] p-5 rounded-2xl border border-neutral-800">
                                        <label className="text-xs font-black uppercase text-neutral-300 block mb-3 text-center">Qual foi a Intensidade?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["Leve 🟢", "Moderado 🟡", "Intenso 🔴", "Extremo ☠️"].map(nivel => (
                                                <button key={nivel} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, intensidade: nivel })} className={`py-4 rounded-xl text-xs font-black uppercase transition-all border-2 ${feedbackTreino.intensidade === nivel ? 'bg-orange-600 border-orange-500 text-white shadow-[0_5px_15px_rgba(249,115,22,0.3)] scale-105' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800'}`}>
                                                    {nivel.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-[#0d0e12] p-5 rounded-2xl border border-neutral-800">
                                        <label className="text-xs font-black uppercase text-neutral-300 block mb-3 text-center">E os Pesos / Cargas?</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {["Pouca ⬇️", "Na medida ✅", "Pesado ⬆️"].map(peso => (
                                                <button key={peso} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, carga: peso })} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${feedbackTreino.carga === peso ? 'bg-blue-600 border-blue-500 text-white shadow-[0_5px_15px_rgba(37,99,235,0.3)] scale-105' : 'bg-[#16171d] border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800'}`}>
                                                    {peso.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black uppercase text-neutral-400 block mb-2 pl-1">Observações (Opcional)</label>
                                        <textarea
                                            placeholder="Descreva dores, se aumentou carga ou como se sentiu hoje..."
                                            className="w-full bg-[#0d0e12] border-2 border-neutral-700 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-500/60 h-28 resize-none placeholder-neutral-600 transition-colors"
                                            value={feedbackTreino.comentario}
                                            onChange={e => setFeedbackTreino({ ...feedbackTreino, comentario: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] mt-4 active:scale-95 flex justify-center items-center gap-2">
                                        <span>✓</span> Registrar e Enviar
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 📸 NOVO MODAL: CARD DE COMPARTILHAMENTO DO INSTAGRAM */}
                    {modalShareAberto && dadosShare && (
                        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setModalShareAberto(false)}>
                            <div className="w-full max-w-[340px] bg-gradient-to-br from-neutral-900 to-[#0d0e12] border-2 border-emerald-500/40 rounded-[2rem] p-6 md:p-8 relative shadow-[0_0_60px_rgba(16,185,129,0.3)] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalShareAberto(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white font-black bg-neutral-800 w-10 h-10 rounded-xl flex items-center justify-center z-10 border border-neutral-700">✕</button>

                                {/* O "Story" Card que o aluno vai printar/compartilhar */}
                                <div id="instagram-card" className="w-full aspect-[9/16] bg-gradient-to-b from-emerald-900/30 to-[#0d0e12] border-2 border-emerald-500/30 rounded-[2rem] flex flex-col items-center justify-between p-6 md:p-8 relative overflow-hidden mb-8 shadow-inner">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                                    <div className="absolute -left-10 top-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                                    <div className="text-center w-full mt-6 z-10">
                                        <p className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest mb-1.5 bg-[#0d0e12] inline-block px-3 py-1 rounded-lg border border-emerald-500/20">Treino Fit App</p>
                                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg mt-3">TREINO<br />PAGO!</h3>
                                        <p className="text-sm font-bold text-neutral-400 mt-2">{dadosShare.data}</p>
                                    </div>

                                    <div className="w-full space-y-4 my-auto z-10">
                                        <div className="bg-[#16171d]/90 backdrop-blur-md border border-neutral-600/50 p-4 rounded-xl text-center shadow-lg">
                                            <p className="text-[10px] uppercase text-neutral-400 font-black mb-1">Foco de Hoje</p>
                                            <p className="text-base font-black text-white uppercase">{dadosShare.treino}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 bg-[#16171d]/90 backdrop-blur-md border border-neutral-600/50 p-4 rounded-xl text-center shadow-lg">
                                                <p className="text-[10px] uppercase text-neutral-400 font-black mb-1">Intensidade</p>
                                                <p className="text-sm font-black text-emerald-400 uppercase truncate">{dadosShare.intensidade.split(" ")[0]}</p>
                                            </div>
                                            <div className="flex-1 bg-[#16171d]/90 backdrop-blur-md border border-neutral-600/50 p-4 rounded-xl text-center shadow-lg">
                                                <p className="text-[10px] uppercase text-neutral-400 font-black mb-1">Carga</p>
                                                <p className="text-sm font-black text-blue-400 uppercase truncate">{dadosShare.carga.split(" ")[0]}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full text-center mb-4 z-10">
                                        <div className="w-16 h-16 bg-neutral-900 rounded-full mx-auto mb-3 border-4 border-emerald-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                            💪
                                        </div>
                                        <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest bg-[#0d0e12] inline-block px-2 py-0.5 rounded border border-neutral-800 mb-1">Treinador</p>
                                        <p className="text-base font-black text-white">{dadosShare.nomePersonal}</p>
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
                                }} className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(16,185,129,0.4)] active:scale-95 flex items-center justify-center gap-3">
                                    <span className="text-xl">📸</span> Compartilhar no Insta
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

    return <div className="text-white text-center p-10 bg-[#0d0e12] min-h-screen font-black text-xl uppercase tracking-widest flex items-center justify-center">Carregando Plataforma...</div>;
}

export default App;