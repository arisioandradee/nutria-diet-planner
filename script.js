const form = document.querySelector('form');

const API_KEY = 'SUA CHAVE';

const perguntarIA = async ({ nome, idade, altura, peso, objetivo }) => {
    const model = 'gemini-1.5-flash';
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const pergunta = `
        Você é um nutricionista digital.
        Gere uma dieta semanal personalizada para o usuário abaixo, sem saudações ou comentários extras.

        Nome: ${nome}
        Idade: ${idade}
        Altura: ${altura} cm
        Peso: ${peso} kg
        Objetivo: ${objetivo}

        Organize a dieta com café da manhã, almoço, lanche da tarde e jantar, de segunda a domingo.
        Seja clara e objetiva, listando apenas os dias da semana e as sugestões de refeições equilibradas.
    `;

    const contents = [{
        role: "user",
        parts: [{ text: pergunta }]
    }];

    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });

    const data = await response.json();
    console.log(data);
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro: Resposta inválida da IA';
};

async function gerarPDF(nome, textoIA) {
    if (typeof html2pdf === 'undefined') {
        alert('Erro: Bibliotecas necessárias não carregadas.');
        return;
    }

    const resultado = document.getElementById('resultado');

    const isHTML = textoIA.trim().startsWith('<');

    let htmlFinal;

    if (isHTML) {
        htmlFinal = textoIA;
    } else {
        // Converte Markdown para HTML usando showdown
        const converter = new showdown.Converter();
        htmlFinal = converter.makeHtml(textoIA);
    }

    resultado.innerHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: black; background: white; padding: 10px; border-radius: 8px;">
            <h2 style="text-align: center; color: black; margin-bottom: 20px;">Plano alimentar de ${nome}</h2>
            ${htmlFinal}
        </div>
    `;

    resultado.style.display = 'block';
    resultado.style.background = '#fff';
    resultado.style.color = '#000';

    await new Promise(requestAnimationFrame);

    try {
        await html2pdf()
            .set({
                margin: 10,
                filename: `plano_nutria_${nome}.pdf`,
                html2canvas: { scale: 2, logging: false, dpi: 192 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            })
            .from(resultado)
            .save();

        resultado.style.display = 'none';
    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        alert('Ocorreu um erro ao gerar o PDF. Veja o console.');
    }
}

const sendForm = async (event) => {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const idade = document.getElementById('idade').value.trim();
    const altura = document.getElementById('altura').value.trim();
    const peso = document.getElementById('peso').value.trim();
    const objetivo = document.getElementById('objetivo').value.trim();

    if (!nome || !idade || !altura || !peso || !objetivo) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    button.textContent = 'Gerando plano...';

    try {
        const respostaIA = await perguntarIA({ nome, idade, altura, peso, objetivo });

        alert("Plano gerado com sucesso! O download será iniciado.");

        // Gera PDF com o texto retornado da IA
        await gerarPDF(nome, respostaIA);
    } catch (error) {
        console.error('Erro ao gerar plano:', error);
        alert('Ocorreu um erro. Verifique sua chave da API ou tente novamente.');
    } finally {
        button.disabled = false;
        button.textContent = 'Gerar plano';
    }
};

form.addEventListener('submit', sendForm);