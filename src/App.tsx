import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import WorkLogs from './pages/WorkLogs'
import Samples from './pages/Samples'
import Equipment from './pages/Equipment'
import Reagents from './pages/Reagents'
import Todos from './pages/Todos'
import Methods from './pages/Methods'
import Stats from './pages/Stats'
import Calculator from './pages/Calculator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/worklogs"   element={<WorkLogs />}   />
          <Route path="/samples"    element={<Samples />}    />
          <Route path="/equipment"  element={<Equipment />}  />
          <Route path="/reagents"   element={<Reagents />}   />
          <Route path="/todos"      element={<Todos />}      />
          <Route path="/methods"    element={<Methods />}    />
          <Route path="/stats"      element={<Stats />}      />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
