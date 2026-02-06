import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Contacts } from './pages/Contacts'
import { Deals } from './pages/Deals'
import { Calendar } from './pages/Calendar'
import { Communications } from './pages/Communications'
import { Campaigns } from './pages/Campaigns'
import { Payments } from './pages/Payments'
import { Reports } from './pages/Reports'
import { Staff } from './pages/Staff'
import { Settings } from './pages/Settings'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="deals" element={<Deals />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="communications" element={<Communications />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
