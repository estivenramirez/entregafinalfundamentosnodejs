const mongoose = require('mongoose')
var uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;
 
const usuarioSchema = new Schema({

    // _id: Schema.Types.ObjectId,

    documento: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate : {
            validator : (v) => /^\d+$/.test(v),
            message   : '{VALUE} no es un valor numérico'
        }
    },
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    correo: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (v) =>
             /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v),
             message: '{VALUE} no es un correo válido'
        }
    },
    telefono: {
        type: String,
        required: true,
        trim: true,
        validate : {
            validator : (v) => /^\d+$/.test(v),
            message   : '{VALUE} no es un valor numérico'
        }
    },
    usuario: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    rol: {
        type: String,
        enum: {values: ['ASPIRANTE', 'COORDINADOR', 'ADMINISTRADOR'], message: 'El rol no es válido'},
        default: 'ASPIRANTE',
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    estado: {
        type: String,
        enum: {values: ['ACTIVO', 'INACTIVO'], message: 'El estado no es válido'},
        default: 'INACTIVO',
        required: true
    },
    tokens: [{ type: Schema.Types.ObjectId, ref: 'Token' }]

});

usuarioSchema.plugin(uniqueValidator, { message: 'Error, ya existe {PATH} {VALUE}' });

const Usuario = mongoose.model('Usuario', usuarioSchema)

module.exports = Usuario