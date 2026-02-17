🎵 ResenJS

ResenJS é um sistema simples e rápido para criar salas de música sincronizada, onde várias pessoas podem ouvir músicas do YouTube ao mesmo tempo. Cada sala possui sua própria playlist, player e controle em tempo real — tudo via Socket.IO.

# link pra download:
https://github.com/aceleradox/ResenJS/raw/refs/heads/main/ResenJS.zip

# caso queira iniciar no modo janela, baixe essa addon e coloque na pasta rais do app resenJS/ e execulte o startx.bat
https://github.com/aceleradox/ResenJS/raw/refs/heads/main/ResenJS%20%20%20Gui%20Addon.rar

✨ Recursos

🔊 Player sincronizado para todos na sala

➕ Adição de músicas com aprovação manual

❌ Remoção de itens da playlist

📂 Playlists salvas automaticamente em disco

🎧 Salas independentes e ilimitadas

⚡ Interface leve em HTML/CSS/JS

🚀 Como usar

Instale as dependências:

npm install


Inicie o servidor:

node server.js


Acesse:

http://localhost:3000


Digite o nome da sala e entre.

Adicione músicas — o servidor pedirá aprovação no terminal.

📁 Estrutura
ResenJS/
 ├─ server.js
 ├─ playlists/
 └─ public/
     ├─ index.html
     ├─ style.css
     └─ client.js

🧹 Limpar playlist de uma sala
node server.js remove <nome-da-sala>

📜 Licença

MIT — use, modifique e compartilhe.
