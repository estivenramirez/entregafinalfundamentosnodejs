const express = require('express')
const app = express()
const path = require('path')
const hbs = require('hbs')
const bodyParser = require('body-parser') //de express
const bcrypt = require('bcrypt');

//Envio de correo
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Token generator
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);

const Respuesta = require('../dtos/Respuesta')

const helpers = require('../helpers/helpers')

const dirViews = path.join(__dirname , '../../template/views')
const dirPartials = path.join(__dirname , '../../template/partials')

//Models
const Curso = require('./../models/curso')
const Usuario = require('./../models/usuario')
const Token = require('./../models/token')

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

app.set('view engine', 'hbs')
app.set('views', dirViews)
hbs.registerPartials(dirPartials)

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/cursos/crear', (req, res) => {
    res.render('cursos/crear', {
        curso: {},
        respuesta: ''
    })
});

app.post('/crearCurso', (req, res) => {

    let curso =  new Curso ({
        nombre:             req.body.nombre,
        descripcion:        req.body.descripcion,
        valor:              req.body.valor,
        modalidad:          req.body.modalidad,
        intensidadHoraria:  req.body.intensidadHoraria
    })

    curso.save((err, result)=>{

        let respuesta
        let cursoR = {}

        if(!err) {
            respuesta = new Respuesta(true, `Se ha creado el curso ${result.nombre}`);
            cursoR = {_id: result._id, nombreResult: result.nombre};
        } else {
            console.log(err)
            respuesta = new Respuesta(false, err)
            cursoR = curso
        }

        res.render('cursos/crear',  {
            respuesta: respuesta,
            curso: cursoR
        })

    })

});

app.get('/crearCurso', (req, res) => res.redirect('cursos/crear') );

