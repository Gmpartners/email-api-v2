const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    campaignId: {
        type: String,
        required: [true, 'ID da campanha é obrigatório'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Nome da campanha é obrigatório'],
        trim: true
    },
    userId: {
        type: String,
        required: true,
        default: 'default-user'
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    type: {
        type: String,
        enum: ['sequence', 'broadcast'],
        default: 'sequence'
    },
    emailSequence: [{
        emailId: {
            type: String,
            required: true
        },
        position: {
            type: Number,
            required: true
        },
        delayDays: {
            type: Number,
            default: 0
        }
    }],
    totalLeads: {
        type: Number,
        default: 0
    },
    activeLeads: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'campaigns'
});

// Método para ativar a campanha
campaignSchema.methods.activate = async function() {
    this.status = 'active';
    await this.save();
    return this;
};

// Método para desativar a campanha
campaignSchema.methods.deactivate = async function() {
    this.status = 'inactive';
    await this.save();
    return this;
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
