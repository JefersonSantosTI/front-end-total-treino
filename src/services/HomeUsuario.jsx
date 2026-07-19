import React from 'react';
import { Bot, Apple, MessageCircle, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomeUsuario({ setEtapa }) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500 selection:text-white">

            {/* 1. HERO SECTION (O topo de impacto - Versão Dark/Laranja) */}
            <header className="bg-gradient-to-b from-black to-zinc-950 text-white py-24 px-6 text-center border-b border-zinc-800/50 relative overflow-hidden">
                {/* Efeito de luz laranja de fundo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-black tracking-widest uppercase mb-6 shadow-inner">
                        <Zap size={16} className="text-orange-500" />
                        <span>O Futuro do Seu Corpo Começa Aqui</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight uppercase italic tracking-tighter drop-shadow-lg">
                        Ultrapasse seus limites. <br className="hidden md:block" /> A I.A. traça o caminho.
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-medium">
                        O algoritmo avançado do Total Treino mapeia seu biotipo e constrói uma rotina de força e nutrição milimetricamente calculada para você evoluir mais rápido.
                    </p>
                    <button
                        onClick={() => setEtapa('login')}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-lg py-5 px-10 rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.3)] transition-all flex items-center justify-center gap-3 mx-auto w-full md:w-auto active:scale-95 border-2 border-orange-400/50 hover:border-orange-400"
                    >
                        Iniciar Minha Evolução
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* 2. PROVA SOCIAL (Resultados Reais - 3 Cards Premium) */}
            <section className="py-24 px-6 max-w-6xl mx-auto relative z-10 bg-zinc-950">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">A Máquina Funciona</h2>
                    <p className="text-zinc-400 text-lg font-medium">Veja quem já aplicou o método da nossa Inteligência Artificial.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Card 1 - Lucas */}
                    <div className="bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-2">
                        <div className="flex gap-2 mb-5 h-64 relative overflow-hidden rounded-2xl border border-zinc-800/50 group-hover:border-orange-500/30">
                            {/* A sua imagem de montagem entra aqui */}
                            <img src="/lucas-transformacao.jpg" alt="Evolução Lucas" className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>

                            {/* Etiquetas Flutuantes */}
                            <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-zinc-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-zinc-700 shadow-lg">Antes</div>
                            <div className="absolute top-3 right-3 bg-orange-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-orange-500 shadow-lg shadow-orange-500/20">Depois</div>
                        </div>
                        <h3 className="font-black text-2xl mb-1 text-white uppercase italic tracking-tight">Lucas M.</h3>
                        <p className="text-xs text-orange-500 font-black mb-4 uppercase tracking-widest bg-orange-500/10 inline-block px-3 py-1 rounded-lg border border-orange-500/20">-8kg de Gordura</p>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">"O cálculo de macros da IA foi cirúrgico. Pela primeira vez consegui secar mantendo a massa magra sem passar fome."</p>
                    </div>

                    {/* Card 2 - Mariana */}
                    <div className="bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-2">
                        <div className="flex gap-2 mb-5 h-64 relative overflow-hidden rounded-2xl border border-zinc-800/50 group-hover:border-orange-500/30">
                            {/* A sua imagem de montagem entra aqui */}
                            <img src="/mariana-transformacao.jpg" alt="Evolução Mariana" className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>

                            {/* Etiquetas Flutuantes */}
                            <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-zinc-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-zinc-700 shadow-lg">Antes</div>
                            <div className="absolute top-3 right-3 bg-orange-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-orange-500 shadow-lg shadow-orange-500/20">Depois</div>
                        </div>
                        <h3 className="font-black text-2xl mb-1 text-white uppercase italic tracking-tight">Mariana S.</h3>
                        <p className="text-xs text-orange-500 font-black mb-4 uppercase tracking-widest bg-orange-500/10 inline-block px-3 py-1 rounded-lg border border-orange-500/20">Hipertrofia Limpa</p>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">"Meu platô acabou na segunda semana. A progressão de carga que o app sugere faz toda a diferença nos treinos."</p>
                    </div>

                    {/* Card 3 - Lais */}
                    <div className="bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-2">
                        <div className="flex gap-2 mb-5 h-64 relative overflow-hidden rounded-2xl border border-zinc-800/50 group-hover:border-orange-500/30">
                            {/* A sua imagem de montagem entra aqui */}
                            <img src="/lais-transformacao.jpg" alt="Evolução Lais" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>

                            {/* Etiquetas Flutuantes */}

                        </div>
                        <h3 className="font-black text-2xl mb-1 text-white uppercase italic tracking-tight">Lais T.</h3>
                        <p className="text-xs text-orange-500 font-black mb-4 uppercase tracking-widest bg-orange-500/10 inline-block px-3 py-1 rounded-lg border border-orange-500/20">Treino Adaptado</p>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">"Eu só tinha halteres em casa. A Inteligência Artificial adaptou minha ficha inteira e o resultado veio igual!"</p>
                    </div>

                </div>
            </section>

            {/* 3. RECURSOS DA IA */}
            <section className="bg-zinc-900 py-24 px-6 border-y border-zinc-800/50 relative">
                <div className="max-w-6xl mx-auto relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black mb-16 text-center uppercase tracking-tight text-white">Sua Central de Performance</h2>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center flex flex-col items-center">
                            <div className="bg-orange-500/10 p-6 rounded-3xl text-orange-500 border border-orange-500/20 mb-6 shadow-inner">
                                <Bot size={48} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Treino Hardcore</h3>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                                Sem fichas de gaveta. O sistema cria sua rotina baseada no seu nível de experiência, frequência e histórico de lesões.
                            </p>
                        </div>

                        <div className="text-center flex flex-col items-center">
                            <div className="bg-orange-500/10 p-6 rounded-3xl text-orange-500 border border-orange-500/20 mb-6 shadow-inner">
                                <Apple size={48} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Nutrição Calculada</h3>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                                Saiba exatamente quanto de proteína, carbo e gordura você precisa por dia. A IA sugere os pratos para bater a meta.
                            </p>
                        </div>

                        <div className="text-center flex flex-col items-center">
                            <div className="bg-orange-500/10 p-6 rounded-3xl text-orange-500 border border-orange-500/20 mb-6 shadow-inner">
                                <MessageCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">Coach Virtual 24h</h3>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                                Teve dúvida na execução ou no que comer? Nosso chat interativo integrado está sempre pronto para te guiar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER E CHAMADA FINAL */}
            <section className="py-24 px-6 text-center bg-zinc-950">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-8">Chegou a hora de mudar o shape.</h2>
                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider text-sm">
                        <CheckCircle2 className="text-orange-500" size={24} /> Sem falsas promessas
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider text-sm">
                        <CheckCircle2 className="text-orange-500" size={24} /> App liberado na hora
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider text-sm">
                        <CheckCircle2 className="text-orange-500" size={24} /> Controle total
                    </div>
                </div>
                <button
                    onClick={() => setEtapa('login')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-lg py-5 px-12 rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.3)] border-2 border-orange-400/50 transition-all active:scale-95"
                >
                    Criar Minha Conta Agora
                </button>
            </section>

            <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm font-bold uppercase tracking-widest bg-black">
                <p>© 2026 Total Treino. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}