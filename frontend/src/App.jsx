import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPrincipal from './pages/menu_principal';
import PaginaPedidos from './pages/pagina_pedidos';

function App() {
  return (
    <Router basename="/carta">
      <Routes>
        <Route path="/" element={<MenuPrincipal />} />
        
        <Route path="/pedidos" element={<PaginaPedidos />} />
      </Routes>
    </Router>
  );
}

export default App;