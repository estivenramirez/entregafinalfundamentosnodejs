process.env.PORT = process.env.PORT || 3000;
process.env.NODE_ENV = process.env.NODE_ENV || 'local';
//Crear variable de entorno
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

let urlDB
if (process.env.NODE_ENV === 'local'){
	urlDB = 'mongodb://localhost:27017/asignaturasfinal';
}
else {
	urlDB = 'mongodb+srv://admin:JGzVk5YjePieWsU@fundamentos-nodejs-erp-uh8j7.mongodb.net/asignaturasfinal?retryWrites=true'
}

process.env.URLDB = urlDB