const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, insira um email válido']
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    campaignId: {
        type: String,
        required: [true, 'ID da campanha é obrigatório'],
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'unsubscribed'],
        default: 'active'
    },
    currentPosition: {
        type: Number,
        default: 1 // Começa na primeira posição da sequência
    },
    lastEmailSentAt: {
        type: Date,
        default: null
    },
    nextEmailScheduledFor: {
        type: Date,
        default: null
    },
    emailHistory: [{
        emailId: String,
        sentAt: Date,
        status: {
            type: String,
            enum: ['sent', 'opened', 'clicked', 'failed'],
            default: 'sent'
        }
    }]
}, {
    timestamps: true,
    collection: 'leads'
});

// Índices para melhor performance
leadSchema.index({ email: 1, campaignId: 1 }, { unique: true });
leadSchema.index({ status: 1, nextEmailScheduledFor: 1 });

// Método para verificar se o lead pode receber o próximo email
leadSchema.methods.canReceiveNextEmail = function() {
    return this.status === 'active' && (!this.nextEmailScheduledFor || new Date() >= this.nextEmailScheduledFor);
};

// Método para registrar envio de email
leadSchema.methods.recordEmailSent = async function(emailId) {
    this.lastEmailSentAt = new Date();
    this.emailHistory.push({
        emailId,
        sentAt: new Date(),
        status: 'sent'
    });
    await this.save();
};

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
