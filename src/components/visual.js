// src/utils/visual.js
export const abrirExercicioVisual = async (ex, setModalGifAberto) => {
  const nomeLimpo = ex.nome.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-');

  const urlVideoMp4 = `/videos/${nomeLimpo}.mp4`;
  const urlVideoMp4_2 = `/videos/${nomeLimpo}-2.mp4`; // 👉 O React vai caçar esse segundo arquivo!
  const urlGif = `/exercicios/${nomeLimpo}.gif`;

  // 1. TENTA O VÍDEO MP4 PRIMEIRO
  try {
      const checkVideo = await fetch(urlVideoMp4, { method: 'HEAD' });
      if (checkVideo.ok) {
          
          // Achou o vídeo 1! Agora vamos ver se você baixou um segundo ângulo:
          let segundoVideo = null;
          try {
              const checkVideo2 = await fetch(urlVideoMp4_2, { method: 'HEAD' });
              if (checkVideo2.ok) {
                  segundoVideo = urlVideoMp4_2; // Achou o vídeo 2!
              }
          } catch {
              // Comentário para o ESLint não reclamar de bloco vazio:
              // Se não achar o vídeo 2, ignoramos o erro silenciosamente.
          }

          // Manda para o Modal!
          setModalGifAberto({ 
              nome: ex.nome, 
              url: urlVideoMp4, 
              url2: segundoVideo // Envia a url2 (pode estar vazia se só tiver 1 vídeo)
          });
          return;
      }
  } catch {
      // Removemos a palavra "error" daqui para o ESLint não reclamar
      console.log("Tentando fallback para GIF...");
  }

  // 2. SE NÃO ACHOU O MP4, TENTA O GIF ANTIGO
  const img = new Image();
  img.src = urlGif;
  
  img.onload = () => setModalGifAberto({ nome: ex.nome, url: urlGif });
  
  // 3. SE NÃO ACHOU NEM O MP4 E NEM O GIF, VAI PRO YOUTUBE
  img.onerror = () => {
      if (ex.videoUrl && ex.videoUrl.trim() !== "") {
          window.open(ex.videoUrl, '_blank');
      } else {
          window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nome)}+shorts+execução`, '_blank');
      }
  };
};