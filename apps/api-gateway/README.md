# API Gateway

API Gateway unificado para o sistema de gerenciamento de tarefas. Fornece um ponto único de entrada HTTP e WebSocket para todos os microserviços.

## Funcionalidades

### 🔐 Autenticação JWT
- Validação de tokens JWT em todas as rotas protegidas
- Suporte a refresh tokens
- Decorator `@Public()` para rotas públicas

### 🔀 Proxy HTTP
- Roteamento para microserviços:
  - `/auth/*` → auth-service (3001)
  - `/tasks/*` → tasks-service (3002)
  - `/notifications/*` → notifications-service (3003)
- Propagação automática de headers de autenticação
- Tratamento de erros unificado

### 🌐 WebSocket Real-time
- Namespace: `/notifications`
- Autenticação JWT via handshake
- Suporte a múltiplas conexões por usuário
- Integração com RabbitMQ para notificações

### 📊 Rate Limiting
- ThrottlerModule configurado
- Padrão: 100 requisições por minuto
- Aplicado globalmente via guard

### 📚 Documentação Swagger
- Disponível em `/api/docs`
- Documentação completa de todos os endpoints
- Suporte a autenticação Bearer
- Tags organizadas por recurso

### ❤️ Health Check
- Endpoint: `GET /health`
- Rota pública para monitoramento

## Estrutura do Projeto

```
src/
├── auth/                   # Autenticação e guards
│   ├── jwt.strategy.ts     # Estratégia JWT Passport
│   ├── jwt-auth.guard.ts   # Guard de autenticação
│   ├── public.decorator.ts # Decorator para rotas públicas
│   └── user.decorator.ts   # Decorator para extrair usuário
├── config/
│   └── environment.ts      # Configurações de ambiente
├── controllers/            # Controllers HTTP
│   ├── auth.controller.ts
│   ├── tasks.controller.ts
│   ├── notifications.controller.ts
│   └── health.controller.ts
├── proxy/
│   └── proxy.service.ts    # Serviço de proxy HTTP
├── websocket/              # WebSocket e RabbitMQ
│   ├── notifications.gateway.ts
│   └── rabbitmq.service.ts
├── app.module.ts           # Módulo principal
└── main.ts                 # Bootstrap da aplicação
```

## Variáveis de Ambiente

```bash
# Application
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m

# Microservices URLs
AUTH_SERVICE_URL=http://localhost:3001
TASKS_SERVICE_URL=http://localhost:3002
NOTIFICATIONS_SERVICE_URL=http://localhost:3003

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=rabbitmq
RABBITMQ_PASSWORD=rabbitmq
RABBITMQ_QUEUE=notifications
```

## Como Rodar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo watch
npm run start:dev
```

### Produção

```bash
# Build
npm run build

# Iniciar
npm run start:prod
```

## Endpoints Principais

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token (protegido)
- `POST /auth/logout` - Logout (protegido)
- `GET /auth/validate` - Validar token (protegido)

### Tasks
- `GET /tasks` - Listar tarefas (protegido)
- `POST /tasks` - Criar tarefa (protegido)
- `GET /tasks/:id` - Obter tarefa (protegido)
- `PATCH /tasks/:id` - Atualizar tarefa (protegido)
- `DELETE /tasks/:id` - Deletar tarefa (protegido)
- `GET /tasks/:taskId/comments` - Listar comentários (protegido)
- `POST /tasks/:taskId/comments` - Adicionar comentário (protegido)
- `GET /tasks/:id/history` - Histórico da tarefa (protegido)

### Notificações
- `GET /notifications` - Listar notificações (protegido)
- `GET /notifications/unread-count` - Contador de não lidas (protegido)
- `GET /notifications/:id` - Obter notificação (protegido)
- `POST /notifications/mark-as-read` - Marcar como lida (protegido)
- `POST /notifications/mark-all-as-read` - Marcar todas como lidas (protegido)

### Health
- `GET /health` - Status do serviço (público)

## WebSocket

### Conexão

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'seu-jwt-token-aqui'
  }
});

socket.on('connect', () => {
  console.log('Conectado!');
});

socket.on('notification', (data) => {
  console.log('Nova notificação:', data);
});
```

### Eventos

#### Cliente → Servidor
- `ping` - Verifica conectividade

#### Servidor → Cliente
- `connected` - Confirmação de conexão
- `notification` - Nova notificação
- `pong` - Resposta ao ping
- `error` - Erro de autenticação

## Arquitetura

### Fluxo de Requisição HTTP

```
Cliente → API Gateway → Microserviço
         ↓
    1. Valida JWT
    2. Rate limit
    3. Proxy request
    4. Retorna response
```

### Fluxo de Notificação Real-time

```
Tasks Service → RabbitMQ → API Gateway → WebSocket → Cliente
                            ↓
                    1. Consome fila
                    2. Identifica usuário
                    3. Envia via WebSocket
```

## Segurança

- ✅ Autenticação JWT obrigatória (exceto rotas públicas)
- ✅ Rate limiting global
- ✅ CORS configurado
- ✅ Validação de payloads com class-validator
- ✅ Headers de autenticação propagados aos microserviços
- ✅ WebSocket com autenticação JWT

## Monitoramento

- Health check endpoint disponível em `/health`
- Logs estruturados de conexões WebSocket
- Logs de erros de proxy HTTP

## Próximos Passos

- [ ] Adicionar cache Redis para respostas frequentes
- [ ] Implementar circuit breaker para microserviços
- [ ] Adicionar métricas e tracing (Prometheus/OpenTelemetry)
- [ ] Implementar retry policy para chamadas HTTP
