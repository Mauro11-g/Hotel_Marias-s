import React, { useState, useEffect } from 'react';

const formatearMoneda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

const traducciones = {
  es: {
    subtitulo: "REALIZAR PEDIDO",
    sinPlatos: "No hay platos en esta categoría aún.",
    botonAnadir: "Añadir",
    carritoTitulo: "Tu Pedido",
    carritoVacio: "No has seleccionado ningún platillo.",
    formularioCliente: "Nombre para el pedido",
    formularioMesa: "Habitación",
    formularioNotas: "Notes / Aclaraciones (ej: sin cebolla)",
    botonEnviar: "Confirmar y Enviar Pedido",
    pedidoExito: "¡Pedido enviado con éxito! Se está procesando.",
    total: "Total",
    adicionalesTitulo: "Adicionales:"
  },
  en: {
    subtitulo: "PLACE ORDER",
    sinPlatos: "No dishes in this category yet.",
    botonAnadir: "Add",
    carritoTitulo: "Your Order",
    carritoVacio: "You haven't selected any dishes yet.",
    formularioCliente: "Name for the order",
    formularioMesa: "Room Number",
    formularioNotas: "Notes / Special Requests (e.g., no onions)",
    botonEnviar: "Confirm & Send Order",
    pedidoExito: "Order sent successfully! Processing.",
    total: "Total",
    adicionalesTitulo: "Add-ons:"
  },
  pt: {
    subtitulo: "FAZER PEDIDO",
    sinPlatos: "Ainda não há pratos nesta categoria.",
    botonAnadir: "Adicionar",
    carritoTitulo: "Seu Pedido",
    carritoVacio: "Você não selecionou nenhum prato.",
    formularioCliente: "Nome para o pedido",
    formularioMesa: "Quarto",
    formularioNotas: "Notas / Observações (ex: sem cebola)",
    botonEnviar: "Confirmar e Enviar Pedido",
    pedidoExito: "Pedido enviado com sucesso! Processando.",
    total: "Total",
    adicionalesTitulo: "Adicionais:"
  }
};

