import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Resin from './pages/Resin'
import Talent from './pages/Talent'
import Talent2 from './pages/Talent2'
import Weapon from './pages/Weapon'
import Weapon2 from './pages/Weapon2'
import Damage from './pages/Damage'
import ArtifactExp from './pages/ArtifactExp'

export default function App() {
  return (
    <div className="min-h-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resin" element={<Resin />} />
        <Route path="/talent" element={<Talent />} />
        <Route path="/talent2" element={<Talent2 />} />
        <Route path="/weapon" element={<Weapon />} />
        <Route path="/weapon2" element={<Weapon2 />} />
        <Route path="/damage" element={<Damage />} />
        <Route path="/artifact-exp" element={<ArtifactExp />} />
        <Route
          path="*"
          element={
            <div className="text-center text-neutral-400 py-20">
              ページが見つかりません
            </div>
          }
        />
      </Routes>
    </div>
  )
}
