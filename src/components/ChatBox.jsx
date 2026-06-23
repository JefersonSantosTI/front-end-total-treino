import { useState } from "react"

const ChatBox = ({ onEnviarMensagem, desabilitado }) => {
    const [mensagem, setMensagem] = useState('')

    const handleSubmit = (event) => {
        if (event) event.preventDefault();
        if (!mensagem.trim() || desabilitado) return;

        onEnviarMensagem(mensagem)
        setMensagem('')
    }

    return (
        <div className="bg-transparent py-2 transition-all">
            <form className="flex gap-2 sm:gap-3 items-end" onSubmit={handleSubmit}>
                <textarea
                    rows={1}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder={desabilitado ? "FAÇA O UPGRADE PARA CONTINUAR 🔒" : "Pergunte sobre treino ou dieta..."}
                    disabled={desabilitado}
                    className={`flex-1 px-5 py-4 rounded-[1.5rem] outline-none text-base font-bold transition-all border resize-none min-h-[52px] max-h-[150px]
                        ${desabilitado
                            ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                            : 'bg-gray-900 border-gray-800 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400'
                        }`}
                />

                <button
                    type="submit"
                    disabled={desabilitado || !mensagem.trim()}
                    className={`h-[52px] px-6 rounded-[2rem] shadow-lg transition-all font-black uppercase text-xs tracking-widest flex-shrink-0
                        ${desabilitado
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-500 text-black hover:scale-105 active:scale-95 shadow-emerald-500/10'
                        }`}
                >
                    {desabilitado ? "🔒" : "Enviar"}
                </button>
            </form>
        </div>
    )
}

export default ChatBox