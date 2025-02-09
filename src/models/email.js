const mongoose = require('mongoose');
const crypto = require('crypto');

const emailSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const timestamp = Date.now();
            const random = crypto.randomBytes(4).toString('hex');
            return `${this.campaignId}_email_${timestamp}_${random}`;
        }
    },
    label: {
        type: String,
        required: [true, 'Label do email é obrigatório'],
        trim: true
    },
    campaignId: {
        type: String,
        required: [true, 'ID da campanha é obrigatório'],
        trim: true
    },
    fromName: {
        type: String,
        required: [true, 'Nome do remetente é obrigatório'],
        trim: true
    },
    fromEmail: {
        type: String,
        required: [true, 'Email do remetente é obrigatório'],
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, insira um email válido']
    },
    subject: {
        type: String,
        required: [true, 'Assunto do email é obrigatório'],
        trim: true
    },
    htmlContent: {
        type: String,
        required: [true, 'Conteúdo HTML do email é obrigatório']
    },
    position: {
        type: Number,
        required: [true, 'Posição na sequência é obrigatória']
    },
    delay: {
        value: {
            type: Number,
            required: [true, 'Valor do delay é obrigatório'],
            min: 0
        },
        unit: {
            type: String,
            required: [true, 'Unidade do delay é obrigatória'],
            enum: ['seconds', 'minutes', 'hours', 'days'],
            default: 'minutes'
        }
    },
    stats: {
        sends: { type: Number, default: 0 },
        opens: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        lastSent: { type: Date, default: null }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'emails'
});

// Método para incrementar estatísticas
emailSchema.methods.incrementStat = async function(stat) {
    this.stats[stat] += 1;
    if (stat === 'sends') {
        this.stats.lastSent = new Date();
    }
    await this.save();
};

// Método para obter taxa de abertura
emailSchema.methods.getOpenRate = function() {
    return this.stats.sends > 0 ? (this.stats.opens / this.stats.sends) * 100 : 0;
};

// Método para obter taxa de cliques
emailSchema.methods.getClickRate = function() {
    return this.stats.sends > 0 ? (this.stats.clicks / this.stats.sends) * 100 : 0;
};

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
