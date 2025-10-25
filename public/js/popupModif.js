document.addEventListener("DOMContentLoaded", function() {


    const close = document.getElementById("close");
    const open = document.getElementById("show");
    const element = document.getElementById("parent-conteneur");

    open.addEventListener('click', () => {
        element.classList.add('show');
    });

    close.addEventListener('click', () => {
        element.classList.remove('show');
    });
    window.addEventListener('click', e => {
        e.target === element ? element.classList.remove('show') : false;
    })
})

