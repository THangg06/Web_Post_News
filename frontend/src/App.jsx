import Home from "./pages/Home";
import './index.css'
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}

export default App;