document.addEventListener( 'DOMContentLoaded', function( event ) {

    let pathname = window.location.pathname

    Array.prototype.slice.call(
        document
        .getElementById('navbarCollapse')
        .getElementsByTagName('a')
    ).forEach(element => {
        if(element.pathname == pathname)
            element.parentElement.classList.add("active");
        else
            element.parentElement.classList.remove("active");
    })
});

socket = io()

socket.on("cursoCreado", text=> {
    console.log(text)
    $.notify({
        message: text
    },{
        type: 'info',
        delay: 0,
        offset:{x: 20, y: 60 },
        spacing: 0
    });
})
