// ==============================================================================
// SISTEMA DE CÁLCULO DINÁMICO Y UX DE PEDIDOS - HOTEL MARIA'S
// ==============================================================================

const estilos = `
    .tabular.inline-related table tbody td.field-cantidad input {
        width: 60px !important;
        text-align: center !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        padding: 4px !important;
    }
    .tabular.inline-related table tbody td.field-platillo {
        width: 350px !important;
        min-width: 350px !important;
        max-width: 350px !important;
    }
    .tabular.inline-related table tbody td.field-platillo .select2-container {
        width: 100% !important;
        max-width: 100% !important;
    }
    .tabular.inline-related table tbody td.field-platillo .select2-container--default .select2-selection--single {
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        height: 32px !important;
    }

    /* Ocultamos el select invisible de adicionales y elementos residuales */
    .field-adicionales select,
    .field-adicionales .select2-container,
    .field-adicionales .related-widget-wrapper-link,
    .field-adicionales .add-related {
        display: none !important;
    }

    /* Ocultar iconos nativos de la columna del platillo */
    .tabular.inline-related table tbody td.field-platillo .related-widget-wrapper-link,
    .tabular.inline-related table tbody td.field-platillo .add-related,
    .tabular.inline-related table tbody td.field-platillo .change-related {
        display: none !important;
    }

    /* Estilización de la columna de borrado */
    .tabular.inline-related table thead th.column-delete {
        font-size: 0 !important;
        color: transparent !important;
    }
    .tabular.inline-related table thead th.column-delete::after {
        content: "¿Eliminar?" !important;
        font-size: 11px !important;
        color: #666 !important;
        font-weight: bold !important;
    }
    .tabular.inline-related table tbody td.delete input[type="checkbox"] {
        position: absolute !important;
        clip: rect(0,0,0,0) !important;
        padding: 0 !important;
        border: 0 !important;
        height: 1px !important;
        width: 1px !important;
        overflow: hidden !important;
    }
    .tabular.inline-related table tbody td.delete a,
    .tabular.inline-related table tbody td.delete span {
        display: none !important;
    }
    .tabular.inline-related table tbody td.delete {
        position: relative;
        cursor: pointer !important;
        vertical-align: middle !important;
        text-align: center !important;
    }
    .tabular.inline-related table tbody td.delete::after {
        content: "Eliminar" !important;
        display: inline-block !important;
        padding: 6px 14px !important;
        background-color: #dc3545 !important;
        color: white !important;
        font-size: 11px !important;
        font-weight: bold !important;
        border-radius: 4px !important;
    }
    .tabular.inline-related table tbody td.delete:hover::after {
        background-color: #bd2130 !important;
    }
    .tabular.inline-related table tbody tr.deleted_row {
        background-color: #ffe6e6 !important;
        opacity: 0.4;
    }
    .tabular.inline-related table tbody tr.deleted_row td.delete::after {
        content: "Deshacer" !important;
        background-color: #6c757d !important;
    }
    .tabular.inline-related .add-row a {
        display: inline-block !important;
        padding: 8px 16px !important;
        background-color: #007bff !important;
        color: white !important;
        font-size: 11px !important;
        font-weight: bold !important;
        text-transform: none !important;
        text-decoration: none !important;
        border-radius: 4px !important;
        transition: background 0.2s ease !important;
        cursor: pointer !important;
    }
    .tabular.inline-related .add-row a:hover {
        background-color: #0056b3 !important;
    }
    .tabular.inline-related .add-row {
        text-align: center !important;
        padding: 15px 0 !important;
        background: #f8f9fa !important;
        border-top: 1px solid #eee !important;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = estilos;
document.head.appendChild(styleSheet);

// Cache local para no saturar la API a consultas repetidas del intervalo
const cachePlatillosConAdicionales = {};

document.addEventListener('DOMContentLoaded', function() {
    transformarSelectoresAdicionales();
    calcularTotalGeneral();
    acomodarBotoneraDefinitiva();

    setInterval(function() {
        transformarSelectoresAdicionales();
    }, 500);

    if (window.django && window.django.jQuery) {
        window.django.jQuery(document).on('change', 'select[name*="-platillo"]', function(e) {
            const selectPlatillo = e.target;
            const row = selectPlatillo.closest('tr');
            if (!row) return;

            const precioDiv = row.querySelector('.field-precio_formateado p') || row.querySelector('.field-precio_formateado');
            const contenedorBotones = row.querySelector('.contenedor-adicionales-moderno');

            if (!selectPlatillo.value || selectPlatillo.value === "") {
                if (precioDiv) precioDiv.textContent = "";
                if (contenedorBotones) {
                    contenedorBotones.innerHTML = '';
                    contenedorBotones.style.display = 'none';
                }
                calcularTotalGeneral();
                return;
            }

            consultarEInyectarPrecio(selectPlatillo.value, precioDiv);
        });
    }
});

function consultarEInyectarPrecio(platilloId, precioContenedor) {
    if (!platilloId) return;
    
    fetch(`/api/platillos/${platilloId}/precio/`)
        .then(response => response.json())
        .then(data => {
            if (precioContenedor && data && data.precio !== undefined) {
                const precioFormateado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.precio);
                precioContenedor.textContent = precioFormateado;
                const nombrePlatillo = data.nombre ? data.nombre.toLowerCase() : "";
                const noLleva = nombrePlatillo.includes('gaseosa') || nombrePlatillo.includes('agua') || nombrePlatillo.includes('coca') || nombrePlatillo.includes('soda') || nombrePlatillo.includes('cerveza') || nombrePlatillo.includes('postre');
                cachePlatillosConAdicionales[platilloId] = data.tiene_adicionales !== undefined ? data.tiene_adicionales : !noLleva;
                
                calcularTotalGeneral();
                transformarSelectoresAdicionales();
            }
        })
        .catch(err => console.error("Error al traer precio:", err));
}

function transformarSelectoresAdicionales() {
    const filas = document.querySelectorAll('.inline-group table tbody tr');

    filas.forEach(fila => {
        if (!fila || fila.classList.contains('empty-form') || fila.classList.contains('add-row')) return;

        try {
            const tdAdicionales = fila.querySelector('.field-adicionales');
            if (!tdAdicionales) return;

            const selectNativo = tdAdicionales.querySelector('select[name*="-adicionales"]');
            const selectPlatillo = fila.querySelector('.field-platillo select');
            let contenedorBotones = tdAdicionales.querySelector('.contenedor-adicionales-moderno');

            if (!selectPlatillo || !selectPlatillo.value || !selectNativo) {
                if (contenedorBotones) contenedorBotones.style.display = 'none';
                return;
            }

            const platilloId = selectPlatillo.value;

            if (cachePlatillosConAdicionales[platilloId] === false) {
                if (contenedorBotones) {
                    contenedorBotones.innerHTML = '';
                    contenedorBotones.style.display = 'none';
                }
                Array.from(selectNativo.options).forEach(opt => opt.selected = false);
                return;
            }

            const opcionesValidas = Array.from(selectNativo.options).filter(opt => opt && opt.value && opt.value !== "");

            if (opcionesValidas.length === 0) {
                if (contenedorBotones) contenedorBotones.style.display = 'none';
                return;
            }

            if (!contenedorBotones) {
                contenedorBotones = document.createElement('div');
                contenedorBotones.className = 'contenedor-adicionales-moderno';
                contenedorBotones.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; max-width: 450px; clear: both;';
                tdAdicionales.appendChild(contenedorBotones);
            }
            contenedorBotones.style.display = 'flex';

            if (contenedorBotones.children.length === opcionesValidas.length) {
                Array.from(contenedorBotones.children).forEach((b, idx) => {
                    const opcion = opcionesValidas[idx];
                    if (opcion) {
                        if (opcion.selected) {
                            b.innerHTML = `✓ ${opcion.text} (Quitar)`;
                            b.style.backgroundColor = '#28a745';
                            b.style.color = '#ffffff';
                            b.style.borderColor = '#28a745';
                        } else {
                            b.innerHTML = `+ ${opcion.text} (Añadir)`;
                            b.style.backgroundColor = '#f8f9fa';
                            b.style.color = '#495057';
                            b.style.borderColor = '#ced4da';
                        }
                    }
                });
                return;
            }

            contenedorBotones.innerHTML = '';
            opcionesValidas.forEach((opcion, index) => {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.setAttribute('data-idx', index);
                boton.style.cssText = 'padding: 5px 12px; font-size: 11px; font-weight: bold; border-radius: 20px; border: 1px solid #ced4da; cursor: pointer; transition: all 0.15s ease; text-transform: uppercase; outline: none; margin-bottom: 2px;';
                
                if (opcion.selected) {
                    boton.innerHTML = `✓ ${opcion.text} (Quitar)`;
                    boton.style.backgroundColor = '#28a745';
                    boton.style.color = '#ffffff';
                    boton.style.borderColor = '#28a745';
                } else {
                    boton.innerHTML = `+ ${opcion.text} (Añadir)`;
                    boton.style.backgroundColor = '#f8f9fa';
                    boton.style.color = '#495057';
                    boton.style.borderColor = '#ced4da';
                }

                contenedorBotones.appendChild(boton);
            });
        } catch (err) {}
    });
}

function limpiarYParsearMoneda(texto) {
    if (!texto) return 0;
    let limpio = texto.replace(/[^0-9.,]/g, '').trim();
    if (!limpio) return 0;

    if (limpio.includes('.') && limpio.includes(',')) {
        limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else if (limpio.includes(',')) {
        limpio = limpio.replace(',', '.');
    } else if (limpio.includes('.')) {
        let partes = limpio.split('.');
        if (partes[partes.length - 1].length === 3) {
            limpio = limpio.replace(/\./g, '');
        }
    }
    let resultado = parseFloat(limpio);
    return isNaN(resultado) ? 0 : resultado;
}

function calcularTotalGeneral() {
    let totalGeneral = 0;
    
    document.querySelectorAll('.inline-group table tbody tr').forEach(row => {
        if (!row || row.classList.contains('empty-form') || row.classList.contains('deleted_row') || row.classList.contains('add-row')) return;

        try {
            const selectPlatillo = row.querySelector('.field-platillo select, .field-platillo input[type="hidden"]');
            const cantidadInput = row.querySelector('.field-cantidad input');
            const precioDiv = row.querySelector('.field-precio_formateado p') || row.querySelector('.field-precio_formateado');
            
            if (!selectPlatillo || !selectPlatillo.value || selectPlatillo.value === "") return;
            
            if (cantidadInput && precioDiv) {
                const cantidad = parseFloat(cantidadInput.value) || 0;
                const precioPlatillo = limpiarYParsearMoneda(precioDiv.textContent);
                
                let totalAdicionalesFila = 0;
                const selectAdicionales = row.querySelector('.field-adicionales select[name*="-adicionales"]');
                
                if (cachePlatillosConAdicionales[selectPlatillo.value] !== false && selectAdicionales && selectAdicionales.options) {
                    Array.from(selectAdicionales.options).forEach(opcion => {
                        if (opcion && opcion.selected) {
                            const matchAdicional = opcion.text.match(/\(\+\$([\d.,]+)\)/);
                            if (matchAdicional) {
                                totalAdicionalesFila += limpiarYParsearMoneda(matchAdicional[1]);
                            }
                        }
                    });
                }

                totalGeneral += cantidad * (precioPlatillo + totalAdicionalesFila);
            }
        } catch(e) {}
    });

    const totalInput = document.querySelector('#id_total');
    if (totalInput) {
        totalInput.value = totalGeneral.toFixed(2);
    }
}

document.addEventListener('click', function(e) {
    const botonAdicional = e.target.closest('button[data-idx]');
    if (botonAdicional) {
        e.preventDefault();
        e.stopPropagation();

        const fila = botonAdicional.closest('tr');
        const selectNativo = fila.querySelector('.field-adicionales select[name*="-adicionales"]');
        if (!selectNativo) return;

        const opcionesValidas = Array.from(selectNativo.options).filter(opt => opt && opt.value && opt.value !== "");
        const indexOpcion = parseInt(botonAdicional.getAttribute('data-idx'));
        const opcion = opcionesValidas[indexOpcion];
        
        if (opcion) {
            opcion.selected = !opcion.selected;
            if (window.django && window.django.jQuery) {
                window.django.jQuery(selectNativo).trigger('change');
            }
            transformarSelectoresAdicionales();
            calcularTotalGeneral();
        }
        return;
    }

    const tdDelete = e.target.closest('td.delete');
    if (tdDelete) {
        e.preventDefault();
        const row = tdDelete.closest('tr');
        if (!row) return;

        if (row.classList.contains('dynamic-form') || row.id.includes('__prefix__') || !row.querySelector('input[type="hidden"][id$="-id"]')?.value) {
            const btnNativo = row.querySelector('.inline-deletelink');
            if (btnNativo) btnNativo.click();
            else row.remove();
        } else {
            const checkbox = tdDelete.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                if (window.django && window.django.jQuery) {
                    window.django.jQuery(checkbox).trigger('change');
                }
                if (checkbox.checked) row.classList.add('deleted_row');
                else row.classList.remove('deleted_row');
            }
        }
        calcularTotalGeneral();
    }
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.closest('.field-cantidad input')) {
        calcularTotalGeneral();
    }
});
document.addEventListener('input', function(e) {
    if (e.target && e.target.closest('.field-cantidad input')) {
        calcularTotalGeneral();
    }
});

function acomodarBotoneraDefinitiva() {
    const submitRow = document.getElementById('jazzy-actions');
    if (!submitRow) return;

    submitRow.style.setProperty('display', 'flex', 'important');
    submitRow.style.setProperty('flex-direction', 'row', 'important');
    submitRow.style.setProperty('justify-content', 'flex-start', 'important');
    submitRow.style.setProperty('align-items', 'center', 'important');
    submitRow.style.setProperty('gap', '12px', 'important');
    submitRow.style.setProperty('flex-wrap', 'wrap', 'important');
    submitRow.style.setProperty('width', '100%', 'important');

    submitRow.querySelectorAll(':scope > div').forEach(divHijo => {
        if(divHijo) divHijo.style.setProperty('display', 'contents', 'important');
    });

    const btnContinuar = submitRow.querySelector('input[name="_continue"]');
    if (btnContinuar) btnContinuar.style.setProperty('display', 'none', 'important');

    const btnHistorico = submitRow.querySelector('a[href*="/history/"]') || submitRow.querySelector('.object-tools a');
    if (btnHistorico) {
        btnHistorico.style.setProperty('background-color', '#6c757d', 'important');
        btnHistorico.style.setProperty('border-color', '#6c757d', 'important');
        btnHistorico.style.setProperty('color', '#ffffff', 'important');
        btnHistorico.className = "btn btn-sm";
        btnHistorico.innerHTML = 'CANCELAR';
        btnHistorico.setAttribute('href', '/admin/menu/pedido/');
    }

    submitRow.querySelectorAll('input[type="submit"], a.btn, .btn').forEach(btn => {
        if (btn && btn.style.display !== 'none') {
            btn.style.setProperty('width', 'auto', 'important');
            btn.style.setProperty('display', 'inline-block', 'important');
            btn.style.setProperty('padding', '8px 20px', 'important');
            btn.style.setProperty('margin', '0', 'important');
            btn.style.setProperty('font-weight', 'bold', 'important');
            btn.style.setProperty('border-radius', '6px', 'important');
            btn.style.setProperty('font-size', '13px', 'important');
            btn.style.setProperty('text-transform', 'uppercase', 'important');
        }
    });

    const btnEliminar = submitRow.querySelector('a[href*="/delete/"]');
    if (btnEliminar) {
        btnEliminar.style.setProperty('background-color', '#dc3545', 'important');
        btnEliminar.style.setProperty('border-color', '#dc3545', 'important');
        btnEliminar.style.setProperty('color', '#ffffff', 'important');
    }
}