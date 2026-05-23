import React, { useState, useEffect } from 'react';

const traducciones = {
  es: {
    subtitulo: "CARTA GASTRONÓMICA",
    sinPlatos: "No hay platos en esta categoría aún.",
    categorias: {
      "Entradas": "Entradas",
      "Platos Principales": "Platos Principales",
      "Postres": "Postres",
      "Bebidas": "Bebidas"
    }
  },
  en: {
    subtitulo: "GASTRONOMIC MENU",
    sinPlatos: "No dishes in this category yet.",
    categorias: {
      "Entradas": "Appetizers",
      "Platos Principales": "Main Courses",
      "Postres": "Desserts",
      "Bebidas": "Drinks"
    }
  },
  pt: {
    subtitulo: "CARTA GASTRONÔMICA",
    sinPlatos: "Ainda não há pratos nesta categoria.",
    categorias: {
      "Entradas": "Entradas",
      "Platos Principales": "Pratos Principais",
      "Postres": "Sobremesas",
      "Bebidas": "Bebidas"
    }
  }
};

// FUNCIÓN PARA FORMATEAR MONEDA ($1.250,00)
const formatearMoneda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

export default function MenuPrincipal() {
  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState('es');
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [platillos, setPlatillos] = useState([]);

  const getTexto = (item, campoPrincipal) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (idioma === 'en' && item[`${campoPrincipal}_en`]) return item[`${campoPrincipal}_en`];
    if (idioma === 'pt' && item[`${campoPrincipal}_pt`]) return item[`${campoPrincipal}_pt`];
    return item[campoPrincipal];
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/categorias/')
      .then(response => response.json())
      .then(data => {
        setCategorias(data);
        if (data.length > 0) {
          setCategoriaActiva(data[0].nombre);
        }
      });

    fetch('http://localhost:8000/api/platillos/')
      .then(response => response.json())
      .then(data => setPlatillos(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const t = traducciones[idioma];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-black'}`}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* --- BARRA DE HERRAMIENTAS --- */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-4 items-center">
            <select 
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className={`bg-transparent text-xs font-medium tracking-widest uppercase outline-none cursor-pointer border-b ${darkMode ? 'border-zinc-800' : 'border-black/10'}`}
            >
              <option value="es" className="text-black">ES</option>
              <option value="en" className="text-black">EN</option>
              <option value="pt" className="text-black">PT</option>
            </select>
          </div>

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
          <p className={`text-sm tracking-[0.3em] font-light ${darkMode ? 'text-amber-500/80' : 'text-zinc-400'}`}>
            {t.subtitulo}
          </p>
        </div>

        {/* --- NAVEGACIÓN --- */}
        <div className="flex flex-wrap justify-center gap-8 mb-16 border-b border-zinc-100 dark:border-zinc-900 pb-6">
          {categorias.map((cat, index) => (
            <button 
              key={cat.id || cat.nombre || index}
              onClick={() => setCategoriaActiva(cat.nombre || cat)}
              className={`text-xs tracking-widest uppercase transition-all duration-300 ${
                categoriaActiva === cat.nombre || categoriaActiva === cat
                  ? (darkMode ? 'text-amber-500' : 'text-black font-bold scale-110') 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              {getTexto(cat, 'nombre')}
            </button>
          ))}
        </div>

        {/* --- GRILLA DE PLATOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {platillos.length === 0 ? (
            <p className="col-span-full text-center text-zinc-400 italic">{t.sinPlatos}</p>
          ) : (
            platillos
              .filter(p => p.categoria_nombre === categoriaActiva || p.categoria === categoriaActiva || (categorias.find(c => c.nombre === categoriaActiva) && p.categoria === categorias.find(c => c.nombre === categoriaActiva).id)) 
              .map((plato) => (
              <div 
                key={plato.id} 
                className="group cursor-default transition-all duration-500"
              >
                <div className="flex justify-between items-baseline mb-2 border-b border-dotted border-zinc-200 dark:border-zinc-800 pb-1">
                  <h3 className={`text-lg font-medium transition-colors ${darkMode ? 'group-hover:text-amber-400' : 'group-hover:text-zinc-500'}`} style={{ fontFamily: 'Georgia, serif' }}>
                    {getTexto(plato, 'nombre')}
                  </h3>
                  {/* CAMBIO AQUÍ: Formateamos el precio de los platos */}
                  <span className={`text-sm font-semibold ${darkMode ? 'text-amber-500' : 'text-black'}`}>
                    ${formatearMoneda(plato.precio)}
                  </span>
                </div>
                <p className="text-sm italic leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {getTexto(plato, 'descripcion')}
                </p>
              </div>
            ))
          )}
        </div>

        {/* --- PIE DE PÁGINA --- */}
        <div className="mt-24 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex justify-center gap-10 pb-8">
          <a href="https://www.instagram.com/mariashotelsantiago" className="group flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-amber-500 transition-colors">
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-[10px] tracking-widest uppercase mt-0.5">Instagram</span>
          </a>
          <a href="https://www.facebook.com/mariashotelsgo" className="group flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-amber-500 transition-colors">
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
            <span className="text-[10px] tracking-widest uppercase mt-0.5">Facebook</span>
          </a>
        </div>
      </div>
    </div>
  );
}