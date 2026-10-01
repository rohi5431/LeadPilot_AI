import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LeadsPage from './pages/LeadsPage'
import LeadDetailsPage from './pages/LeadDetailsPage'
import AddLeadPage from './pages/AddLeadPage'

/**
 * App — root component with React Router v6 routing.
 *
 * Routes:
 *   /leads            → LeadsPage    (all leads list)
 *   /leads/:leadId    → LeadDetailsPage
 *   /add-lead         → AddLeadPage
 *   /                 → redirect to /leads
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:leadId" element={<LeadDetailsPage />} />
        <Route path="/add-lead" element={<AddLeadPage />} />
        {/* Redirect root to leads list */}
        <Route path="/" element={<Navigate to="/leads" replace />} />
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/leads" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
