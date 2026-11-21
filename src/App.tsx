import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/RequireAuth";

/**
 * Root application component that wires all routes.
 * Protected routes (e.g. /cart) are wrapped with RequireAuth
 * so that unauthenticated guests are redirected to /login?next=.
 * @spec (spec §23.3, §23.4)
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/cart"
        element={
          <RequireAuth>
            <Cart />
          </RequireAuth>
        }
      />
      <Route path="/products" element={<Products />} />
      <Route
        path="/products/:id"
        element={
          <RequireAuth>
            <ProductDetail />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
