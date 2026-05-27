import axios from "axios"

export const api = axios.create({
  // Adicionamos o /api no final da URL base
  baseURL: "https://api.treinofit.app.br"
})