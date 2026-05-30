// src/utils/visual.js
export const abrirExercicioVisual = (ex, setModalGifAberto) => {
    const nomeLimpo = ex.nome.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, '-');
  
    const urlGif = `/exercicios/${nomeLimpo}.gif`;
    
    if (ex.videoUrl && ex.videoUrl.trim() !== "") {
      window.open(ex.videoUrl, '_blank');
      return;
    }
  
    const img = new Image();
    img.src = urlGif;
    img.onload = () => setModalGifAberto({ nome: ex.nome, url: urlGif });
    img.onerror = () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nome)}+shorts+execução`, '_blank');
  };