const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/mongodb');
const redisClient = require('./config/redis');
const queueService = require('./services/queueService');

// Importar rotas
const campaignRoutes = require('./routes/campaignRoutes');
const emailRoutes = require('./routes/emailRoutes');
const leadRoutes = require('./routes/leadRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Aumentado para suportar conteúdo HTML maior
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por windowMs
});
app.use(limiter);

// Conectar ao MongoDB
connectDB();

// Iniciar Redis e Queue Service
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis Client Connected');
        
        // Iniciar o processamento da fila
        await queueService.startProcessing();
        console.log('Queue Service Started');
    } catch (error) {
        console.error('Erro ao inicializar serviços:', error);
    }
})();

// Rotas
app.use('/api', campaignRoutes);
app.use('/api', emailRoutes);
app.use('/api', leadRoutes);
app.use('/track', trackingRoutes);

// Rota de saúde da API
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'API funcionando!',
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient.isReady ? 'connected' : 'disconnected',
            queue: queueService.isProcessing() ? 'running' : 'stopped'
        }
    });
});

// Handler para erros de rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Handler global de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento gracioso de desligamento
const gracefulShutdown = async () => {
    console.log('Iniciando desligamento gracioso...');
    
    // Parar de aceitar novas conexões
    server.close(async () => {
        console.log('Servidor HTTP fechado');
        
        try {
            // Parar o processamento da fila
            queueService.stopProcessing();
            console.log('Queue Service parado');

            // Fechar conexão com Redis
            if (redisClient.isReady) {
                await redisClient.quit();
                console.log('Conexão Redis fechada');
            }

            // Fechar conexão com MongoDB
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
                console.log('Conexão MongoDB fechada');
            }

            console.log('Desligamento gracioso concluído');
            process.exit(0);
        } catch (error) {
            console.error('Erro durante o desligamento:', error);
            process.exit(1);
        }
    });

    // Se o servidor não fechar em 10 segundos, forçar o encerramento
    setTimeout(() => {
        console.error('Não foi possível encerrar graciosamente, forçando desligamento');
        process.exit(1);
    }, 10000);
};

// Tratamento de sinais de término
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('Erro não tratado (Promise):', err);
});

process.on('uncaughtException', (err) => {
    console.error('Erro não tratado (Exception):', err);
    gracefulShutdown();
});

module.exports = app;
