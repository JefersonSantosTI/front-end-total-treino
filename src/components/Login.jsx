import { useState } from "react";

export default function Login({ aoLogar, aoVoltar }) { // <-- ATENÇÃO AQUI: Adicione aoVoltar
    const [whatsapp, setWhatsapp] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (whatsapp.length < 10) {
            alert("Por favor, digite um WhatsApp válido.");
            return;
        }
        localStorage.setItem("usuario_whatsapp", whatsapp);
        aoLogar(whatsapp);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-green-500/30">
                <h1 className="text-3xl font-bold mb-6 text-center text-green-500">🦾 Treino Fit</h1>
                <p className="text-gray-400 mb-6 text-center">Digite seu WhatsApp para acessar sua consultoria personalizada.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Ex: 61992956621"
                        className="p-4 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 outline-none text-xl"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-500 transition-colors p-4 rounded-lg font-bold text-xl"
                    >
                        Entrar no Treino
                    </button>
                    {/* ✅ BOTÃO VOLTAR ADICIONADO AQUI NO LOGIN.JS */}
                    <button
                        type="button"
                        onClick={aoVoltar}
                        className="bg-transparent border border-gray-600 hover:bg-gray-700 text-gray-400 transition-colors p-4 rounded-lg font-bold text-xl"
                    >
                        Voltar
                    </button>
                </form>
            </div>
        </div>
    );
}