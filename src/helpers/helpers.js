const hbs = require('hbs')

hbs.registerHelper('respuestaAlertHtml', (respuesta) => {
    if(!respuesta) {
        return ''
    }
    else {
        let contenido = !Array.isArray(respuesta.message) ? respuesta.message 
            : `<ul class="list-group"> ${respuesta.message.map(message => `<li class="ml-2">${message}</li>`).join('')}</ul>`

        return `<div class="alert alert-dismissible fade show alert-${respuesta.success ? 'success': 'danger'}" role="alert">
                ${contenido}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>`
   }    
})

hbs.registerHelper('truncateText', (str, length, ending) => {
    if(!length)
        length = 20
    if(!ending)
        ending='...'
    return str.length > length ? str.substring(0, length - ending.length) + ending : str
})

hbs.registerHelper({
    eq: function (v1, v2) {
        return v1 === v2;
    },
    seq: function (v1, v2) {
        return v1 == v2;
    },
    ne: function (v1, v2) {
        return v1 !== v2;
    },
    sne: function (v1, v2) {
        return v1 != v2;
    },
    lt: function (v1, v2) {
        return v1 < v2;
    },
    gt: function (v1, v2) {
        return v1 > v2;
    },
    lte: function (v1, v2) {
        return v1 <= v2;
    },
    gte: function (v1, v2) {
        return v1 >= v2;
    },
    and: function () {
        return Array.prototype.slice.call(arguments).every(Boolean);
    },
    or: function () {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    }
});    
