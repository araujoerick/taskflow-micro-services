# Task Management - Frontend (Web App)

Frontend da aplicação de gerenciamento de tarefas construído com React 19, TypeScript, TanStack Router e shadcn/ui.

## 🚀 Tecnologias Utilizadas

- **React 19** - Biblioteca UI
- **Vite 7** - Build tool e dev server
- **TypeScript 5.9** - Type safety
- **TanStack Router v7** - Roteamento type-safe
- **Tailwind CSS v4** - Estilização
- **shadcn/ui** - Componentes UI (Radix UI)
- **Axios** - Cliente HTTP com interceptors
- **Socket.IO Client** - WebSocket real-time
- **Sonner** - Toast notifications

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes shadcn/ui
│   ├── Layout.tsx       # Layout principal
│   ├── ProtectedRoute.tsx   # HOC para rotas protegidas
│   └── NotificationsDropdown.tsx
├── contexts/            # React Contexts
│   ├── AuthContext.tsx  # Autenticação
│   └── NotificationsContext.tsx  # WebSocket
├── lib/                 # Utilities
│   ├── api.ts          # Axios instance + interceptors
│   └── utils.ts        # Helper functions
├── routes/             # Páginas (TanStack Router)
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Home page
│   ├── login.tsx       # Login page
│   ├── register.tsx    # Register page
│   ├── tasks.tsx       # Tasks list
│   └── tasks.$taskId.tsx  # Task details
└── main.tsx            # Entry point
```

## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Backend rodando (API Gateway em http://localhost:3000)

### Instalar dependências
```bash
npm install
```

### Executar em desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:5173

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

## ✨ Funcionalidades Implementadas

### Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Logout
- ✅ Auto-refresh de JWT tokens
- ✅ Protected routes
- ✅ Toast feedback em operações

### Gerenciamento de Tarefas
- ✅ Listar tarefas com paginação
- ✅ Filtrar por status e prioridade
- ✅ Busca por título/descrição
- ✅ Criar nova tarefa (modal)
- ✅ Ver detalhes da tarefa
- ✅ Editar tarefa (inline)
- ✅ Deletar tarefa
- ✅ Badges coloridos para status/prioridade

### Comentários
- ✅ Adicionar comentário em tarefa
- ✅ Listar comentários com autor e timestamp

### Histórico
- ✅ Visualizar histórico de alterações
- ✅ Timeline com mudanças de status/prioridade

### Notificações em Tempo Real
- ✅ WebSocket conectado ao backend
- ✅ Dropdown com lista de notificações
- ✅ Badge com contador de não lidas
- ✅ Marcar como lida (individual e todas)
- ✅ Limpar notificação
- ✅ Link direto para tarefa relacionada
- ✅ Ícones por tipo de notificação

## 🔌 Integração com Backend

A aplicação se comunica com o backend através do API Gateway:

- **HTTP API**: `http://localhost:3000/api`
- **WebSocket**: `ws://localhost:3000/notifications`

Configurado em [vite.config.ts](vite.config.ts):
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/socket.io': {
      target: 'http://localhost:3000',
      ws: true
    }
  }
}
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa ESLint
- `npm run routes:gen` - Gera tipos do TanStack Router

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
