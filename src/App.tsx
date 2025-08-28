import { Outlet, NavLink } from 'react-router-dom'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import Preloader from './components/Preloader'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <Preloader minDelayMs={600} />
    </div>
  )
}
