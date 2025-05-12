
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Land from './pages/Landing';
import { Chat } from './pages/Chat';

function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Land />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
