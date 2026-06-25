// backend/menu/static/admin/js/calculo_pedido.js

document.addEventListener('DOMContentLoaded', function () {
    
    // -----------------------------------------------------------------
    // 1. INYECCIÓN DE ESTILOS CSS (Diseño unificado y limpio)
    // -----------------------------------------------------------------
    const estilos = `
        /* Bordes definidos para cantidad y platillo */
        .tabular.inline-related table tbody td.field-cantidad input {
            width: 60px !important;
            text-align: center !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            padding: 4px !important;
        }
        
        .tabular.inline-related table tbody td.field-platillo {
            width: 350px !important; /* Ancho fijo para la columna del plato */
            min-width: 350px !important;
            max-width: 350px !important;
        }

        .tabular.inline-related table tbody td.field-platillo .select2-container {
            width: 100% !important; /* Fuerza al buscador a ocupar exactamente los 350px */
            max-width: 100% !important;
        }

        .tabular.inline-related table tbody td.field-platillo .select2-container--default .select2-selection--single {
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            height: 32px !important;
        }

        .tabular.inline-related table tbody td.field-cantidad input {
            width: 60px !important; /* Ancho fijo para la cantidad */
            min-width: 60px !important;
            max-width: 60px !important;
            text-align: center !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            padding: 4px !important;
        }

        /* Ocultar iconos nativos (+, lápiz, ojo) de la izquierda */
        .tabular.inline-related table tbody td.field-platillo .related-widget-wrapper-link,
        .tabular.inline-related table tbody td.field-platillo .add-related,
        .tabular.inline-related table tbody td.field-platillo .change-related {
            display: none !important;
        }
        /* Ocultar iconos nativos (+, lápiz, ojo) de la izquierda */
        .tabular.inline-related table tbody td.field-platillo .related-widget-wrapper-link,
        .tabular.inline-related table tbody td.field-platillo .add-related,
        .tabular.inline-related table tbody td.field-platillo .change-related {
            display: none !important;
        }

        /* Renombrar la columna de borrado */
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

        /* Ocultación segura del checkbox nativo de Django */
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

        /* Diseño exclusivo de nuestro botón rojo de eliminar */
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

        /* Estilización del botón azul "Agregar detalle" */
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
        .button-editar-rapido:hover {
            background-color: #e0a800 !important; /* Un amarillo más oscurito */
            box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
            transform: translateY(-1px);
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = estilos;
    document.head.appendChild(styleSheet);

    // -----------------------------------------------------------------
    // 2. LÓGICA DE CÁLCULO GENERAL EN PANTALLA
    // -----------------------------------------------------------------
    function calcularTotalGeneral() {
        let totalGeneral = 0;
        
        document.querySelectorAll('.tabular.inline-related table tbody tr:not(.empty-form)').forEach(row => {
            // Ignoramos las filas marcadas para borrado
            if (row.classList.contains('deleted_row')) return;

            const selectPlatillo = row.querySelector('.field-platillo select, .field-platillo input[type="hidden"]');
            const cantidadInput = row.querySelector('.field-cantidad input');
            const precioDiv = row.querySelector('.field-precio_formateado p');
            
            // Filtro anti-fantasmas: si no hay platillo real seleccionado, limpiamos precio y saltamos la fila
            if (!selectPlatillo || !selectPlatillo.value || selectPlatillo.value === "") {
                if (precioDiv) precioDiv.textContent = ""; 
                return;
            }
            
            if (cantidadInput && precioDiv) {
                const cantidad = parseFloat(cantidadInput.value) || 0;
                let precioTexto = precioDiv.textContent.replace('$', '').replace(/\./g, '').replace(',', '.');
                const precioPlatillo = parseFloat(precioTexto) || 0;
                
                // --- 1. SUMAR LOS ADICIONALES SELECCIONADOS EN ESTA FILA ---
                let totalAdicionalesFila = 0;
                
                // Buscamos opciones de select seleccionadas u inputs checkbox marcados dentro de la celda de adicionales
                row.querySelectorAll('.adicionales-ocultos select option:selected, .adicionales-ocultos select option:checked, .adicionales-ocultos input:checked').forEach(opcion => {
                    const textoOpcion = opcion.textContent || opcion.innerText || ""; // Ej: "Salsa Cheddar (+$800.00)"
                    
                    // Expresión regular que busca el patrón (+$...) para extraer el precio del texto del admin
                    const match = textoOpcion.match(/\(\+\$([\d.,]+)\)/);
                    if (match) {
                        // Limpiamos los puntos de miles y pasamos la coma a punto decimal
                        let precioAdi = parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0;
                        totalAdicionalesFila += precioAdi;
                    }
                });

                // --- 2. EL TOTAL DE LA FILA ES: (BASE + EXTRAS) * CANTIDAD ---
                const precioFinalItem = precioPlatillo + totalAdicionalesFila;
                totalGeneral += cantidad * precioFinalItem;
            }
        });

        const totalInput = document.querySelector('#id_total');
        if (totalInput) {
            totalInput.value = totalGeneral.toFixed(2);
        }
    }

    // -----------------------------------------------------------------
    // 3. ESCUCHA GLOBAL DE CLICK (Para eliminar filas viejas y nuevas)
    // -----------------------------------------------------------------
    django.jQuery('.tabular.inline-related').on('click', 'td.delete', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const cell = this;
        const row = cell.closest('tr');
        
        // 1. Caso para filas NUEVAS (que todavía no se guardaron en la base de datos)
        if (row.classList.contains('dynamic-form') || row.id.includes('__prefix__') || !row.querySelector('input[type="hidden"][id$="-id"]')?.value) {
            
            // Buscamos el pequeño botón de cruz o enlace nativo que Django usa para remover filas nuevas
            const botonRemoverNativo = row.querySelector('.inline-deletelink');
            if (botonRemoverNativo) {
                botonRemoverNativo.click(); // Esto hace que Django borre la fila del mapa al instante
            } else {
                // Contingencia extrema: si Django todavía no creó el botón nativo, la borramos nosotros a mano
                row.remove();
            }
        } 
        // 2. Caso para filas VIEJAS (que ya existen en la base de datos)
        else {
            const checkbox = cell.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                django.jQuery(checkbox).trigger('change');
                
                if (checkbox.checked) {
                    row.classList.add('deleted_row');
                } else {
                    row.classList.remove('deleted_row');
                }
            }
        }
        
        // Recalculamos el total en la pantalla inmediatamente
        calcularTotalGeneral();
    });

    // -----------------------------------------------------------------
    // 4. EVENTOS DE CAMBIO (Al seleccionar platillo o cantidad)
    // -----------------------------------------------------------------
    django.jQuery(document).on('change', '.field-platillo select', function (e) {
        const select = e.target;
        const row = select.closest('tr');
        const platilloId = select.value;
        const precioDiv = row.querySelector('.field-precio_formateado p');

        if (!platilloId || platilloId === "") {
            if (precioDiv) precioDiv.textContent = "";
            calcularTotalGeneral();
            return;
        }

        // Consultamos el precio a la API del backend
        fetch(`/api/platillos/${platilloId}/precio/`)
            .then(response => response.json())
            .then(data => {
                if (precioDiv) {
                    const precioFormateado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.precio);
                    precioDiv.textContent = precioFormateado;
                }
                calcularTotalGeneral();
            })
            .catch(err => console.error("Error al traer precio:", err));
    });

    django.jQuery(document).on('change', '.field-adicionales select, .field-adicionales input', function () {
        calcularTotalGeneral();
    });

    // Escuchar cambios de teclado o flechitas en las cantidades
    django.jQuery(document).on('input change', '.field-cantidad input', function () {
        calcularTotalGeneral();
    });

    // Ejecución de arranque para sincronizar la pantalla
    setTimeout(calcularTotalGeneral, 300);
});