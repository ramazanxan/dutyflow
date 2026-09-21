import { Navigate, Route, Routes } from 'react-router-dom'
import Welcome from '@/pages/Welcome'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
