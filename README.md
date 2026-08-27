# Simulador de Consórcio — PortoBank

App React (Vite) com suporte a PWA — pode ser instalado como app de computador direto pelo Chrome/Edge, sem passar por loja de aplicativos.

## Publicar sem usar terminal (100% pelo navegador)

1. **GitHub**: crie um repositório novo em github.com/new e arraste esta pasta (sem a `node_modules`, que nem existe ainda) para a página de upload do repositório vazio.
2. **Vercel**: entre em vercel.com, "Add New Project", conecte sua conta GitHub e selecione este repositório. A Vercel detecta o Vite sozinha e builda na nuvem — não precisa rodar nada no seu computador.
3. Depois do deploy, abra a URL gerada no Chrome. Vai aparecer um ícone de instalar na barra de endereço (ou menu ⋮ → "Instalar app"). Isso cria um app de verdade, com ícone próprio, que abre em janela separada.
4. Para editar depois, use o editor do próprio GitHub no navegador: abra o repositório e aperte a tecla `.` (ponto) — abre um VS Code completo direto no navegador (github.dev). Qualquer commit novo faz a Vercel republicar sozinha.

## Banco de dados na nuvem (Firebase) — pra consultar simulações de qualquer aparelho

Sem isso, as simulações salvas ficam só no navegador de cada aparelho (localStorage). Com o Firebase configurado, elas ficam num banco de verdade, acessíveis do celular, de outro computador, etc.

1. Vá em **console.firebase.google.com**, entre com uma conta Google e clique em "Adicionar projeto" (dê um nome, ex.: `portobank-consorcio`; pode desativar o Google Analytics, não é necessário).
2. No menu lateral, vá em **Build → Firestore Database** → "Criar banco de dados". Escolha o modo **produção** e a região mais próxima (ex.: `southamerica-east1`).
3. Ainda no Firestore, vá na aba **Regras (Rules)**, apague o conteúdo padrão, cole o conteúdo do arquivo `firestore.rules` (está nesta pasta) e clique em **Publicar**.
4. Volte pra tela inicial do projeto (ícone de engrenagem → "Configurações do projeto"), role até "Seus apps" e clique no ícone **`</>`** (Web) para registrar um app web. Dê um apelido qualquer e clique em "Registrar app".
5. O Firebase mostra um bloco de código com `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId` — copie esses 6 valores.
6. No seu projeto na **Vercel**: Settings → Environment Variables. Crie as 6 variáveis (nomes no arquivo `.env.example` desta pasta), uma pra cada valor copiado:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
7. Vá em **Deployments**, nos três pontinhos do último deploy → **Redeploy** (as variáveis novas só entram em vigor num novo build).
8. Pronto — o app detecta as variáveis sozinho. No painel "Simulações Salvas" vai aparecer uma etiqueta **"Nuvem"** em vez de **"Só este navegador"**, confirmando que está sincronizando.

Sem essas variáveis configuradas, o app continua funcionando normalmente, só que salvando localmente (comportamento atual).

## Rodando localmente (caso um dia tenha um ambiente Node)

```
npm install
npm run dev
```