export default function PaginaPedidos() {
  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState('es');
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [platillos, setPlatillos] = useState([]);
  const [adicionalesDisponibles, setAdicionalesDisponibles] = useState([]);
  const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState({});

  // --- ESTADOS DEL CARRITO Y FORMULARIO ---
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [notas, setNotas] = useState('');
  const [enviadoExito, setEnviadoExito] = useState(false);
  const [notificacion, setNotificacion] = useState("");

  const getTexto = (item, campoPrincipal) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (idioma === 'en' && item[`${campoPrincipal}_en`]) return item[`${campoPrincipal}_en`];
    if (idioma === 'pt' && item[`${campoPrincipal}_pt`]) return item[`${campoPrincipal}_pt`];
    return item[campoPrincipal];
  };

  useEffect(() => {
    fetch('http://192.168.100.95:8000/api/categorias/')
      .then(response => response.json())
      .then(data => {
        setCategorias(data);
        if (data.length > 0) {
          setCategoriaActiva(data[0].nombre);
        }
      });

    fetch('http://192.168.100.95:8000/api/platillos/')
      .then(response => response.json())
      .then(data => setPlatillos(data))
      .catch(err => console.error("Error:", err));

    // Traemos los adicionales de la API que creaste en Django
    fetch('http://192.168.100.95:8000/api/adicionales/')
      .then(response => response.json())
      .then(data => setAdicionalesDisponibles(data))
      .catch(err => console.error("Error trayendo adicionales:", err));
  }, []);

  // --- MANEJO DE SELECCIÓN DE CHECKBOXES DE ADICIONALES ---
  const manejarCheckboxAdicional = (platilloId, adicionalId) => {
    setAdicionalesSeleccionados(prev => {
      const actuales = prev[platilloId] || [];
      if (actuales.includes(adicionalId)) {
        return { ...prev, [platilloId]: actuales.filter(id => id !== adicionalId) };
      } else {
        return { ...prev, [platilloId]: [...actuales, adicionalId] };
      }
    });
  };

  // --- LÓGICA INTERNA DEL CARRITO ---
  const agregarAlCarrito = (plato) => {
    const idsElegidos = adicionalesSeleccionados[plato.id] || [];
    const adicionalesCompletos = adicionalesDisponibles.filter(a => idsElegidos.includes(a.id));

    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find(item => 
        item.id === plato.id && 
        JSON.stringify(item.adicionales.map(a => a.id).sort()) === JSON.stringify(idsElegidos.sort())
      );

      if (existe) {
        return prevCarrito.map(item => 
          item.id === existe.id && JSON.stringify(item.adicionales.map(a => a.id).sort()) === JSON.stringify(idsElegidos.sort())
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }


      const carritoIdUnique = `${plato.id}-${idsElegidos.join('-')}-${Date.now()}`;

      return [...prevCarrito, { ...plato, carritoId: carritoIdUnique, cantidad: 1, adicionales: adicionalesCompletos }];
    });


    setAdicionalesSeleccionados(prev => ({ ...prev, [plato.id]: [] }));

    setNotificacion(`"${getTexto(plato, 'nombre')}" agregado al pedido`);
    setTimeout(() => setNotificacion(""), 2000);
  };

  const modificarCantidad = (carritoId, incremento) => {
    setCarrito((prevCarrito) => 
      prevCarrito.map(item => {
        if (item.carritoId === carritoId) {
          const nuevaCantidad = Number(item.cantidad) + incremento;
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };


  const obtenerPrecioItemCompleto = (item) => {
    const precioPlato = parseFloat(item.precio) || 0;
    const precioAdicionales = item.adicionales.reduce((sum, a) => sum + (parseFloat(a.precio) || 0), 0);
    return precioPlato + precioAdicionales;
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (obtenerPrecioItemCompleto(item) * item.cantidad), 0).toFixed(2);
  };


  const manejarEnviarPedido = (e) => {
    e.preventDefault();
    if (!cliente || carrito.length === 0) return;

    const datosPedido = {
      cliente: cliente,
      habitacion: mesa,
      total: calcularTotal(),
      notas: notas,
      detalles: carrito.map(item => ({
        platillo_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio).toFixed(2),
        adicionales: item.adicionales.map(a => a.id)
      }))
    };

    fetch('http://10.0.13.108:8000/api/pedidos/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosPedido),
    })
    .then(response => {
      if (response.ok) {
        setEnviadoExito(true);
        setCarrito([]);
        setCliente('');
        setMesa('');
        setNotas('');
        setTimeout(() => setEnviadoExito(false), 5000);
      }
    })
    .catch(err => console.error("Error enviando pedido:", err));
  };

  const t = traducciones[idioma];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-black'}`}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* --- BARRA DE HERRAMIENTAS --- */}
        <div className="flex justify-between items-center mb-12">
          <select 
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
            className={`bg-transparent text-xs font-medium tracking-widest uppercase outline-none cursor-pointer border-b ${darkMode ? 'border-zinc-800 text-white' : 'border-black/10 text-black'}`}
          >
            <option value="es" className="text-black">ES</option>
            <option value="en" className="text-black">EN</option>
            <option value="pt" className="text-black">PT</option>
          </select>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-transform active:scale-90 ${darkMode ? 'text-amber-400' : 'text-black'}`}
          >
            {darkMode ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            )}
          </button>
        </div>

        {/* --- TÍTULO --- */}
        <div className="text-center mb-16 flex flex-col items-center">
          <img 
            src="./logo2.png" 
            alt="Logo Las Marías" 
            className={`h-42 mb-6 transition-all duration-500 ${darkMode ? 'invert opacity-90' : ''}`}
          />
          <div className={`w-12 h-px mx-auto mb-4 ${darkMode ? 'bg-amber-500' : 'bg-black'}`}></div>
          <p className={`text-sm tracking-[0.3em] font-light ${darkMode ? 'text-amber-400/80' : 'text-zinc-400'}`}>
            {t.subtitulo}
          </p>
        </div>

        {/* --- CONTENIDO DIVIDIDO EN DOS COLUMNAS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          
          {/* COLUMNA DE PLATOS */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-6 mb-10 border-b border-zinc-100 dark:border-zinc-900 pb-4">
              {categorias.map((cat, index) => (
                <button 
                  key={cat.id || cat.nombre || index}
                  onClick={() => setCategoriaActiva(cat.nombre || cat)}
                  className={`text-xs tracking-widest uppercase transition-all duration-300 ${
                    categoriaActiva === cat.nombre || categoriaActiva === cat
                      ? (darkMode ? 'text-amber-500 border-b border-amber-500' : 'text-black font-bold border-b border-black scale-105') 
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                  }`}
                >
                  {getTexto(cat, 'nombre')}
                </button>
              ))}
            </div>

            <div className="space-y-10">
              {platillos.length === 0 ? (
                <p className="text-zinc-400 italic">{t.sinPlatos}</p>
              ) : (
                platillos
                  .filter(p => p.categoria_nombre === categoriaActiva || p.categoria === categoriaActiva || (categorias.find(c => c.nombre === categoriaActiva) && p.categoria === categorias.find(c => c.nombre === categoriaActiva).id)) 
                  .map((plato) => (
                    <div key={plato.id} className="group border-b border-zinc-100 dark:border-zinc-900/50 pb-6">
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-lg font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                          {getTexto(plato, 'nombre')}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-semibold ${darkMode ? 'text-amber-500' : 'text-black'}`}>
                            ${formatearMoneda(plato.precio)}
                          </span>
                          <button
                            onClick={() => agregarAlCarrito(plato)}
                            className={`text-xs uppercase tracking-wider px-3 py-1 border transition-colors ${
                              darkMode 
                                ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black' 
                                : 'border-zinc-300 text-zinc-700 hover:bg-black hover:text-white'
                            }`}
                          >
                            {t.botonAnadir}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm italic text-zinc-500 dark:text-zinc-400 max-w-xl mb-4">
                        {getTexto(plato, 'descripcion')}
                      </p>

                      {/* CORRECCIÓN AQUÍ: COMPROBAMOS SI ESTE PLATO TIENE ADICIONALES PERMITIDOS ANTES DE RENDERIZAR */}
                      {adicionalesDisponibles.filter(adi => adi.platillos_permitidos && adi.platillos_permitidos.includes(plato.id)).length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                          <p className="text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">{t.adicionalesTitulo}</p>
                          <div className="flex flex-wrap gap-4">
                            {adicionalesDisponibles
                            .filter(adi => adi.platillos_permitidos && adi.platillos_permitidos.includes(plato.id))
                            .map(adi => (
                              <label key={adi.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={(adicionalesSeleccionados[plato.id] || []).includes(adi.id)}
                                  onChange={() => manejarCheckboxAdicional(plato.id, adi.id)}
                                  className="accent-amber-500 rounded"
                                />
                                <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                                  {getTexto(adi, 'nombre')} (+${formatearMoneda(adi.precio)})
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* COLUMNA DEL CARRITO */}
          <div className={`p-6 border ${darkMode ? 'bg-zinc-900/30 border-zinc-900' : 'bg-zinc-50/50 border-zinc-100'}`}>
            <h2 className="text-xl font-medium mb-6 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              {t.carritoTitulo}
            </h2>

            {enviadoExito && (
              <div className="mb-6 p-3 text-sm text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t.pedidoExito}
              </div>
            )}

            {carrito.length === 0 ? (
              <p className="text-sm italic text-zinc-400">{t.carritoVacio}</p>
            ) : (
              <form onSubmit={manejarEnviarPedido} className="space-y-6">
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {carrito.map((item) => (
                    <div key={item.carritoId} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                      <div className="flex-1 pr-2">
                        <p className="font-medium">{getTexto(item, 'nombre')}</p>
                        
                        {/* Mostrar adicionales pegados a este plato en el carrito */}
                        {item.adicionales.length > 0 && (
                          <p className="text-[11px] text-amber-500 italic">
                            + {item.adicionales.map(a => getTexto(a, 'nombre')).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400">${formatearMoneda(obtenerPrecioItemCompleto(item))} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => modificarCantidad(item.carritoId, -1)} className="px-2 py-0.5 border border-zinc-700 hover:bg-zinc-800 text-xs">-</button>
                        <span className="w-8 text-center text-xs">{item.cantidad}</span>
                        <button type="button" onClick={() => modificarCantidad(item.carritoId, 1)} className="px-2 py-0.5 border border-zinc-700 hover:bg-zinc-800 text-xs">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex justify-between font-semibold">
                  <span>{t.total}:</span>
                  <span className={darkMode ? 'text-amber-400' : 'text-black'}>${formatearMoneda(calcularTotal())}</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{t.formularioCliente} *</label>
                    <input 
                      type="text" 
                      required
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className={`w-full px-3 py-2 text-sm bg-transparent border outline-none ${darkMode ? 'border-zinc-800 focus:border-amber-500' : 'border-zinc-200 focus:border-black'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{t.formularioMesa}</label>
                    <input 
                      type="text" 
                      required
                      placeholder='Ej: 104'
                      value={mesa}
                      onChange={(e) => setMesa(e.target.value)}
                      className={`w-full px-3 py-2 text-sm bg-transparent border outline-none ${darkMode ? 'border-zinc-800 focus:border-amber-500' : 'border-zinc-200 focus:border-black'}`}
                    />
                  </div>

                  {/* NUEVO CAMPO DE NOTAS ADENTRO DEL FORMULARIO */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{t.formularioNotas}</label>
                    <textarea 
                      rows="2"
                      placeholder="..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className={`w-full px-3 py-2 text-sm bg-transparent border outline-none resize-none ${darkMode ? 'border-zinc-800 focus:border-amber-500' : 'border-zinc-200 focus:border-black'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full text-center text-xs uppercase tracking-widest py-3 font-semibold bg-amber-500 text-black hover:bg-amber-600 transition-colors"
                >
                  {t.botonEnviar}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {notificacion && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950 px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce text-xs font-medium tracking-wider uppercase transition-all duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {notificacion}
        </div>
      )}

    </div>
  );
}