# Simulador de Consórcio — PortoBank

App React (Vite) com suporte a PWA — pode ser instalado como app de computador direto pelo Chrome/Edge, sem passar por loja de aplicativos.

## Publicar sem usar terminal (100% pelo navegador)

1. **GitHub**: crie um repositório novo em github.com/new e arraste esta pasta (sem a `node_modules`, que nem existe ainda) para a página de upload do repositório vazio.
2. **Vercel**: entre em vercel.com, "Add New Project", conecte sua conta GitHub e selecione este repositório. A Vercel detecta o Vite sozinha e builda na nuvem — não precisa rodar nada no seu computador.
3. Depois do deploy, abra a URL gerada no Chrome. Vai aparecer um ícone de instalar na barra de endereço (ou menu ⋮ → "Instalar app"). Isso cria um app de verdade, com ícone próprio, que abre em janela separada.
4. Para editar depois, use o editor do próprio GitHub no navegador: abra o repositório e aperte a tecla `.` (ponto) — abre um VS Code completo direto no navegador (github.dev). Qualquer commit novo faz a Vercel republicar sozinha.

## Rodando localmente (caso um dia tenha um ambiente Node)

```
npm install
npm run dev
```
