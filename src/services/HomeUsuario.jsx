import React from 'react';
import { Bot, Apple, MessageCircle, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomeUsuario({ setEtapa }) {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">

            {/* HERO SECTION TOTAL TREINO */}
            <header className="bg-gradient-to-b from-zinc-950 to-zinc-900 text-white py-20 px-6 text-center rounded-b-[3rem] shadow-xl border-b-4 border-orange-500">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-sm font-black tracking-widest uppercase mb-6">
                        <Zap size={16} className="text-orange-500" />
                        <span>O App Oficial do Total Treino</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight uppercase italic tracking-tighter">
                        Chegue no seu limite <br className="hidden md:block" /> e deixe a IA fazer o resto.
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-medium">
                        O sistema Inteligente do Total Treino mapeia seu corpo e cria a rotina de exercícios e alimentação perfeita para você secar ou crescer.
                    </p>
                    <button
                        onClick={() => setEtapa('login')}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-lg py-5 px-10 rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center gap-2 mx-auto w-full md:w-auto active:scale-95"
                    >
                        Iniciar Minha Evolução
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* RECURSOS DA IA */}
            <section className="bg-zinc-100 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black mb-16 text-center uppercase tracking-tight text-zinc-900">Tecnologia a favor do seu corpo</h2>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg border-b-4 border-orange-500">
                            <div className="bg-orange-500/10 p-6 rounded-2xl text-orange-600 mb-6">
                                <Bot size={48} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 text-zinc-900">Treinos Modulares</h3>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                Fichas de treino que se adaptam à sua força e ao seu tempo. Inteligência Artificial calculando cada série.
                            </p>
                        </div>

                        <div className="text-center flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg border-b-4 border-orange-500">
                            <div className="bg-orange-500/10 p-6 rounded-2xl text-orange-600 mb-6">
                                <Apple size={48} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 text-zinc-900">Dieta Calculada</h3>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                Calorias e macronutrientes batidos com precisão. O Total Treino diz o que comer para você não errar.
                            </p>
                        </div>

                        <div className="text-center flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg border-b-4 border-orange-500">
                            <div className="bg-orange-500/10 p-6 rounded-2xl text-orange-600 mb-6">
                                <MessageCircle size={48} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 text-zinc-900">Suporte 24/7</h3>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                Consultoria na palma da mão. Converse com nosso bot especializado a qualquer momento do dia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <section className="bg-zinc-950 py-20 px-6 text-center text-white">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Pronto para o próximo nível?</h2>
                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-sm">
                        <CheckCircle2 className="text-orange-500" size={20} /> Acesso Instantâneo
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-sm">
                        <CheckCircle2 className="text-orange-500" size={20} /> Metodologia Comprovada
                    </div>
                </div>
                <button
                    onClick={() => setEtapa('login')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-lg py-5 px-12 rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.3)] transition-all active:scale-95"
                >
                    Entrar no Total Treino
                </button>
            </section>
        </div>
    );
}