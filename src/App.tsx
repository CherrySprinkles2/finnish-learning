import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import BackupReminder from './components/BackupReminder'
import { requestPersistence } from './lib/storage'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Words from './pages/Words'
import AddWords from './pages/AddWords'
import Grammar from './pages/Grammar'
import Flashcards from './pages/Flashcards'
import Study from './pages/Study'
import Matching from './pages/Matching'
import Quiz from './pages/Quiz'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'

const ONBOARDED_KEY = 'finnish:onboarded'

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === '1')

  // Ask the browser to keep our storage durable (resist eviction). Best-effort
  // and silent in most browsers; a no-op where already granted/unsupported.
  useEffect(() => {
    void requestPersistence()
  }, [])

  if (!onboarded) {
    return (
      <Welcome
        onContinue={() => {
          localStorage.setItem(ONBOARDED_KEY, '1')
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <BrowserRouter>
      <NavBar />
      <BackupReminder />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/words" element={<Words />} />
        <Route path="/words/add" element={<AddWords />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/study" element={<Study />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
