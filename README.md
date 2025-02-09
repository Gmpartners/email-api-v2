# API de Automação de Email (v2)

## Visão Geral
API de automação de email similar ao Active Campaign, permitindo criação de campanhas de email sequenciais com delays configuráveis e tracking de métricas.

## Stack Tecnológica
- Node.js
- Express
- MongoDB (persistência)
- Redis (gerenciamento de filas)
- Nodemailer (envio de emails)

## Estrutura do Projeto
```
email-api-v2/
├── .env
├── package.json
└── src/
    ├── config/
    │   ├── mongodb.js
    │   └── redis.js
    ├── controllers/
    │   ├── campaignController.js
    │   ├── emailController.js
    │   └── leadController.js
    ├── models/
    │   ├── campaign.js
    │   ├── email.js
    │   └── lead.js
    ├── routes/
    │   ├── campaignRoutes.js
    │   ├── emailRoutes.js
    │   └── leadRoutes.js
    ├── services/
    │   ├── emailService.js
    │   └── queueService.js
    └── server.js
```

## Configuração

### Variáveis de Ambiente (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/email-api-v2
REDIS_URL=redis://localhost:6379
SMTP_HOST=mta.flowgenie.com.br
SMTP_PORT=2525
SMTP_USER=support@flowgenie.com.br
SMTP_PASS=sua_senha
SMTP_SECURE=false
```

### Instalação
```bash
npm install
npm run dev
```

## Endpoints da API

### 1. Campanhas

#### Criar Campanha
```bash
POST /api/:userId/campaign/create
Content-Type: application/json

{
    "campaignId": "TESTE_001",
    "name": "Campanha de Teste",
    "description": "Descrição da campanha"
}
```

#### Ativar/Desativar Campanha
```bash
PUT /api/:userId/campaign/:campaignId/status
Content-Type: application/json

{
    "status": "active"  # ou "inactive"
}
```

#### Listar Campanhas
```bash
GET /api/:userId/campaign
```

### 2. Emails

#### Adicionar Email à Campanha
```bash
POST /api/:userId/campaign/:campaignId/email/create
Content-Type: application/json

{
    "label": "Email de Boas-vindas",
    "fromName": "Seu Nome",
    "fromEmail": "seu@email.com",
    "subject": "Bem-vindo!",
    "htmlContent": "<h1>Olá!</h1><p>Conteúdo...</p>",
    "position": 1,
    "delay": {
        "value": 0,
        "unit": "seconds"  # seconds, minutes, hours, days
    }
}
```

#### Atualizar Email
```bash
PUT /api/:userId/campaign/:campaignId/email/:emailId
Content-Type: application/json

{
    "subject": "Novo assunto",
    "htmlContent": "Novo conteúdo",
    "delay": {
        "value": 30,
        "unit": "minutes"
    }
}
```

#### Listar Emails da Campanha
```bash
GET /api/:userId/campaign/:campaignId/email
```

### 3. Leads

#### Adicionar Lead
```bash
POST /api/:userId/campaign/:campaignId/lead/create
Content-Type: application/json

{
    "email": "lead@email.com",
    "name": "Nome do Lead"
}
```

#### Remover Lead
```bash
DELETE /api/:userId/campaign/:campaignId/lead/:email
```

#### Listar Leads
```bash
GET /api/:userId/campaign/:campaignId/lead
```

## Exemplo de Uso Completo

1. Criar uma campanha:
```bash
curl -X POST http://localhost:3000/api/default-user/campaign/create \
-H "Content-Type: application/json" \
-d '{
    "campaignId": "TESTE_001",
    "name": "Campanha de Teste",
    "description": "Sequência de teste"
}'
```

2. Adicionar emails à sequência:
```bash
# Primeiro email (imediato)
curl -X POST http://localhost:3000/api/default-user/campaign/TESTE_001/email/create \
-H "Content-Type: application/json" \
-d '{
    "label": "Email 1",
    "fromName": "Seu Nome",
    "fromEmail": "seu@email.com",
    "subject": "Bem-vindo!",
    "htmlContent": "<h1>Email 1</h1>",
    "position": 1,
    "delay": {
        "value": 0,
        "unit": "seconds"
    }
}'

# Segundo email (30 segundos depois)
curl -X POST http://localhost:3000/api/default-user/campaign/TESTE_001/email/create \
-H "Content-Type: application/json" \
-d '{
    "label": "Email 2",
    "fromName": "Seu Nome",
    "fromEmail": "seu@email.com",
    "subject": "Segundo Email",
    "htmlContent": "<h1>Email 2</h1>",
    "position": 2,
    "delay": {
        "value": 30,
        "unit": "seconds"
    }
}'
```

3. Ativar a campanha:
```bash
curl -X PUT http://localhost:3000/api/default-user/campaign/TESTE_001/status \
-H "Content-Type: application/json" \
-d '{"status": "active"}'
```

4. Adicionar um lead:
```bash
curl -X POST http://localhost:3000/api/default-user/campaign/TESTE_001/lead/create \
-H "Content-Type: application/json" \
-d '{
    "email": "lead@email.com",
    "name": "Nome do Lead"
}'
```

## Funcionalidades Implementadas

1. Campanhas
   - Criação com ID personalizado
   - Ativação/desativação
   - Listagem e gerenciamento

2. Emails
   - Sequência configurável
   - Delays personalizados
   - Remetente personalizado por email
   - Ordenação automática

3. Leads
   - Adição/remoção
   - Histórico de envios
   - Gestão de status

4. Sistema de Fila
   - Processamento automático
   - Respeito aos delays
   - Gestão de ordem de envio

## Próximas Implementações

1. Tracking
   - Pixel de abertura
   - Tracking de cliques
   - Integração com Firebase para dashboard

2. Métricas
   - Taxa de abertura
   - Taxa de cliques
   - Histórico por email/campanha

3. Melhorias
   - Templates reutilizáveis
   - Personalização de conteúdo
   - Blacklist/Whitelist de domínios
