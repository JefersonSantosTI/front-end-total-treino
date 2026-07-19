import React from 'react';
import { Shield, TrendingUp, Users, ArrowRight } from 'lucide-react';

export default function HomePersonal({ setEtapa }) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">

            <header className="py-24 px-6 text-center bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
                {/* Overlay escuro para dar leitura */}
                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"></div>

                <div className="relative z-10 max-w-4xl mx-auto">
                    <p className="text-orange-500 font-black tracking-[0.3em] uppercase text-sm mb-4">Total Treino Pro</p>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter leading-tight">
                        Escale sua consultoria <br className="hidden md:block" /> com Inteligência Artificial
                    </h1>
                    <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto font-medium">
                        Pare de perder horas montando planilhas. Use a tecnologia do Total Treino para prescrever treinos e dietas em segundos e atenda 10x mais alunos.
                    </p>
                    <button
                        onClick={() => setEtapa('login_personal')}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-lg py-5 px-10 rounded-xl shadow-[0_10px_30px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center gap-2 mx-auto active:scale-95 border-2 border-orange-400/50"
                    >
                        Acessar Painel do Coach
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            <section className="py-20 px-6 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 hover:border-orange-500/50 transition-colors">
                        <Users className="text-orange-500 mb-6" size={40} />
                        <h3 className="text-xl font-black uppercase mb-3">Gestão de Alunos</h3>
                        <p className="text-zinc-400 font-medium">Controle pagamentos, veja quem não está treinando e acompanhe a evolução de peso e medidas em um só lugar.</p>
                    </div>
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 hover:border-orange-500/50 transition-colors">
                        <Shield className="text-orange-500 mb-6" size={40} />
                        <h3 className="text-xl font-black uppercase mb-3">Prescrição Blindada</h3>
                        <p className="text-zinc-400 font-medium">A IA gera o esqueleto do treino e a base da dieta. Você só aprova e envia para o aplicativo do seu aluno.</p>
                    </div>
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 hover:border-orange-500/50 transition-colors">
                        <TrendingUp className="text-orange-500 mb-6" size={40} />
                        <h3 className="text-xl font-black uppercase mb-3">Retenção Máxima</h3>
                        <p className="text-zinc-400 font-medium">App próprio com cronômetro, vídeos explicativos e gamificação. Seu aluno nunca mais abandona a consultoria.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}