import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPrincipal from './pages/menu_principal';
import PaginaPedidos from './pages/pagina_pedidos'; // La crearemos ahora

function App() {
  return (
    <Router>
      <Routes>
        {/* Cuando la URL sea "/" (inicio), muestra el menú de siempre */}
        <Route path="/" element={<MenuPrincipal />} />
        
        {/* Cuando la URL sea "/pedidos", muestra la nueva página */}
        <Route path="/pedidos" element={<PaginaPedidos />} />
      </Routes>
    </Router>
  );
}

export default App;