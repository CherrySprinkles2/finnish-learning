import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Words from './pages/Words'
import Grammar from './pages/Grammar'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/words" element={<Words />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/grammar" element={<Grammar />} />
      </Routes>
    </BrowserRouter>
  )
}
