const mongoose = require('mongoose')
const Schema = mongoose.Schema;
 
const tokenSchema = new Schema({

    uuid: {
        type: String,
        required: true,
        trim: true,
    },
    tipo: {
        type: String,
        enum: {values: ['CONFIRMACION', 'PASSWORD'], message: 'El tipo no es válido'},
        default: 'CONFIRMACION',
        required: true,
        trim: true,
    },
    fechaExpiracion: {
        type: Date,
        required: true,
        trim: true,
    },
    usado: {
        type: Boolean, 
        default: false 
    }

});

const Token = mongoose.model('Token', tokenSchema)

module.exports = Token