app.get('/cursos/ver', (req, res) => {

    if(req.session.rol == 'COORDINADOR') {

        Curso.find({}, (err, result) => {

            if(err) return  console.log(err)
            
            res.render('cursos/verCoordinador', { 
            tablaListaCursos : 
            `<table class="table table-striped" style="width:100%">
                <thead class="thead-dark">
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Valor</th>
                        <th>Modalidad</th>
                        <th>Intensidad Horaria</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(c => 
                       `<tr>
                        <td>${c.nombre}</td>
                        <td>${c.descripcion}</td>
                        <td>${c.valor}</td>
                        <td>${c.modalidad != undefined ? c.modalidad : ''}</td>
                        <td>${c.intensidadHoraria != undefined ? c.intensidadHoraria : ''}</td>
                        <td><input class="estado" type="checkbox"  ${c.estado == 'disponible'? 'checked' : ''} data-size="sm" data-width="90" data-toggle="toggle" data-on="disponible" data-off="cerrado" data-onstyle="success" data-offstyle="danger"></td>
                        <input type="hidden" name="idCurso" value="${c._id}">
                        </td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>`
    
            })
        })
    }
    else {
        Curso.find({estado:'disponible'}, (err, result)=> {
            if(err) return console.log(err)
            res.render('cursos/verInteresado', { cursosDisponibles: result })
        })
    }
});

app.patch('/cambiarEstadoCurso', (req, res) => {

    Curso.findByIdAndUpdate(req.body.idCurso, {estado: req.body.estado}, (err, result) => {
        let respuesta
        if(err) {
            console.log(err)
            respuesta = new Respuesta(false, 'Ocurrió un error al cambiar el estado del curso')
        } else {
            console.log(result)
            respuesta = new Respuesta(true, 'Se modificó el estado')
        } 
        res.send(respuesta)
    })

})

app.get('/cursos/inscribir', (req, res) => {

    Curso.find({"estado": "disponible"}, (err, result) => {
        if(err) return  console.log(err)
        res.render('cursos/inscribir', { cursosDisponibles : result })

    })
});

app.post('/inscribirCurso', (req, res) => {

    Curso.findOne({"_id":req.body.idCurso, "estudiantes": req.session.usuario}, (err, result) => {
        if(err)
            return console.log(err)

        if(result) {

            Curso.find({"estado": "disponible"}, (err, resp) => {
                if(err) return  console.log(err)
                res.render('cursos/inscribir', {respuesta: new Respuesta(false, `El aspirante ya está inscrito en el curso "${result.nombre}"`), cursosDisponibles : resp, idCurso: req.body.idCurso })
            })

        } else {
            Curso.findByIdAndUpdate(req.body.idCurso, {$push: {"estudiantes": req.session.usuario}}, {'new': true}, (err, resp) => {
                if(err) return console.log(err)
                res.render('respuesta',  {respuesta: new Respuesta(true, `Aspirante inscrito al curso "${resp.nombre}" con éxito`) })
            })
        }
    })
});

app.get('/inscribirCurso', (req, res) => res.redirect('cursos/inscribir'));

app.get('/cursos/verInscritos', (req, res) => {

    Curso.find({estado: "disponible"})
    .populate('estudiantes')
    .sort('nombre')
    .exec((err, result) => {
        if(err)
            return console.log(err)

        res.render('cursos/verInscritos', {
            cursos: result
        })
    })

});

app.post('/eliminarCursoUsuario', (req, res) => {

    console.log(`idCurso ${req.body.idCurso} idEstudiante ${req.body.idUsuario}`)

    Curso.findByIdAndUpdate(req.body.idCurso, {$pull: {"estudiantes": req.body.idUsuario}}, {'new': true}, (err, result) => {
        if(err)
            return console.log(err)
        
        res.send(new Respuesta(true, 'Estudiante eliminado del curso'))
    })

});

app.get('/usuarios/registrar', (req, res) => res.render('usuarios/registro') );

app.post('/registro', (req, res) => {

    let usuario = new Usuario({
        documento: req.body.documento,
        nombre: req.body.nombre,
        correo: req.body.correo,
        telefono: req.body.telefono,
        usuario: req.body.usuario
    })

    if(req.body.rol != null && req.body.rol != '') {
        usuario.rol = req.body.rol

        if(usuario.rol == 'ADMINISTRADOR')
            usuario.estado = 'ACTIVO'
    }

    if(req.body.password === req.body.passwordAgain) {
        usuario.password = bcrypt.hashSync(req.body.password, 10)
    } else {
        res.render('usuarios/registro', {
            respuesta: new Respuesta(false, "Las contraseñas no coinciden."),
            documento: req.body.documento,
            nombre: req.body.nombre,
            correo: req.body.correo,
            telefono: req.body.telefono,
            usuario: req.body.usuario,
            rol: req.body.rol,
            password: req.body.password,
            passwordAgain: req.body.passwordAgain
        })
    }

    usuario.save((err, result) => {
        if(err) {
            res.render('usuarios/registro', {
                respuesta: new Respuesta(false, err),
                documento: req.body.documento,
                nombre: req.body.nombre,
                correo: req.body.correo,
                telefono: req.body.telefono,
                usuario: req.body.usuario,
                rol: req.body.rol,
                password: req.body.password,
                passwordAgain: req.body.passwordAgain
            })
        } else {

            if(usuario.rol == 'ADMINISTRADOR') {
                res.render('respuesta', {
                    respuesta: new Respuesta(true, `Se registró "${result.nombre}" con usuario ${result.usuario}`)
                })
            } else {

                let uuid = tokgen.generate();
                let fechaExpiracion = new Date()
                fechaExpiracion.setHours( fechaExpiracion.getHours() + 2 );
    
                let token = new Token({
                    uuid: uuid,
                    tipo: 'CONFIRMACION',
                    fechaExpiracion: fechaExpiracion
                })
                token.save((err, resultToken) => {
                    if(!err) {

                        Usuario.findByIdAndUpdate(result._id, {$push: {"tokens": resultToken._id}}, {'new': true}, (err, resp) => {
                            if(err) return console.log(err)
                        })

                        let url = 'http://'+req.get('host')+'/usuarios/validar?token='+resultToken.uuid
                        // Se envía correo
                        const msg = {
                            to: usuario.correo,
                            from: 'estiuv20@gmail.com',
                            subject: `Valide su cuenta ${usuario.usuario}`,
                            html: `<p>Bienvenido a la entrega final Curso Node js, por favor valide su cuenta </p><p><strong>${url}</p>`,
                        };
            
                        sgMail.send(msg)
            
                    }
    
                })
    
                res.render('respuesta', {
                    respuesta: new Respuesta(true, `Se registró "${result.nombre}" con usuario ${result.usuario}, <br>Se ha enviado un correo de activación, verificar en la carpeta de spam si no lo encuentra en la bandeja de entrada.`)
                })
            } 

        }
    })

});

app.get('/usuarios/validar', (req, res) => {

    let uuid = req.query.token

    if(!uuid)
      return  res.render('respuesta', {
            respuesta: new Respuesta(false, `Token inválido.`)
        })

    Token.findOne({uuid: uuid},  (err, resultToken)=>{
        if(resultToken) {
            if(resultToken.usado) {
                return  res.render('respuesta', {
                    respuesta: new Respuesta(false, `El token ya fue usado.`)
                })
            } else {
                    Token.findByIdAndUpdate(resultToken._id, {usado: true}, (err, resultTk) => {

                        if(resultTk) {

                            let fecha = new Date()
                            if(fecha > resultToken.fechaExpiracion) {
                                return  res.render('respuesta', {
                                    respuesta: new Respuesta(false, `El token expiró.`)})
                            }

                            Usuario.findOneAndUpdate({'tokens': resultTk._id }, {$set: {estado: 'ACTIVO'}}, (err, resultUsr)=> {

                                if(resultUsr) {
                                    return  res.render('respuesta', {
                                        respuesta: new Respuesta(true, `Usuario ${resultUsr.usuario} activado con éxito.`)
                                    })
                                } else {
                                    return  res.render('respuesta', {
                                        respuesta: new Respuesta(false, `No fue posible activar el usuario.`)
                                    })
                                }

                            })
                        } else {
                            return  res.render('respuesta', {
                                respuesta: new Respuesta(false, `Token inválido.`)
                            })
                        }
                    })
            }
        } else {
            return  res.render('respuesta', {
                respuesta: new Respuesta(false, `Token inválido.`)
            })
        }
    })

})

app.get('/usuarios/ver', (req, res) => {

    if(req.session.rol == 'ADMINISTRADOR') {
        console.log(req.session)

        Usuario.find({/*'_id' : {$ne: req.session.usuario }*/}, (err, result) => {

            if(err) return  console.log(err)
            
            res.render('usuarios/verUsuarios', {
            tablaListaUsuarios : 
            `<table class="table table-striped" style="width:100%">
                <thead class="thead-dark">
                    <tr>
                        <th>Documento</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(u => 
                       `<tr>
                        <td>${u.documento}</td>
                        <td>${u.nombre}</td>
                        <td>${u.correo}</td>
                        <td>${u.telefono}</td>
                        <td>${u.usuario}</td>
                        <td>${u.rol}</td>
                        <td><input class="estado" type="checkbox"  ${u.estado == 'ACTIVO'? 'checked' : ''} data-size="sm" data-width="90" data-toggle="toggle" data-on="ACTIVO" data-off="INACTIVO" data-onstyle="success" data-offstyle="danger"></td>
                        <input type="hidden" name="idUsuario" value="${u._id}">
                        </td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>`
    
            })
        })
    } else {
            res.render('respuesta', {respuesta: new Respuesta(false, 'No tiene permisos para ver los usuarios')})
    }
});

app.patch('/cambiarEstadoUsuario', (req, res) => {

    if(req.session.usuario === req.body.idUsuario) 
       return  res.send(new Respuesta(false, 'No se permite que el usuario en sesión cambie su estado, para ello debe ingresar con otro usuario administrador'))

    Usuario.findByIdAndUpdate(req.body.idUsuario, {estado: req.body.estado}, (err, result) => {
        let respuesta
        if(err) {
            console.log(err)
            respuesta = new Respuesta(false, 'Ocurrió un error al cambiar el estado del usuario')
        } else {
            console.log(result)
            respuesta = new Respuesta(true, 'Se modificó el estado')
        } 
        res.send(respuesta)
    })
})

app.post('/ingresar', (req, res) => {

    Usuario.findOne({usuario: req.body.usuario},  (err, result)=>{

        if(err) {
            return console.log(err)
        }

        if(result && result.estado != 'ACTIVO') {
            return res.render('respuesta', { titulo: "Respuesta Ingresar", respuesta: new Respuesta(false, 'El usuario no se encuentra ACTIVO') })
        } else if (!result || !bcrypt.compareSync(req.body.password, result.password)) {
            return res.render('respuesta', { titulo: "Respuesta Ingresar", respuesta: new Respuesta(false, 'Usuario o contraseña incorrectos') })
        }

        //Con session
        req.session.usuario = result._id
        req.session.nombre  = result.nombre
        req.session.rol  = result.rol

        console.log(req.session)

        res.render('respuesta', { 
            titulo: "Respuesta Ingresar", 
            respuesta: new Respuesta(true, `Bienvenido ${result.nombre}`),
            se_sesion: true,
            se_usuario : result._id,
            se_nombre  : result.nombre,
            se_rol  : result.rol
           })

    })
    
});

app.get('/salir', (req, res) => {
	req.session.destroy((err) => {
  		if (err) return console.log(err) 	
	})	
    
    res.redirect('/')	
})


app.get('*', (req, res) => {
    res.render('error')
});

module.exports = app
