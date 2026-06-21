import { toBlob } from 'html-to-image';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useCallback, useRef } from "react";
import ListaExercicios from "./services/ListaExercicio";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

// eslint-disable-next-line no-unused-vars
import { abrirExercicioVisual } from "./components/visual";

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const parseNumeroSeguro = (val) => Number(String(val).replace(',', '.')) || 0;

function App() {
    // =========================================================================
    // 1. TODOS OS ESTADOS (HOOKS)
    // =========================================================================
    // =========================================================================
    // 1. TODOS OS ESTADOS (HOOKS)
    // =========================================================================
    const [configAgua, setConfigAgua] = useState({ ativo: false, horaInicio: 8, horaFim: 22, intervaloHoras: 2 });
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

    // ✅ ESTADOS PARA O CARD DO INSTAGRAM
    const [modalShareAberto, setModalShareAberto] = useState(false);
    const [dadosShare, setDadosShare] = useState(null);

    const API_URL = "https://api-backend-treino-fit.onrender.com/api";
    const verificandoRef = useRef(false);
    const KIWIFY_MENSAL = "https://pay.kiwify.com.br/O5ggnzX";
    const KIWIFY_ANUAL = "https://pay.kiwify.com.br/vbvKtGY";

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
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 rounded-3xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={fecharModal} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold text-lg">✕</button>

                    <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xl">📊</div>
                        <div>
                            <h3 className="font-bold text-white uppercase text-sm tracking-tight">Avaliação Física</h3>
                            <p className="text-[10px] text-blue-400 font-mono uppercase">{alunoData.nome}</p>
                        </div>
                    </div>

                    {/* 🚀 NOVO RADAR DE EVOLUÇÃO VISUAL */}
                    <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl mb-6 shadow-inner">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                            <span>🚀</span> Radar de Evolução Visual
                        </p>

                        <div className="mb-5">
                            <div className="flex justify-between text-[9px] uppercase font-bold text-neutral-400 mb-1.5">
                                <span>Peso Atual: {p}kg</span>
                                <span className="text-emerald-500">{textMeta}</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden relative shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progressoMeta, 100)}%` }}></div>
                            </div>
                            <p className="text-[8px] text-right mt-1.5 text-neutral-500 font-mono uppercase">Proximidade do objetivo: {Math.round(Math.min(progressoMeta, 100))}%</p>
                        </div>

                        {bf > 0 && (
                            <div className="pt-2 border-t border-neutral-800/50">
                                <div className="flex justify-between text-[9px] uppercase font-bold text-neutral-400 mb-1.5">
                                    <span>Gordura Atual: {bf}%</span>
                                    <span className={bfColor.replace('bg-', 'text-')}>{bfStatus}</span>
                                </div>
                                <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden relative shadow-inner">
                                    <div className={`h-full ${bfColor} transition-all duration-1000 ease-out`} style={{ width: `${bfPercent}%` }}></div>
                                </div>
                            </div>
                        )}
                        {bf === 0 && (
                            <div className="pt-2 border-t border-neutral-800/50 text-center">
                                <p className="text-[9px] text-neutral-600 italic">Percentual de gordura não registrado nas dobras.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Dados Biométricos Gerais</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Peso Bruto</p>
                                    <p className="text-sm font-bold text-white">{alunoData.peso ? alunoData.peso : '--'} kg</p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Estatura</p>
                                    <p className="text-sm font-bold text-white">{alunoData.altura ? alunoData.altura : '--'} m</p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Idade</p>
                                    <p className="text-sm font-bold text-white">{alunoData.idade ? alunoData.idade : '--'} anos</p>
                                </div>
                                <div className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl">
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Gênero Bio</p>
                                    <p className="text-sm font-bold text-white">{alunoData.genero ? alunoData.genero : '--'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl space-y-3">
                            <div>
                                <p className="text-[9px] text-neutral-500 uppercase font-bold">Nível de Treino</p>
                                <p className="text-xs text-neutral-300 font-medium">{alunoData.nivel ? alunoData.nivel : '--'}</p>
                            </div>
                            {alunoData.restricoes && (
                                <div>
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold">Restrições Alimentares</p>
                                    <p className="text-xs text-neutral-300">{alunoData.restricoes}</p>
                                </div>
                            )}
                            {alunoData.lesoes && (
                                <div>
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold">Histórico de Lesões</p>
                                    <p className="text-xs text-neutral-300">{alunoData.lesoes}</p>
                                </div>
                            )}
                        </div>

                        {alunoData.medidas && Object.keys(alunoData.medidas).length > 0 && (
                            <div className="mt-6">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-3 pt-2 border-t border-neutral-800">
                                    📏 Circunferências Extras (cm)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(alunoData.medidas).map(([key, value]) => {
                                        if (!value || value === "" || value === "0" || key === "_id" || key === "percentualGordura") return null;
                                        const labelFormatada = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                        return (
                                            <div key={key} className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl flex justify-between items-center">
                                                <span className="text-[9px] text-neutral-500 uppercase font-bold capitalize">{labelFormatada}</span>
                                                <span className="text-sm font-mono text-white font-bold">{value}cm</span>
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
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Sincronizando Seu Perfil...</div>
            </div>
        );
    }

    if (etapa === "login") return <Login aoLogar={handleLogin} aoVoltar={() => setEtapa("triagem")} />;

    if (etapa === "triagem") {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-white font-sans z-50 bg-[#0d0e12] bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                <div className="relative z-10 w-full max-w-sm bg-[#16171d]/80 border border-neutral-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-md">
                    <div className="flex justify-center mb-8">
                        <img src="/logo512.png" alt="Logo Treino Fit" className="h-20 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
                    </div>
                    <div className="space-y-4">
                        <button type="button" onClick={() => setEtapa(usuario ? "home" : "login")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-emerald-500/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
                            <div>
                                <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-0.5">Módulo Consultoria</p>
                                <p className="text-sm font-bold text-neutral-200">Acessar Chat Inteligência Artificial</p>
                            </div>
                            <span className="text-neutral-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
                        </button>
                        <button type="button" onClick={() => setEtapa("login_personal")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-neutral-400/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
                            <div>
                                <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest mb-0.5">Módulo Treinador</p>
                                <p className="text-sm font-bold text-neutral-200">Painel Geral do Personal Trainer</p>
                            </div>
                            <span className="text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
                        </button>
                        <button type="button" onClick={() => setEtapa("login_aluno")} className="w-full bg-[#1e2029]/90 hover:bg-[#252834] border border-neutral-700/50 hover:border-blue-500/50 text-left p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg">
                            <div>
                                <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-0.5">Módulo Aluno</p>
                                <p className="text-sm font-bold text-neutral-200">Portal de Planilhas e Treinos Pro</p>
                            </div>
                            <span className="text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all text-lg font-bold">→</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (etapa === "login_personal") {
        const GOOGLE_CLIENT_ID = "588566756758-75ic5m03ser1af56tr26gkeenh8qn9nc.apps.googleusercontent.com";
        return (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50">
                    <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl">
                        {!googleUser ? (
                            <>
                                <h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Acesso Técnico</h2>
                                <p className="text-neutral-500 text-xs mb-8">Autentique-se com sua conta Google profissional.</p>
                                <div className="flex justify-center mb-6">
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Falha no Login')} theme="filled_black" text="continue_with" />
                                </div>
                                <button type="button" onClick={() => setEtapa("triagem")} className="w-full bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl text-xs uppercase tracking-wider text-neutral-400 transition-colors font-bold">Voltar</button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={googleUser.foto} alt="Perfil" className="w-10 h-10 rounded-full border border-emerald-500" />
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase">{googleUser.nome}</h2>
                                        <p className="text-[10px] text-emerald-500 font-mono">Autenticação Concluída</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-[11px] mb-5 leading-relaxed">Este é o seu primeiro acesso. Para ativar a sua licença no sistema Treino Fit, insira o seu registo profissional.</p>
                                <form onSubmit={handleCadastrarCref} className="space-y-4">
                                    <input required type="text" placeholder="Registro CREF " className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={cref} onChange={(e) => setCref(e.target.value)} />
                                    <div className="flex gap-3 text-xs font-bold">
                                        <button type="button" onClick={() => setGoogleUser(null)} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Cancelar</button>
                                        <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Validar Licença</button>
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
                <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-md font-bold uppercase tracking-tight text-neutral-200 mb-1">Portal do Aluno</h2><p className="text-neutral-500 text-xs mb-5">Insira o código de acesso fornecido pelo seu Personal.</p>
                    <form onSubmit={handleLoginAluno} className="space-y-4">
                        <input required type="text" placeholder="Código de Acesso (Ex: Nome Completo)" className="w-full bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl text-sm font-medium outline-none focus:border-neutral-700 text-white" value={codigoAcessoAluno} onChange={(e) => setCodigoAcessoAluno(e.target.value)} />
                        <div className="flex gap-3 text-xs font-bold"><button type="button" onClick={() => setEtapa("triagem")} className="w-1/3 bg-transparent border border-neutral-800 hover:bg-neutral-800 p-4 rounded-xl uppercase tracking-wider text-neutral-400 transition-colors">Voltar</button><button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl uppercase tracking-wider transition-colors shadow-lg">Entrar</button></div>
                    </form>
                </div>
            </div>
        );
    }

    if (etapa === "matricula_externa") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-white font-sans z-50 overflow-y-auto">
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 p-8 rounded-2xl shadow-2xl my-auto">
                    <div className="text-center mb-6"><span className="text-4xl mb-3 block">🤖</span><h2 className="text-lg font-bold uppercase tracking-tight text-emerald-500">Auto-Avaliação IA</h2><p className="text-neutral-400 text-[11px] mt-2">Preencha sua biometria para a Inteligência Artificial estruturar a base do seu treino e dieta.</p></div>
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
                        <input required type="text" placeholder="Nome Completo" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, nome: e.target.value })} />
                        <input required type="text" placeholder="WhatsApp (Apenas Números)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setNovoAlunoForm({ ...novoAlunoForm, whatsapp: e.target.value })} />
                        <div className="grid grid-cols-3 gap-3">
                            <input required type="text" placeholder="Peso (kg)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, peso: e.target.value })} />
                            <input required type="text" placeholder="Altura (m)" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, altura: e.target.value })} />
                            <input required type="number" placeholder="Idade" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, idade: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, genero: e.target.value })}>
                                <option value="">Gênero Biológico</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                            </select>
                            <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, meta: e.target.value })}>
                                <option value="">Objetivo Principal</option><option value="Emagrecimento">Emagrecimento</option><option value="Hipertrofia">Hipertrofia</option><option value="Performance">Performance</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, nivel: e.target.value })}>
                                <option value="">Nível de Treino</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                            </select>
                            <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none text-neutral-400 focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, diasTreino: e.target.value })}>
                                <option value="">Dias de Treino/Semana</option><option value="3">3 Dias</option><option value="4">4 Dias</option><option value="5">5 Dias</option><option value="6">6 Dias</option>
                            </select>
                        </div>
                        <input type="text" placeholder="Restrições Alimentares?" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, restricoes: e.target.value })} />
                        <input type="text" placeholder="Lesões ou Dores?" className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm outline-none focus:border-neutral-700" onChange={e => setPerfil({ ...perfil, lesoes: e.target.value })} />
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg mt-4 transition-all">⚡ Gerar Diagnóstico com IA</button>
                    </form>
                </div>
            </div>
        );
    }

    // ✅ NOVO ONBOARDING GAMIFICADO COM O QUIZ
    if (etapa === "onboarding") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-4 md:p-8 text-white z-50 overflow-y-auto font-sans">
                <div className="w-full max-w-md bg-[#16171d] border border-neutral-800 p-6 md:p-8 rounded-3xl shadow-2xl my-auto relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-tight text-emerald-500">
                            {quizStep === 1 && "1. Seu Objetivo"}
                            {quizStep === 2 && "2. Sua Rotina"}
                            {quizStep === 3 && "3. Suas Preferências"}
                            {quizStep === 4 && "4. Perfil Físico"}
                        </h2>
                        <span className="text-[10px] font-mono text-neutral-500 bg-[#0d0e12] px-2 py-1 rounded-md">Passo {quizStep} de 4</span>
                    </div>
                    <div className="w-full bg-[#0d0e12] h-2 rounded-full mb-8 overflow-hidden border border-neutral-800">
                        <div className="bg-emerald-500 h-full transition-all duration-500 ease-out" style={{ width: `${(quizStep / 4) * 100}%` }}></div>
                    </div>
                    {quizStep === 1 && (
                        <div className="space-y-4">
                            <p className="text-xs text-neutral-400 mb-4 font-medium leading-relaxed">O que você quer que a nossa Inteligência Artificial construa para você hoje?</p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "Emagrecimento", icone: "🔥", desc: "Queima de Gordura Intensa" },
                                    { id: "Hipertrofia", icone: "💪", desc: "Ganho de Massa Magra" },
                                    { id: "Performance", icone: "⚡", desc: "Condicionamento e Saúde" }
                                ].map(obj => (
                                    <button key={obj.id} type="button" onClick={() => setPerfil({ ...perfil, meta: obj.id })}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${perfil.meta === obj.id ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-[#0d0e12] border-neutral-800 hover:border-neutral-600'}`}>
                                        <span className="text-3xl">{obj.icone}</span>
                                        <div className="text-left">
                                            <p className={`font-bold uppercase text-sm ${perfil.meta === obj.id ? 'text-emerald-400' : 'text-white'}`}>{obj.id}</p>
                                            <p className="text-[10px] text-neutral-500">{obj.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={avançarQuiz} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg mt-6 transition-all">Próximo Passo →</button>
                        </div>
                    )}
                    {quizStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Qual o seu nível de experiência?</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Iniciante", "Intermediário", "Avançado"].map(niv => (
                                        <button key={niv} type="button" onClick={() => setPerfil({ ...perfil, nivel: niv })}
                                            className={`p-3 rounded-xl text-[10px] font-bold uppercase transition-all border ${perfil.nivel === niv ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-[#0d0e12] border-neutral-800 text-neutral-400 hover:bg-neutral-800'}`}>
                                            {niv}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Quantos dias na semana quer treinar?</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {["3", "4", "5", "6"].map(dias => (
                                        <button key={dias} type="button" onClick={() => setPerfil({ ...perfil, diasTreino: dias })}
                                            className={`p-3 rounded-xl text-lg font-black transition-all border ${perfil.diasTreino === dias ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0d0e12] border-neutral-700 text-neutral-500 hover:bg-neutral-800'}`}>
                                            {dias}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setQuizStep(1)} className="w-1/3 bg-transparent border border-neutral-800 text-neutral-400 p-4 rounded-xl font-bold text-xs transition-colors">Voltar</button>
                                <button type="button" onClick={avançarQuiz} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg transition-all">Continuar →</button>
                            </div>
                        </div>
                    )}
                    {quizStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs text-neutral-300 font-medium">Selecione até 5 alimentos que você <span className="text-emerald-400 font-bold">não quer que falte</span> na sua dieta.</p>
                                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md font-mono">{alimentosFavoritos.length}/5</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 pb-2">
                                {[
                                    { nome: "Pão com Ovo", emoji: "🍳" }, { nome: "Frango", emoji: "🍗" },
                                    { nome: "Arroz", emoji: "🍚" }, { nome: "Carne", emoji: "🥩" },
                                    { nome: "Batata Doce", emoji: "🍠" }, { nome: "Mandioca", emoji: "🥔" },
                                    { nome: "Iogurte", emoji: "🥛" }, { nome: "Frutas", emoji: "🍎" },
                                    { nome: "Tapioca", emoji: "🌮" }, { nome: "Cuscuz", emoji: "🌽" },
                                    { nome: "Macarrão", emoji: "🍝" }, { nome: "Café", emoji: "☕" }
                                ].map(ali => {
                                    const selecionado = alimentosFavoritos.includes(ali.nome);
                                    return (
                                        <button key={ali.nome} type="button" onClick={() => toggleAlimento(ali.nome)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selecionado ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-[#0d0e12] border-neutral-800 hover:border-neutral-600'}`}>
                                            <span className="text-2xl mb-1">{ali.emoji}</span>
                                            <span className={`text-[9px] font-bold uppercase text-center ${selecionado ? 'text-orange-400' : 'text-neutral-500'}`}>{ali.nome}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setQuizStep(2)} className="w-1/3 bg-transparent border border-neutral-800 text-neutral-400 p-4 rounded-xl font-bold text-xs transition-colors">Voltar</button>
                                <button type="button" onClick={avançarQuiz} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-lg transition-all">Quase lá! →</button>
                            </div>
                        </div>
                    )}
                    {quizStep === 4 && (
                        <form onSubmit={finalizarQuiz} className="space-y-4">
                            <p className="text-[11px] text-neutral-400 mb-4 text-center">Para a IA calcular exatamente os seus macronutrientes, precisamos dos seus dados vitais.</p>
                            <div><label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Seu Nome</label><input required type="text" className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-sm outline-none text-white focus:border-emerald-500/50 transition-colors" value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Gênero</label>
                                    <select required className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-sm outline-none text-white focus:border-emerald-500/50" value={perfil.genero} onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}>
                                        <option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                                    </select>
                                </div>
                                <div><label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Idade</label><input required type="number" className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-sm outline-none text-white focus:border-emerald-500/50" value={perfil.idade} onChange={(e) => setPerfil({ ...perfil, idade: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Peso (kg)</label><input required type="text" placeholder="Ex: 75.5" className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-sm outline-none text-white focus:border-emerald-500/50" value={perfil.peso} onChange={(e) => setPerfil({ ...perfil, peso: e.target.value })} /></div>
                                <div><label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Altura (m)</label><input required type="text" placeholder="Ex: 1.75" className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-sm outline-none text-white focus:border-emerald-500/50" value={perfil.altura} onChange={(e) => setPerfil({ ...perfil, altura: e.target.value })} /></div>
                            </div>
                            <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Restrições Alimentares?</label><input type="text" placeholder="Ex: Vegano, Sem Lactose..." className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-emerald-500/50" value={perfil.restricoes} onChange={(e) => setPerfil({ ...perfil, restricoes: e.target.value })} /></div>
                            <div><label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Lesões ou Dores?</label><input type="text" placeholder="Ex: Dor no Joelho, Lombar..." className="w-full bg-[#0d0e12] border border-neutral-800 p-3.5 rounded-xl text-sm font-medium outline-none text-white focus:border-emerald-500/50" value={perfil.lesoes} onChange={(e) => setPerfil({ ...perfil, lesoes: e.target.value })} /></div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setQuizStep(3)} className="w-1/3 bg-transparent border border-neutral-800 text-neutral-400 p-4 rounded-xl font-bold text-xs transition-colors">Voltar</button>
                                <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl uppercase tracking-wider font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                                    <span>⚡ Salvar e Entrar</span>
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
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                        <header className="w-full max-w-4xl flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <img src="/logo192.png" alt="Ícone Treino Fit" className="w-8 h-8 rounded" />
                                <div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-tight">{perfil.nome}</h2>
                                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Conta {isVip ? 'Premium Elite' : 'Free Tier'}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => !isVip && setBloqueado(true)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase font-mono border ${isVip ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5 animate-pulse'}`}>{isVip ? "✓ Vip Ativado" : "Upgrade para Enterprise"}</button>
                        </header>
                        <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
                            <div className="md:col-span-1 space-y-4">
                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl">
                                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Composição Corporal</p>
                                    <div className="grid grid-cols-2 gap-3"><div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Massa Global</span><span className="text-2xl font-semibold text-white">{perfil.peso}<span className="text-xs text-neutral-500 font-normal ml-0.5">kg</span></span></div><div className="bg-[#0d0e12] p-3 border border-neutral-850 rounded-lg"><span className="text-[9px] text-neutral-500 uppercase block">Estatura</span><span className="text-2xl font-semibold text-white">{perfil.altura}<span className="text-xs text-neutral-500 font-normal ml-0.5">m</span></span></div></div>
                                    <div className="mt-3 text-[10px] text-neutral-400 font-mono flex justify-between border-t border-neutral-800/60 pt-2"><span>Planejamento:</span><span className="text-emerald-500 font-bold uppercase">{perfil.meta}</span></div>
                                </div>
                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl text-center"><p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider text-left mb-4">Meta Metabólica Diária</p><div className="inline-flex flex-col items-center justify-center p-6 border border-neutral-800 bg-[#0d0e12] rounded-full w-28 h-28 mx-auto mb-4 border-t-emerald-600"><span className="text-xl font-bold text-white">{perfil.tmb}</span><span className="text-[9px] font-mono text-neutral-500 uppercase">kcal/dia</span></div></div>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl"><p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">⚡ Diretriz Técnica Operacional</p><p className="text-xs font-medium text-neutral-300 leading-relaxed">"{perfil.nome}, seus parâmetros apontam foco em oxidação de gordura ativa. Otimize a ingestão proteinada."</p></div>
                                <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
                                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">Terminais de Execução</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button type="button" onClick={() => setAbaAtiva("chat")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all shadow-lg">Abrir Chat IA & Consultoria</button><button type="button" onClick={() => setAbaAtiva("treino")} className="bg-transparent hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider text-center transition-all">Acessar Biblioteca de Treinos</button></div>
                                    <div className="text-center pt-3 border-t border-neutral-800/40"><button type="button" onClick={handleSair} className="text-[10px] font-mono uppercase text-neutral-600 hover:text-red-400 transition-colors">Encerrar sessão de dados</button></div>
                                </div>
                                <div className="bg-gradient-to-r from-[#16171d] to-emerald-900/10 border border-emerald-500/20 p-5 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">🛒 Mercado Saudável Oficial</p>
                                        <p className="text-xs font-medium text-neutral-300">A IA montou sua dieta? Peça os ingredientes agora mesmo e receba no conforto de casa.</p>
                                    </div>
                                    <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-lg">
                                        👉 Pedir na Hortilife
                                    </a>
                                </div>
                            </div>
                        </main>
                    </div>
                )}
                {abaAtiva === "chat" && (
                    <div className="flex-1 flex flex-col overflow-hidden"><header className="p-4 flex items-center justify-between border-b border-neutral-800 bg-[#16171d]"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Voltar para o Dashboard</button><span className="text-[10px] font-mono uppercase text-neutral-500">Módulo Consultoria de Nutrição</span></header><ChatReceitas whatsapp={usuario} isVip={isVip} aoPedirUpgrade={() => setBloqueado(true)} perfil={perfil} setTreinoIAPescado={setTreinoIAPescado} aoAtualizarPerfil={atualizarStatusVIP} /></div>
                )}
                {abaAtiva === "treino" && (
                    <div className="flex-1 flex flex-col bg-[#0d0e12] p-6 overflow-y-auto">
                        <header className="w-full max-w-4xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6"><button type="button" onClick={() => { setAbaAtiva("home"); atualizarStatusVIP(); }} className="text-emerald-500 font-bold text-[10px] uppercase font-mono flex items-center gap-2">← Retornar</button><span className="text-white font-bold uppercase text-xs tracking-wider">Módulo de Planilhas</span></header>
                        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mx-auto"><button type="button" onClick={() => isVip ? setModalidadeAberta('ia') : setBloqueado(true)} className="bg-[#16171d] hover:bg-[#1e2029] border border-neutral-800 p-6 rounded-xl flex items-center justify-between transition-all text-left"><div><p className="font-bold uppercase text-sm text-white">Treino Inteligência Artificial</p><p className="text-[9px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">{!isVip ? "Status: Bloqueado corporativo" : "Acesso Elite Ativado"}</p></div><span className="text-xl">🤖</span></button><button type="button" onClick={() => setModalidadeAberta('academia')} className="bg-[#16171d] hover:bg-[#1e2029] border border-neutral-800 p-6 rounded-xl flex items-center justify-between transition-all text-left"><div><p className="font-bold uppercase text-sm text-white">Metodologia Tradicional (ABC)</p><p className="text-[9px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">Acesso Livre</p></div><span className="text-xl">🏋️‍♂️</span></button></div>
                        {modalidadeAberta && <ListaExercicios modalidade={modalidadeAberta} whatsapp={usuario} API_URL={API_URL} perfil={perfil} treinoIA={treinoIAPescado} aoFechar={() => { setModalidadeAberta(null); atualizarStatusVIP(); }} />}
                    </div>
                )}
                {bloqueado && <div className="fixed inset-0 z-[500] bg-[#0d0e12]/95 backdrop-blur-sm flex flex-col items-center p-6 overflow-y-auto"><button type="button" onClick={() => { setBloqueado(false); atualizarStatusVIP(); }} className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 w-8 h-8 rounded flex items-center justify-center text-xs">✕</button><TelaPlanos /></div>}
            </div>
        );
    }

    if (etapa === "personal") {
        const hojeDataStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-4 md:p-6 overflow-y-auto font-sans z-40">
                <header className="w-full max-w-5xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo192.png" alt="Ícone Treino Fit" className="w-8 h-8 rounded" />
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-tight">{personalLogado?.nome}</h2>
                            <p className="text-[10px] text-neutral-500 font-mono">{personalLogado?.cref} • {personalLogado?.assinaturaAtiva ? "Licença PRO Ativa" : "Modo Teste Grátis"}</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleSair} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 text-[10px] text-neutral-400 font-bold uppercase transition-colors">Sair</button>
                </header>

                <main className="w-full max-w-5xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
                    <div className="md:col-span-1 flex flex-col gap-6">
                        <div className="bg-[#16171d] border border-neutral-800 rounded-xl p-5 shadow-xl">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Métricas da Assessoria</h3>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg flex flex-col justify-center"><p className="text-lg font-semibold text-white">{alunosPersonal.length}</p><p className="text-[8px] uppercase tracking-wide text-neutral-500 mt-1">Alunos</p></div>
                                <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg flex flex-col justify-center"><p className="text-lg font-semibold text-amber-500">{alunosPersonal.filter(a => a.statusTreino === "Rascunho IA").length}</p><p className="text-[8px] uppercase tracking-wide text-neutral-500 mt-1">Alertas IA</p></div>
                                <div className="p-3 bg-[#0d0e12] border border-red-900/30 rounded-lg flex flex-col justify-center"><p className="text-lg font-semibold text-red-500">{alunosPersonal.filter(a => calcularDiasSemTreino(a.checkins) >= 5 && a.statusConta !== 'Off').length}</p><p className="text-[8px] uppercase tracking-wide text-red-400 mt-1">Em Risco</p></div>
                                <div className="p-3 bg-[#0d0e12] border border-neutral-800 rounded-lg flex flex-col justify-center"><p className="text-lg font-semibold text-neutral-400">{alunosPersonal.filter(a => a.statusConta === "Off").length}</p><p className="text-[8px] uppercase tracking-wide text-neutral-500 mt-1">Inativos</p></div>
                            </div>
                            {!personalLogado?.assinaturaAtiva && (
                                <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-center">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Teste Ativo: {alunosPersonal.length}/2 Alunos</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-[#16171d] to-emerald-900/10 border border-emerald-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🛒</div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2">🤝 Parceiro Oficial</p>
                            <h4 className="text-sm font-bold text-white mb-2">Hortilife Praticidade</h4>
                            <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">Indique nosso parceiro para seus alunos comprarem os alimentos da dieta direto de casa. Mais adesão ao plano nutricional!</p>
                            <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="block w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-center font-bold py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-all">
                                👉 Conhecer Hortilife
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-[#16171d] border border-neutral-800 rounded-xl p-4 md:p-5 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Carteira de Clientes</h3>
                            <div className="flex gap-2">
                                <button type="button" onClick={carregarAlunosAssessoria} className="bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg border border-neutral-700">🔄 Atualizar</button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    const link = `${window.location.origin}?ref=${personalLogado?._id}`;
                                    navigator.clipboard.writeText(link);
                                    alert(`🔗 Link copiado com sucesso!\n\nEnvie este link no WhatsApp do seu aluno:\n\n${link}`);
                                }} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg">🔗 Link IA</button>

                                <button type="button" onClick={() => {
                                    if (!personalLogado?.assinaturaAtiva && alunosPersonal.length >= 2) {
                                        return setModalPlanosPersonal(true);
                                    }
                                    setModalNovoAluno(true);
                                }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-2 sm:py-1.5 rounded transition-colors uppercase flex-1 sm:flex-none text-center shadow-lg">+ Novo Manual</button>
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-wider">
                                        <th className="pb-3 font-semibold">Nome do Aluno</th><th className="pb-3 font-semibold">Objetivo</th><th className="pb-3 font-semibold">Status Planilha</th><th className="pb-3 font-semibold">Último Treino</th><th className="pb-3 font-semibold">Radar</th><th className="pb-3 font-semibold text-right">Ações Gerenciais</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-neutral-800/40">
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
                                                textoFarol = "Em dia";
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
                                            <tr key={idUnico} className={`hover:bg-neutral-800/20 transition-colors ${aluno.statusConta === 'Off' ? 'opacity-40' : ''}`}>
                                                <td className="py-3.5 font-medium text-white">
                                                    <div className="cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1" onClick={() => setAlunoVerFeedback(aluno)}>
                                                        {aluno.nome} <span className="text-[10px] opacity-50">ℹ️</span>
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{aluno.whatsapp}</div>
                                                </td>
                                                <td className="py-3.5 text-neutral-400">{aluno.objetivo}</td>
                                                <td className="py-3.5"><span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>{aluno.statusTreino}</span></td>
                                                <td className="py-3.5">
                                                    {checkinDeHoje ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse hover:bg-emerald-500/20 transition-colors cursor-pointer">
                                                            🔥 Treinou Hoje!
                                                        </button>
                                                    ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                        <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer">
                                                            Check-in: {aluno.checkins[0].data}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-neutral-600 font-mono">Nenhum treino</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border flex items-center gap-1 ${corFarol}`}>
                                                            {iconeFarol} {textoFarol}
                                                        </span>
                                                        {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                            <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="text-[#25D366] hover:scale-110 transition-transform flex-shrink-0" title="Chamar no WhatsApp">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 text-right space-x-2">
                                                    <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase mr-1">Avaliação</button>
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
                                                    }} className="bg-neutral-600/20 text-neutral-400 hover:bg-neutral-600 hover:text-white border border-neutral-500/30 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase mr-1">Editar Perfil</button>
                                                    <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusTreino === "Rascunho IA" ? "Revisar IA" : "Montar Semanal"}</button>
                                                    <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className="border border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase">{aluno.statusConta === "Ativo" ? "Arquivar" : "Ativar"}</button>
                                                    <button type="button" onClick={() => deletarAluno(idUnico)} className="text-red-500/70 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 rounded font-bold text-[9px] py-1 px-2 uppercase">Excluir</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
                                        textoFarol = "Em dia";
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
                                    <div key={idUnico} className={`bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl flex flex-col space-y-3 ${aluno.statusConta === 'Off' ? 'opacity-50' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-white text-sm cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1" onClick={() => setAlunoVerFeedback(aluno)}>
                                                    {aluno.nome} <span className="text-[10px] opacity-50">ℹ️</span>
                                                </p>
                                                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{aluno.whatsapp}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase text-center ${aluno.statusTreino === 'Rascunho IA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : aluno.statusTreino === 'Enviado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>
                                                {aluno.statusTreino}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 bg-[#16171d] p-2.5 rounded-lg border border-neutral-800/50">
                                            <div>
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Objetivo</p>
                                                <p className="text-xs text-neutral-300 truncate">{aluno.objetivo}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Último Treino</p>
                                                {checkinDeHoje ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse cursor-pointer">
                                                        🔥 Hoje!
                                                    </button>
                                                ) : aluno.checkins && aluno.checkins.length > 0 ? (
                                                    <button type="button" onClick={() => setAlunoVerFeedback(aluno)} className="text-[10px] font-mono text-neutral-400 cursor-pointer">
                                                        {aluno.checkins[0].data}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-neutral-600 font-mono">Nenhum</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#16171d] p-2.5 rounded-lg border border-neutral-800/50 mt-1 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center gap-1 ${corFarol}`}>
                                                    {iconeFarol} {textoFarol}
                                                </span>
                                            </div>
                                            {(diasSemTreino >= 3 || diasSemTreino === Infinity) && aluno.statusConta !== 'Off' && (
                                                <button type="button" onClick={() => enviarZapRetencao(aluno, diasSemTreino)} className="flex items-center gap-1 bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded text-[9px] font-bold uppercase transition-all hover:bg-[#25D366]/20">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg> Resgatar
                                                </button>
                                            )}
                                        </div>

                                        <div className="pt-1 flex flex-wrap gap-2">
                                            <button type="button" onClick={() => setAlunoVerAvaliacao(aluno)} className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-bold py-2 rounded transition-colors uppercase text-center mb-1">
                                                📊 Ver Avaliação
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
                                            }} className="w-full bg-neutral-600/20 text-neutral-400 hover:bg-neutral-600 hover:text-white border border-neutral-500/30 text-[10px] font-bold py-2 rounded transition-colors uppercase text-center mb-1">
                                                ✏️ Editar Perfil do Aluno
                                            </button>
                                            <button type="button" onClick={() => abrirGeradorTreino(aluno)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 rounded transition-colors uppercase flex-1 shadow-lg text-center">
                                                {aluno.statusTreino === "Rascunho IA" ? "Revisar IA" : "Editar Plano"}
                                            </button>
                                            <button type="button" onClick={() => alterStatusContaAluno(idUnico, aluno.statusConta === "Ativo" ? "Off" : "Ativo")} className="border border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-[10px] font-bold py-2 rounded transition-colors uppercase flex-1 text-center">
                                                {aluno.statusConta === "Ativo" ? "Arquivar" : "Ativar"}
                                            </button>
                                            <button type="button" onClick={() => deletarAluno(idUnico)} className="text-red-500/70 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 rounded font-bold text-[11px] py-2 px-3 uppercase transition-colors text-center">
                                                ✕
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
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-3xl bg-[#16171d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <header className="p-4 md:p-5 border-b border-neutral-800 flex justify-between items-center bg-[#1c1d26]"><div><span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">Prescrevendo Plano Pro</span><h3 className="text-base font-bold text-white uppercase">{alunoEmEdicao.nome}</h3></div><button type="button" onClick={() => setAlunoEmEdicao(null)} className="text-neutral-400 hover:text-white text-sm uppercase font-mono font-bold">Fechar ✕</button></header>
                            <form onSubmit={salvarTreinoPersonal} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

                                <div className="bg-[#0d0e12] p-4 rounded-xl border border-blue-500/20">
                                    <label className="text-[10px] uppercase font-bold text-blue-400 block mb-2">💧 Meta de Hidratação Diária (Calculada pela IA)</label>
                                    <input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-sm text-white font-bold" value={aguaForm} onChange={(e) => setAguaForm(e.target.value)} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 border-b border-neutral-800/60 pb-2">Estrutura de Exercícios Semanal</p>

                                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-neutral-800/40 mb-4">
                                        {DIAS_SEMANA.map(dia => (
                                            <button
                                                key={dia}
                                                type="button"
                                                onClick={() => setDiaAbaPersonal(dia)}
                                                className={`px-4 py-2 rounded-t-lg text-[10px] font-bold uppercase transition-all flex-shrink-0 ${diaAbaPersonal === dia
                                                    ? 'bg-neutral-800/50 border-b-2 border-emerald-500 text-emerald-500'
                                                    : 'text-neutral-500 hover:text-neutral-300'
                                                    }`}
                                            >
                                                {dia}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Treino de {diaAbaPersonal}</p>
                                        <button type="button" onClick={adicionarExercicioForm} className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-emerald-600/20 transition-all uppercase">+ Exercício</button>
                                    </div>

                                    <div className="space-y-3">
                                        {(() => {
                                            const diaObj = treinoForm.find(d => d.dia === diaAbaPersonal) || { exercicios: [] };
                                            if (diaObj.exercicios.length === 0) {
                                                return <p className="text-xs text-neutral-500 italic text-center py-4 bg-[#0d0e12] rounded-xl border border-neutral-800">Nenhum exercício cadastrado.</p>;
                                            }

                                            return diaObj.exercicios.map((ex, idx) => (
                                                <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl space-y-3 relative group">
                                                    <button type="button" onClick={() => removerExercicioForm(idx)} className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 text-[10px] uppercase font-mono tracking-wider transition-colors">Remover</button>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 sm:pt-0">
                                                        <div className="sm:col-span-1"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Movimento</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.nome} onChange={(e) => handleExercicioChange(idx, "nome", e.target.value)} /></div>
                                                        <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Séries</label><input required type="number" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.series} onChange={(e) => handleExercicioChange(idx, "series", Number(e.target.value))} /></div>
                                                        <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Repetições/Tempo</label><input required type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.reps} onChange={(e) => handleExercicioChange(idx, "reps", e.target.value)} /></div>
                                                    </div>
                                                    <div><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Observação</label><input type="text" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ex.obs || ""} onChange={(e) => handleExercicioChange(idx, "obs", e.target.value)} /></div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-800/60">
                                    <div className="flex justify-between items-center pb-2 border-b border-neutral-800/60 mb-3"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Planejamento Nutricional</p><button type="button" onClick={adicionarDietaForm} className="bg-blue-600/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-blue-600/20 transition-all uppercase">+ Refeição</button></div>
                                    <div className="space-y-3">
                                        {dietaForm.map((ref, idx) => (
                                            <div key={idx} className="bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl flex flex-col sm:flex-row gap-3 relative sm:items-center">
                                                <div className="w-full sm:w-1/3"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Horário/Refeição</label><input required type="text" placeholder="Ex: Almoço" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ref.refeicao} onChange={(e) => handleDietaChange(idx, "refeicao", e.target.value)} /></div>
                                                <div className="w-full sm:w-2/3"><label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Alimentos e Gramas</label><input required type="text" placeholder="Ex: 100g Frango" className="w-full bg-[#16171d] border border-neutral-800 p-2.5 rounded-lg text-xs outline-none text-white focus:border-neutral-700" value={ref.itens} onChange={(e) => handleDietaChange(idx, "itens", e.target.value)} /></div>
                                                <button type="button" onClick={() => removerDietaForm(idx)} className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 font-bold text-sm ml-1">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <footer className="pt-4 border-t border-neutral-800 flex gap-3 justify-end text-xs font-bold"><button type="button" onClick={() => setAlunoEmEdicao(null)} className="bg-transparent border border-neutral-800 text-neutral-400 p-3 rounded-xl uppercase tracking-wider hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl uppercase tracking-wider transition-colors shadow-lg px-6">Salvar e Enviar</button></footer>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DETALHES DO FEEDBACK (RPE E RESPOSTAS) */}
                {alunoVerFeedback && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAlunoVerFeedback(null)}>
                        <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-3xl p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setAlunoVerFeedback(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>

                            <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-xl">📋</div>
                                <div>
                                    <h3 className="font-bold text-white uppercase text-sm tracking-tight">Relatório de Treino</h3>
                                    <p className="text-[10px] text-emerald-500 font-mono uppercase">{alunoVerFeedback.nome}</p>
                                </div>
                            </div>

                            {alunoVerFeedback.checkins && alunoVerFeedback.checkins.length > 0 ? (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                    {alunoVerFeedback.checkins.slice(0, 3).map((checkin, index) => (
                                        <div key={index} className="bg-[#0d0e12] border border-neutral-800 p-4 rounded-xl">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold text-white uppercase">{checkin.data} - {checkin.diaSemana}</span>
                                                {index === 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Último</span>}
                                            </div>

                                            {checkin.feedback ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-[#16171d] p-2 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Intensidade</p>
                                                            <p className="text-xs text-white">{checkin.feedback.intensidade}</p>
                                                        </div>
                                                        <div className="bg-[#16171d] p-2 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Carga</p>
                                                            <p className="text-xs text-white">{checkin.feedback.carga}</p>
                                                        </div>
                                                    </div>
                                                    {checkin.feedback.comentario && (
                                                        <div className="bg-[#16171d] p-3 rounded-lg border border-neutral-800/50">
                                                            <p className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Observações do Aluno</p>
                                                            <p className="text-xs text-neutral-300 italic">"{checkin.feedback.comentario}"</p>
                                                        </div>
                                                    )}

                                                    {/* CAIXA DE RESPOSTA DO PERSONAL */}
                                                    {checkin.respostaPersonal ? (
                                                        <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20 mt-3">
                                                            <p className="text-[9px] text-emerald-500 font-bold uppercase mb-1">Sua Resposta</p>
                                                            <p className="text-xs text-neutral-300 italic">"{checkin.respostaPersonal}"</p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 flex gap-2">
                                                            <input type="text" placeholder="Responder feedback..." className="flex-1 bg-[#16171d] border border-neutral-800 p-2 rounded-lg text-xs outline-none text-white focus:border-neutral-700"
                                                                value={respostasFeedback[checkin.data] || ""}
                                                                onChange={e => setRespostasFeedback({ ...respostasFeedback, [checkin.data]: e.target.value })}
                                                            />
                                                            <button type="button" onClick={() => enviarRespostaFeedback(alunoVerFeedback.id || alunoVerFeedback._id, checkin.data)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 rounded-lg text-[10px] uppercase transition-colors">Responder</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-neutral-500 italic">Check-in simples (Sem feedback detalhado).</p>
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
                        <div className="w-full max-w-md bg-[#16171d] border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] relative text-center">
                            <button onClick={() => setModalPlanosPersonal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold">✕</button>

                            <span className="text-4xl block mb-2">🔒</span>
                            <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1">Limite do Teste Atingido</h3>
                            <p className="text-neutral-400 text-xs mb-6">Você já possui {alunosPersonal.length} alunos cadastrados. Ative a licença PRO para ter alunos ilimitados + Inteligência Artificial.</p>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <a href={KIWIFY_MENSAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border border-neutral-800 hover:border-emerald-500/50 p-5 rounded-2xl flex items-center justify-between transition-all group text-left">
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase">Plano Mensal Recorrente</p>
                                        <p className="text-[10px] text-neutral-500 mt-1">Cancele quando quiser</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-400">R$ 49,90</p>
                                        <p className="text-[9px] text-neutral-500 uppercase font-mono">/mês</p>
                                    </div>
                                </a>

                                <a href={KIWIFY_ANUAL} target="_blank" rel="noopener noreferrer" className="bg-[#0d0e12] border-2 border-emerald-500/30 hover:border-emerald-500 p-5 rounded-2xl flex items-center justify-between transition-all relative text-left group">
                                    <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">Melhor Custo-Benefício</span>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase">Plano Anual Elite</p>
                                        <p className="text-[10px] text-emerald-500 mt-1">Economize mais de 30%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-400">R$ 399,00</p>
                                        <p className="text-[9px] text-neutral-500 uppercase font-mono">Equivale a R$ 33,25/mês</p>
                                    </div>
                                </a>
                            </div>
                            <p className="text-[9px] text-neutral-500 uppercase font-mono">Liberação automática após o pagamento.</p>
                        </div>
                    </div>
                )}

                {/* ✅ AQUI RENDERIZA A AVALIAÇÃO NO PAINEL DO PERSONAL E DO ALUNO */}
                {alunoVerAvaliacao && renderModalAvaliacao(alunoVerAvaliacao, () => setAlunoVerAvaliacao(null))}

            </div>
        );
    }

    // ✅ PAINEL DO ALUNO AGORA ESTÁ FORA DO BLOCO DO PERSONAL!
    if (etapa === "aluno") {
        return (
            <div className="fixed inset-0 bg-[#0d0e12] text-neutral-200 flex flex-col p-6 overflow-y-auto font-sans z-40">
                <header className="w-full max-w-md mx-auto flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
                    <div>
                        <p className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider">Consultoria Privada Treino Fit</p>
                        <h2 className="text-md font-bold text-white uppercase tracking-tight">{alunoLogado?.nome}</h2>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Objetivo: {alunoLogado?.objetivo}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setModalAvaliacaoAluno(true)} className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1">
                            📋 Avaliação
                        </button>
                        <button type="button" onClick={() => { setEtapa("triagem"); setAlunoLogado(null); }} className="px-3 py-1.5 bg-red-500 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-neutral-50 transition-all duration-200 hover:bg-red-600 hover:scale-105 hover:cursor-pointer">
                            Sair
                        </button>
                    </div>
                </header>

                <main className="w-full max-w-md mx-auto flex-1 space-y-6 pb-10">
                    <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
                        <div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Check-ins Validados</p><h3 className="text-3xl font-bold text-white mt-1">{alunoLogado?.checkins?.length || 0}</h3></div>
                        <button type="button" onClick={iniciarCheckin} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg">Confirmar Treino Hoje</button>
                    </div>

                    {alunoLogado?.checkins?.[0]?.respostaPersonal && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl shadow-xl mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">💬 Mensagem do seu Treinador</p>
                            <p className="text-xs text-neutral-300 italic">"{alunoLogado.checkins[0].respostaPersonal}"</p>
                        </div>
                    )}


                    {alunoLogado?.metaAgua && (
                        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl shadow-xl flex flex-col mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">💧 Hidratação Inteligente</p>
                                    <h3 className="text-xl font-bold text-white mt-1">{alunoLogado.metaAgua}</h3>
                                </div>
                                <span className="text-3xl">🚰</span>
                            </div>

                            {/* Formulário Embutido para Configurar as Notificações */}
                            <div className="border-t border-blue-500/20 pt-3">
                                <p className="text-[10px] text-neutral-400 mb-2 uppercase font-bold">Configurar Alerta no WhatsApp</p>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div>
                                        <label className="text-[9px] text-neutral-500">Início (Hora)</label>
                                        <input type="number" min="0" max="23" className="w-full bg-[#16171d] border border-neutral-800 p-2 rounded text-xs text-white" value={configAgua.horaInicio} onChange={e => setConfigAgua({ ...configAgua, horaInicio: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-neutral-500">Fim (Hora)</label>
                                        <input type="number" min="0" max="23" className="w-full bg-[#16171d] border border-neutral-800 p-2 rounded text-xs text-white" value={configAgua.horaFim} onChange={e => setConfigAgua({ ...configAgua, horaFim: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-neutral-500">Intervalo (Hrs)</label>
                                        <select className="w-full bg-[#16171d] border border-neutral-800 p-2 rounded text-xs text-white" value={configAgua.intervaloHoras} onChange={e => setConfigAgua({ ...configAgua, intervaloHoras: e.target.value })}>
                                            <option value="1">1 em 1h</option>
                                            <option value="2">2 em 2h</option>
                                            <option value="3">3 em 3h</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={async () => {
                                    try {
                                        const id = alunoLogado.id || alunoLogado._id;
                                        const payload = { ...configAgua, ativo: true };
                                        const res = await fetch(`${API_URL}/aluno/${id}/agua`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });
                                        if (res.ok) alert("✅ Notificações de água ativadas! Calcularemos as doses automaticamente.");
                                    } catch {
                                        alert("Erro ao salvar.");
                                    }
                                }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-[10px] uppercase transition-colors">
                                    Ativar Automação IA
                                </button>
                            </div>
                        </div>
                    )}

                    {alunoLogado?.dietaPrescrita && alunoLogado.dietaPrescrita.length > 0 && (
                        <div className="bg-[#16171d] border border-neutral-800 p-5 rounded-xl shadow-xl space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">🍽️ Seu Plano Alimentar</p>
                            <div className="space-y-2">
                                {alunoLogado.dietaPrescrita.map((ref, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-neutral-850 p-3 rounded-lg">
                                        <p className="text-[11px] font-bold text-white tracking-tight uppercase mb-1">{ref.refeicao}</p>
                                        <p className="text-[10px] text-neutral-400">{ref.itens}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20 p-4 rounded-xl text-center">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">🛒 Facilite sua Dieta!</p>
                                <p className="text-[10px] text-neutral-300 mb-3">Peça as carnes, frutas e verduras do seu plano sem sair de casa.</p>
                                <a href="https://hortilife-praticidade.kyte.site/pt-BR" target="_blank" rel="noopener noreferrer" className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-lg">
                                    👉 Pedir na Hortilife
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Calendário de Treinos Semanal</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                            {DIAS_SEMANA.map((dia) => {
                                const diaAtualSistema = new Date().toLocaleDateString("pt-BR", { weekday: 'long' });
                                const ehHoje = diaAtualSistema.toLowerCase().includes(dia.toLowerCase().slice(0, 4));
                                const ativo = diaAbaAluno === dia;
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setDiaAbaAluno(dia)}
                                        className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all flex-shrink-0 border ${ativo
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                                            : ehHoje
                                                ? 'bg-neutral-900 border-blue-500/40 text-blue-400'
                                                : 'bg-[#16171d] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
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
                                    <div className="bg-[#16171d] border border-neutral-800 p-8 rounded-xl text-center shadow-xl">
                                        <p className="text-xs text-neutral-500 font-semibold uppercase font-mono">Nenhum treino para {diaAbaAluno}. Descanso! 🧘‍♂️</p>
                                    </div>
                                );
                            }

                            return rotinaDoDia.exercicios.map((ex, i) => {
                                const chaveUnicaExercicio = `${diaAbaAluno}-${i}`;
                                const estaconcluido = exerciciosConcluidos.includes(chaveUnicaExercicio);
                                const todasSeriesFeitas = Array.from({ length: ex.series || 0 }).every((_, sIdx) => seriesFeitas[`${diaAbaAluno}-${i}-s${sIdx + 1}`]);

                                return (
                                    <div key={i} className={`bg-[#16171d] border transition-all rounded-xl overflow-hidden shadow-xl ${estaconcluido || todasSeriesFeitas ? 'border-emerald-500/30 opacity-80' : 'border-neutral-800'}`}>
                                        <div className="p-5 flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className={`font-bold uppercase text-base tracking-tight text-white ${estaconcluido || todasSeriesFeitas ? 'text-emerald-400' : ''}`}>{ex.nome}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded">{ex.series} Séries × {ex.reps} Reps</span>
                                                    <button type="button" onClick={() => abrirExercicioVisual(ex, setModalGifAberto)} className="bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase border border-neutral-700">
                                                        ▶ Ver GIF
                                                    </button>
                                                </div>
                                                {ex.obs && <p className="text-xs text-neutral-400 mt-2 bg-[#0d0e12] border border-neutral-800 p-2 rounded-lg font-sans">📌 Obs: {ex.obs}</p>}
                                            </div>

                                            <button type="button" onClick={() => alternarConclusaoExercicio(chaveUnicaExercicio)} className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-xs transition-colors ${estaconcluido || todasSeriesFeitas ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-neutral-700 bg-transparent text-transparent hover:border-neutral-500'}`}>✓</button>
                                        </div>

                                        <div className="px-5 pb-5">
                                            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-neutral-800/50 mt-2">
                                                {Array.from({ length: ex.series || 0 }).map((_, sIdx) => {
                                                    const numSerie = sIdx + 1;
                                                    const chaveSerie = `${diaAbaAluno}-${i}-s${numSerie}`;
                                                    const isFeita = seriesFeitas[chaveSerie];

                                                    return (
                                                        <button
                                                            key={numSerie}
                                                            type="button"
                                                            onClick={() => marcarSerie(i, numSerie, ex.series)}
                                                            className={`py-2 rounded-lg flex flex-col items-center justify-center transition-all ${isFeita ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-[#0d0e12] border border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
                                                        >
                                                            <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5">Série {numSerie}</span>
                                                            <span className="text-sm font-black">{isFeita ? '✓' : '⬜'}</span>
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
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center gap-3 z-50 animate-bounce">
                            <span className="text-xl">⏱️</span>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold opacity-80 leading-none mb-0.5">Descanso</p>
                                <p className="text-lg font-black font-mono leading-none">{timerDescanso}s</p>
                            </div>
                            <button type="button" onClick={() => setTimerAtivo(false)} className="ml-2 bg-white/20 hover:bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors">✕</button>
                        </div>
                    )}

                    {modalGifAberto && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalGifAberto(null)}>
                            <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalGifAberto(null)} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors">✕</button>
                                <div className="p-4 bg-[#1c1d26] border-b border-neutral-800">
                                    <h3 className="font-bold text-white uppercase text-sm pr-8">{modalGifAberto.nome}</h3>
                                </div>
                                <div className="w-full bg-[#0d0e12] flex justify-center p-4 min-h-[200px] items-center">
                                    <img src={modalGifAberto.url} alt={modalGifAberto.nome} className="max-w-full rounded-lg shadow-lg border border-neutral-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {modalFeedbackAberto && (
                        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalFeedbackAberto(false)}>
                            <div className="w-full max-w-sm bg-[#16171d] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalFeedbackAberto(false)} className="absolute top-4 right-4 text-neutral-500 font-bold hover:text-white">✕</button>
                                <div className="text-center mb-6">
                                    <span className="text-4xl mb-2 block">🔥</span>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Treino Concluído!</h3>
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">Dê o feedback para seu treinador</p>
                                </div>

                                <form onSubmit={confirmarCheckinComFeedback} className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">Qual foi a Intensidade?</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Leve 🟢", "Moderado 🟡", "Intenso 🔴", "Extremo ☠️"].map(nivel => (
                                                <button key={nivel} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, intensidade: nivel })} className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${feedbackTreino.intensidade === nivel ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-[#0d0e12] border border-neutral-800 text-neutral-500'}`}>
                                                    {nivel.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">E os Pesos / Cargas?</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {["Pouca ⬇️", "Na medida ✅", "Pesado ⬆️"].map(peso => (
                                                <button key={peso} type="button" onClick={() => setFeedbackTreino({ ...feedbackTreino, carga: peso })} className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${feedbackTreino.carga === peso ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-[#0d0e12] border border-neutral-800 text-neutral-500'}`}>
                                                    {peso.split(" ")[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">Observações (Opcional)</label>
                                        <textarea
                                            placeholder="Observações de hoje..."
                                            className="w-full bg-[#0d0e12] border border-neutral-800 p-3 rounded-xl text-xs text-white outline-none h-20 resize-none"
                                            value={feedbackTreino.comentario}
                                            onChange={e => setFeedbackTreino({ ...feedbackTreino, comentario: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg mt-2">
                                        Enviar e Registrar Check-in
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 📸 NOVO MODAL: CARD DE COMPARTILHAMENTO DO INSTAGRAM */}
                    {modalShareAberto && dadosShare && (
                        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setModalShareAberto(false)}>
                            <div className="w-full max-w-[320px] bg-gradient-to-br from-neutral-900 to-[#0d0e12] border border-emerald-500/30 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setModalShareAberto(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold z-10">✕</button>

                                {/* O "Story" Card que o aluno vai printar/compartilhar */}
                                <div id="instagram-card" className="w-full aspect-[9/16] bg-gradient-to-b from-emerald-900/40 to-[#0d0e12] border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-between p-6 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>

                                    <div className="text-center w-full mt-4">
                                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">Treino Fit App</p>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">TREINO PAGO!</h3>
                                        <p className="text-xs text-neutral-400 mt-1">{dadosShare.data}</p>
                                    </div>

                                    <div className="w-full space-y-3 my-auto">
                                        <div className="bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-3 rounded-xl text-center">
                                            <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Foco de Hoje</p>
                                            <p className="text-sm font-bold text-white uppercase">{dadosShare.treino}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-3 rounded-xl text-center">
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Intensidade</p>
                                                <p className="text-xs font-bold text-white uppercase truncate">{dadosShare.intensidade.split(" ")[0]}</p>
                                            </div>
                                            <div className="flex-1 bg-[#16171d]/80 backdrop-blur-sm border border-neutral-700/50 p-3 rounded-xl text-center">
                                                <p className="text-[9px] uppercase text-neutral-500 font-bold mb-0.5">Carga</p>
                                                <p className="text-xs font-bold text-white uppercase truncate">{dadosShare.carga.split(" ")[0]}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full text-center mb-2">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-2 border-2 border-emerald-500 flex items-center justify-center text-lg">
                                            💪
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Treinador</p>
                                        <p className="text-xs font-bold text-emerald-400">{dadosShare.nomePersonal}</p>
                                    </div>
                                </div>

                                <button type="button" onClick={async () => {
                                    try {
                                        // 1. Pegamos o card na tela
                                        const cardElement = document.getElementById('instagram-card');
                                        if (!cardElement) return;

                                        // Usando html-to-image para evitar o erro do "oklch" (CSS moderno)
                                        const blob = await toBlob(cardElement, {
                                            backgroundColor: '#0d0e12',
                                            pixelRatio: 2 // Alta qualidade para o Instagram
                                        });

                                        if (!blob) return alert("Erro ao gerar imagem.");

                                        const file = new File([blob], 'meu-treino-treino-fit.png', { type: 'image/png' });

                                        // 4. Verificamos se o celular suporta compartilhar arquivos (Imagens)
                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            await navigator.share({
                                                files: [file], // AQUI ESTÁ A MÁGICA! Enviamos a imagem.
                                                title: 'Treino Concluído!',
                                                text: `Mais um treino pago! 💪 Treinador: ${dadosShare.nomePersonal}`
                                            });
                                        } else {
                                            // Fallback: Se o navegador (ex: PC desktop) não suporta compartilhar arquivos, baixa a imagem direto!
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
                                }} className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
                                    <span>📸 Compartilhar no Insta</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {modalAvaliacaoAluno && renderModalAvaliacao(alunoLogado, () => setModalAvaliacaoAluno(false))}

                </main>
            </div>
        );
    }

    return <div className="text-white text-center p-10 bg-[#0d0e12] min-h-screen">Layout carregando...</div>;
}

export default App;