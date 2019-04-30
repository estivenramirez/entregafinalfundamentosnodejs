require('./config/config');

const express = require('express')
const app = express()
const path = require('path')
const helpers = require('./helpers/helpers')
const bodyParser = require('body-parser') //de express
const session = require('express-session')
const mongoose = require('mongoose');

//Sockets
const server = require('http').createServer(app);
const io = require('socket.io')(server);

//Models
const Curso = require('./models/curso')

app.use(express.static(path.join(__dirname, '../public')))

const dirNode_modules = path.join(__dirname , '../node_modules')
app.use('/css', express.static(dirNode_modules + '/bootstrap/dist/css'));
app.use('/css', express.static(dirNode_modules + '/bootstrap4-toggle/css'));
app.use('/js', express.static(dirNode_modules + '/jquery/dist'));
app.use('/js', express.static(dirNode_modules + '/popper.js/dist'));
app.use('/js', express.static(dirNode_modules + '/bootstrap/dist/js'));
app.use('/js', express.static(dirNode_modules + '/jquery-validation/dist'));
app.use('/js', express.static(dirNode_modules + '/bootstrap4-toggle/js'));
app.use('/js', express.static(dirNode_modules + '/bootstrap4-notify'));
// app.use('/js', express.static(dirNode_modules + '/socket.io-client/dist'));

//Session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  }))

app.use((req, res, next) => {
    res.locals.nombreAplicacion = "Entrega #4"
    if(req.session.usuario) {
        res.locals.se_sesion = true
        res.locals.se_nombre = req.session.nombre
        res.locals.se_rol = req.session.rol
    }
    next()
})

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

//Routes
app.use(require('./routes/index'))

mongoose.connect(process.env.URLDB, {useNewUrlParser: true}, (err, result) => {
	if (err){
		return console.log(error)
	}
	console.log("conectado")
});

server.listen(process.env.PORT, () => console.log('Escuchando en puerto ' + process.env.PORT))

io.on('connection', client => {
    console.log('Un usuario se ha conectado')

    client.on("nuevoCurso", (curso, callback) => {
        console.log('nuevoCurso')

        Curso.findOne({_id: curso.idCurso},  (err, result)=>{

            if(result) {
                let texto = `Se ha creado el curso <strong>${result.nombre}</strong>, para más información has clic <a href="/cursos/ver">aquí</a>`
                client.broadcast.emit("cursoCreado", texto)
            }

        })
    })

})
