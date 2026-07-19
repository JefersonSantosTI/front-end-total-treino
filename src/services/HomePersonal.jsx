import React, { useState } from 'react';
import { Users, Zap, LineChart, Smartphone, Share2, Dumbbell, ShieldCheck, ArrowRight, Activity, Utensils } from 'lucide-react';

export default function HomePersonal({ setEtapa }) {
    const [menuEntrarAberto, setMenuEntrarAberto] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden">

            {/* --- MOTOR DE ANIMAÇÃO VIVA --- */}
            <style>
                {`
                @keyframes float-glow {
                    0% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
                    100% { transform: translateY(0) scale(1); opacity: 0.3; }
                }
                .glow-orange { animation: float-glow 8s ease-in-out infinite; }
                .glow-red { animation: float-glow 10s ease-in-out infinite reverse; }
                `}
            </style>

            {/* HEADER FLUTUANTE */}
            <header className="sticky top-0 z-[60] bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">

                    {/* SUA LOGO AQUI */}
                    <img
                        src="/logo192.png"
                        alt="Logo Total Treino"
                        className="w-11 h-11 rounded-xl shadow-[0_0_15px_rgba(234,88,12,0.4)] object-cover"
                    />

                    <div className="text-xl md:text-2xl font-black italic text-white tracking-tight uppercase">
                        Total Treino <span className="text-xs text-orange-500 not-italic font-black tracking-widest bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md ml-1">PRO</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setEtapa("login_aluno")} className="text-zinc-400 hover:text-white font-bold text-xs md:text-sm transition-colors hidden md:block uppercase tracking-wider">
                        Portal do Aluno
                    </button>
                    <button onClick={() => setEtapa("login_personal")} className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs md:text-sm rounded-xl px-6 py-2.5 shadow-[0_0_20px_rgba(234,88,12,0.4)] border border-orange-400/50 transition-all uppercase tracking-wider active:scale-95 hidden md:flex items-center gap-2 hover:shadow-[0_0_30px_rgba(234,88,12,0.6)]">
                        Acessar Painel <ArrowRight size={16} />
                    </button>

                    {/* Menu Mobile */}
                    <button className="md:hidden text-white p-2" onClick={() => setMenuEntrarAberto(!menuEntrarAberto)}>
                        <div className="w-6 h-0.5 bg-white mb-1.5 rounded-full"></div>
                        <div className="w-6 h-0.5 bg-white mb-1.5 rounded-full"></div>
                        <div className="w-4 h-0.5 bg-white rounded-full"></div>
                    </button>
                </div>

                {menuEntrarAberto && (
                    <div className="absolute right-4 top-20 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[70] p-3 flex flex-col gap-2 md:hidden">
                        <button onClick={() => setEtapa("login_personal")} className="text-left px-4 py-3 text-sm font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl transition-all uppercase">
                            Acessar Painel PRO
                        </button>
                        <button onClick={() => setEtapa("login")} className="text-left px-4 py-3 text-sm font-black text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all uppercase">
                            Portal do Aluno
                        </button>
                    </div>
                )}
            </header>

            {/* HERO SECTION (O Impacto Inicial Hardcore) */}
            <section className="relative pt-24 pb-32 px-6 overflow-hidden flex items-center justify-center min-h-[80vh]">
                {/* Efeitos Atmosféricos */}
                <div className="absolute inset-0 bg-black z-0"></div>
                <div className="glow-orange absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
                <div className="glow-red absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950"></div>

                <div className="max-w-5xl mx-auto text-center relative z-20">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-inner">
                        <Zap size={14} /> Para Personal Trainers de Elite
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic leading-[1.1] tracking-tighter mb-8 drop-shadow-2xl">
                        Escale sua Consultoria.<br />
                        <span className="text-orange-500 drop-shadow-[0_0_30px_rgba(234,88,12,0.5)]">Domine o Mercado.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-12 leading-relaxed font-medium drop-shadow-md">
                        Esqueça planilhas amadoras e alunos sumindo no WhatsApp. A única plataforma de gestão com <strong className="text-white">Inteligência Artificial</strong> que monta treinos, calcula dobras, prescreve dietas e blinda a sua retenção.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button onClick={() => setEtapa("login_personal")} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-black px-12 py-5 rounded-full uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(234,88,12,0.4)] border-2 border-orange-400/50 hover:border-orange-400 active:scale-95 flex items-center justify-center gap-3">
                            <ShieldCheck size={20} /> Testar a Máquina
                        </button>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 1: O CRM DO PERSONAL (Radar de Retenção) */}
            <section className="py-24 px-6 bg-zinc-950 border-y border-white/5 relative z-20">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 relative">
                        {/* Mockup do CRM */}
                        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 shadow-2xl relative z-10 group hover:border-orange-500/30 transition-colors">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-white">Quartel General (CRM)</h3>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><p className="text-2xl font-black text-white">87</p><p className="text-[10px] uppercase font-bold text-zinc-500">Alunos Ativos</p></div>
                                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20"><p className="text-2xl font-black text-red-500">4</p><p className="text-[10px] uppercase font-bold text-red-500/70">Em Risco (Sumiram)</p></div>
                            </div>
                            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-sm text-white">João Pedro</p>
                                    <span className="bg-red-500/20 text-red-500 text-[10px] font-black uppercase px-2 py-1 rounded">🔴 Sumiu (9 dias)</span>
                                </div>
                                <button className="w-full bg-[#25D366]/20 text-[#25D366] text-[10px] font-black uppercase py-2 rounded-lg border border-[#25D366]/30 flex items-center justify-center gap-2 hover:bg-[#25D366]/30 transition-colors">
                                    Cobrar Presença no WhatsApp
                                </button>
                            </div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                    </div>

                    <div className="order-1 md:order-2">
                        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <LineChart className="text-red-500" size={28} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-6">Radar de Retenção.<br /><span className="text-zinc-500">Zere a evasão.</span></h2>
                        <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-6">
                            Seu maior inimigo é o aluno que perde a motivação e cancela a consultoria. O Total Treino vigia todos eles para você.
                        </p>
                        <ul className="space-y-4 text-sm font-bold text-zinc-300">
                            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-orange-500" /> Sistema acusa alunos há mais de 3 dias sem treinar.</li>
                            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-orange-500" /> Botão de "Cobrar Presença" integrado direto ao WhatsApp.</li>
                            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-orange-500" /> Link de Matrícula Automático (O aluno paga e cai no sistema).</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: IA E PRESCRIÇÃO */}
            <section className="py-24 px-6 relative bg-zinc-900 border-y border-zinc-800">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                            <Zap className="text-orange-500" size={28} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-6">Prescrição Implacável.<br /><span className="text-orange-500">A I.A. faz o trabalho duro.</span></h2>
                        <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-6">
                            Pare de perder noites montando fichas básicas do zero. A Inteligência Artificial do Total Treino PRO processa a biometria do aluno e constrói a estrutura perfeita em segundos. Você só revisa e assina.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 hover:border-orange-500/30 transition-colors">
                                <Activity className="text-orange-500 mb-2" size={24} />
                                <h4 className="font-black text-white text-sm uppercase">Cálculo de Dobras</h4>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Protocolo 7 Dobras 100% automático.</p>
                            </div>
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 hover:border-red-500/30 transition-colors">
                                <Utensils className="text-red-500 mb-2" size={24} />
                                <h4 className="font-black text-white text-sm uppercase">Base Alimentar</h4>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Cálculo de TMB e divisão de Macros.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Mockup da IA gerando o treino */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-orange-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(234,88,12,0.15)] relative z-10">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg text-[10px] font-mono font-black uppercase tracking-widest mb-4">
                                <Zap size={12} /> Gerado pela IA
                            </span>
                            <div className="space-y-4">
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                                    <div><p className="text-[10px] uppercase text-zinc-500 font-bold">Meta de Hidratação Diária</p><p className="text-white font-black text-lg">4.2 Litros</p></div>
                                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">💧</span>
                                </div>
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
                                    <p className="text-[10px] uppercase text-zinc-500 font-bold">Treino A - Pernas Foco Quadríceps</p>
                                    <div className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800/50"><p className="text-sm font-black text-white uppercase">Agachamento Livre</p><p className="text-xs font-mono font-bold text-orange-400">4x 10-12 Reps</p></div>
                                    <div className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800/50"><p className="text-sm font-black text-white uppercase">Leg Press 45º</p><p className="text-xs font-mono font-bold text-orange-400">4x Até a falha</p></div>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all">✓ Aprovar e Enviar Ficha</button>
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 3: O APP DO ALUNO & HORTILIFE */}
            <section className="py-24 px-6 bg-zinc-950 border-y border-white/5">
                <div className="max-w-6xl mx-auto text-center mb-16">
                    <Smartphone className="text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)]" size={40} />
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white">O App do seu Aluno.<br /><span className="text-zinc-600">Alta tecnologia na palma da mão.</span></h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center group hover:border-orange-500/50 transition-colors">
                        <div className="text-4xl mb-4 bg-zinc-950 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-orange-500/50 transition-all shadow-inner">🏋️‍♂️</div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">Execução Perfeita</h3>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">Cada exercício da ficha possui um botão "Ver GIF". Seu aluno não erra o movimento e nem te chama de madrugada com dúvidas básicas.</p>
                    </div>

                    {/* Feature 2 (Hortilife) */}
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center group hover:border-red-500/50 transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[50px] pointer-events-none"></div>
                        <div className="text-4xl mb-4 bg-zinc-950 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-red-500/50 transition-all shadow-inner relative z-10">🛒</div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3 relative z-10">Dieta + Hortilife</h3>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed relative z-10">Mais do que ver as calorias diárias, o app é integrado ao <strong className="text-red-500 uppercase tracking-widest text-xs">Hortilife</strong>. O aluno clica, e os alimentos da dieta chegam na porta dele.</p>
                    </div>

                    {/* Feature 3 (RPE) */}
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center group hover:border-amber-500/50 transition-colors">
                        <div className="text-4xl mb-4 bg-zinc-950 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-amber-500/50 transition-all shadow-inner">🔥</div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">Check-in de Esforço (RPE)</h3>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">O aluno registra a carga e a dificuldade (Fácil, Ideal ou Extremo). Você monitora pelo seu painel e sabe o momento exato de progredir o peso.</p>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 4: MARKETING VIRAL (Insta Share) */}
            <section className="py-24 px-6 relative bg-zinc-900 overflow-hidden">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-zinc-950 to-black border-2 border-orange-500/30 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-[0_20px_60px_rgba(234,88,12,0.15)] relative z-10">
                    <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-orange-600/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="flex-1 z-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/30 text-[10px] font-black uppercase tracking-widest mb-6">
                            <Share2 size={12} /> Máquina de Vendas
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white mb-6">Transforme Alunos em<br />Outdoors Ambulantes.</h2>
                        <p className="text-lg text-zinc-300 font-medium leading-relaxed mb-8">
                            Assim que o aluno finaliza o treino e o check-in de esforço, o app gera um <strong className="text-white">Card Exclusivo de "Missão Cumprida"</strong> assinado com o seu nome. Ele posta no Instagram, e a audiência dele vem até você.
                        </p>
                        <button onClick={() => setEtapa("login_personal")} className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-4 rounded-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-95 text-sm border border-orange-400/50">
                            Quero Multiplicar Alunos
                        </button>
                    </div>

                    {/* MOCKUP DO INSTAGRAM (Versão Hardcore) */}
                    <div className="w-[280px] bg-zinc-900 border-4 border-zinc-800 rounded-[2.5rem] p-4 shadow-2xl relative z-10 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="w-full aspect-[9/16] bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center rounded-[1.5rem] border border-orange-500/50 flex flex-col items-center justify-between p-6 relative overflow-hidden">
                            {/* Película escura sobre a foto de fundo */}
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

                            <div className="text-center w-full mt-4 relative z-10">
                                <p className="text-[9px] font-mono font-black text-white bg-orange-600 px-2 py-1 rounded border border-orange-400 uppercase tracking-widest mb-3 inline-block shadow-[0_0_10px_rgba(234,88,12,0.8)]">Total Treino App</p>
                                <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">TREINO<br /><span className="text-orange-500">PAGO!</span></h3>
                            </div>

                            <div className="w-full space-y-3 relative z-10">
                                <div className="bg-black/80 backdrop-blur-md border border-zinc-700 p-3 rounded-xl text-center shadow-lg">
                                    <p className="text-[9px] uppercase text-zinc-400 font-black mb-0.5 tracking-widest">Foco do Dia</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">Dorsal e Bíceps</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/80 backdrop-blur-md border border-red-500/50 p-3 rounded-xl text-center shadow-lg">
                                        <p className="text-[9px] uppercase text-zinc-400 font-black mb-0.5 tracking-widest">Esforço</p>
                                        <p className="text-sm font-black text-red-500 uppercase">Extremo</p>
                                    </div>
                                    <div className="flex-1 bg-black/80 backdrop-blur-md border border-orange-500/50 p-3 rounded-xl text-center shadow-lg">
                                        <p className="text-[9px] uppercase text-zinc-400 font-black mb-0.5 tracking-widest">Volume</p>
                                        <p className="text-sm font-black text-orange-400 uppercase">Alto</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full text-center mt-2 relative z-10">
                                <p className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-1 drop-shadow-md">Coach Responsável</p>
                                <p className="text-xs font-black text-zinc-900 bg-white rounded-full py-1.5 px-4 inline-block uppercase tracking-widest shadow-xl">Seu Nome Aqui</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="text-center py-12 bg-black border-t border-zinc-900 relative z-20">
                <div className="flex justify-center items-center gap-2 mb-6">
                    <Dumbbell size={24} className="text-orange-500" />
                    <span className="text-xl font-black italic text-white tracking-tight uppercase">Total Treino <span className="text-orange-500">PRO</span></span>
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                    &copy; 2026 Total Treino. Todos os direitos reservados.
                </p>
            </footer>
        </div>
    );
}

// Componente de CheckCircle adaptado para Laranja
function CheckCircle({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}