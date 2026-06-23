import { useEffect, useRef } from "react"
import Mensagem from "./Mensagem"

const ListaMessagens = ({ mensagens, loading }) => {
    const mensagemRef = useRef(null)

    const scrollbaixo = () => {
        mensagemRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollbaixo()
    }, [mensagens, loading])

    return (
        <div className="flex flex-col space-y-6 w-full font-bold">
            {mensagens.map((mensagem) => (
                <Mensagem key={mensagem.id} mensagem={mensagem} />
            ))}

            {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-900/80 border border-gray-800 px-5 py-4 rounded-3xl rounded-bl-none shadow-lg">
                        <div className="flex space-x-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mensagemRef} className="h-2"></div>
        </div>
    )
}

export default ListaMessagens;