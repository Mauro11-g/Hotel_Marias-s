// PARCHE DE REACTIVIDAD PARA GUARDADO GENERAL

document.addEventListener('DOMContentLoaded', function() {
    
    // Forzar el registro de cambios en el formulario antes de enviar (Submit)
    const formPedido = document.getElementById('pedido_form') || document.querySelector('form');
    
    if (formPedido) {
        formPedido.addEventListener('submit', function() {
            // Buscamos todos los selects de platillos y adicionales modificados por el script principal
            const elementosClave = formPedido.querySelectorAll('select[name*="-platillo"], select[name*="-adicionales"], #id_total');
            
            elementosClave.forEach(elemento => {
                // Despertamos los escuchas internos de Django/Jazzmin justo antes de enviar el POST
                elemento.dispatchEvent(new Event('change', { bubbles: true }));
                elemento.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }
});