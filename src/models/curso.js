const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
 
const cursoSchema = new Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    valor: {
        type: Number,
        trim: true,
        min: [0, 'Ingrese un valor mayor o igual a 0'],
    },
    modalidad: {
        type: String,
        enum: {values: ['','PRESENCIAL', 'VIRTUAL'], message: 'La modalidad no es válida, valores permitidos ["PRESENCIAL", "VIRTUAL"]'},
    },
    intensidadHoraria: {
        type: Number,
        trim: true,
        min: [1,'Ingrese un valor mayor o igual a 1'],
    },
    estado: {
        type: String,
        enum: {values: ['disponible', 'cerrado'], message: 'Es estado no es válido'},
        default: 'disponible',
        required: true
    },
    estudiantes: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }]

});

cursoSchema.plugin(uniqueValidator);

const Curso = mongoose.model('Curso', cursoSchema)

module.exports = Curso