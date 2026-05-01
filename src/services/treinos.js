export const PROTOCOLOS_TREINO = {
  academia: {
    titulo: "Foco Academia",
    cor: "blue",
    grupos: [
      {
        id: "abc_a",
        nome: "Treino A: Peito / Ombro / Tríceps",
        icone: "🔱",
        exercicios: [
          { id: "a1", nome: "Supino Reto", series: 4, reps: 10, cargaPadrao: 20, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-reto.gif" },
          { id: "a2", nome: "Supino Inclinado Halter", series: 3, reps: 12, cargaPadrao: 12, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-inclinado-com-halteres.gif" },
          { id: "a3", nome: "Peck Deck (Voador)", series: 3, reps: 15, cargaPadrao: 30, gif: "https://gymvisual.com/img/p/5/7/4/0/5740.gif" },
          { id: "a4", nome: "Desenvolvimento Ombro", series: 3, reps: 10, cargaPadrao: 10, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/desenvolvimento-para-ombros-com-halteres.gif" },
          { id: "a5", nome: "Elevação Lateral", series: 4, reps: 12, cargaPadrao: 6, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/ombros-elevacao-lateral-de-ombros-com-halteres.gif" },
          { id: "a6", nome: "Tríceps Corda", series: 4, reps: 12, cargaPadrao: 15, gif: "https://i.pinimg.com/originals/15/6b/79/156b79c6e5418472dc05fd4bc161cd16.gif" }
        ]
      },
      {
        id: "abc_b",
        nome: "Treino B: Costas / Bíceps",
        icone: "🦅",
        exercicios: [
          { id: "b1", nome: "Puxada Pulley", series: 4, reps: 12, cargaPadrao: 35, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-puxada-atras-no-pulley-alto.gif" },
          { id: "b2", nome: "Remada Curvada", series: 3, reps: 10, cargaPadrao: 15, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-remada-curvada-com-barra.gif" },
          { id: "b3", nome: "Rosca Direta Barra W", series: 4, reps: 12, cargaPadrao: 8, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-direta-com-barra-w.gif" },
          { id: "b4", nome: "Rosca Martelo", series: 3, reps: 12, cargaPadrao: 10, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/biceps-rosca-martelo-com-halteres.gif" }
        ]
      },
      {
        id: "abc_c",
        nome: "Treino C: Pernas Completo",
        icone: "🦵",
        exercicios: [
          { id: "c1", nome: "Leg Press 45", series: 4, reps: 12, cargaPadrao: 80, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-leg-press-45-graus.gif" },
          { id: "c2", nome: "Cadeira Extensora", series: 3, reps: 15, cargaPadrao: 25, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-extensao-de-pernas.gif" },
          { id: "c3", nome: "Mesa Flexora", series: 3, reps: 12, cargaPadrao: 20, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-flexao-de-pernas-na-mesa-flexora.gif" },
          { id: "c4", nome: "Panturrilha Sentado", series: 4, reps: 20, cargaPadrao: 30, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/panturrilhas-elevacao-de-gemeos-sentado.gif" }
        ]
      }
    ]
  },
  casa: {
    titulo: "Treino em Casa",
    cor: "emerald",
    grupos: [
      {
        id: "circuito_queima",
        nome: "Circuito Queima Total",
        icone: "⏱️",
        exercicios: [
          { id: "cq1", nome: "Agachamento Livre", series: 4, reps: 20, cargaPadrao: 0, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/11/agachamento-livre.gif" },
          { id: "cq2", nome: "Flexão de Braços", series: 3, reps: 12, cargaPadrao: 0, gif: "https://i.pinimg.com/originals/92/6e/c5/926ec5127683c2779b7f5cc627cf75e0.gif" },
          { id: "cq3", nome: "Afundo", series: 3, reps: 12, cargaPadrao: 0, gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-afundo-ou-passada-com-halteres.gif" },
          { id: "cq4", nome: "Polichinelos", series: 4, reps: 40, cargaPadrao: 0, gif: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJid3R3bmZ3bmZ3bmZ3/3o7TKVUn7iM8FMEU24/giphy.gif" }
        ]
      }
    ]
  }

  
};