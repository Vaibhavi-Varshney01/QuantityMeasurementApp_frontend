import { Routes, Route, Navigate } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  RedirectToSignIn,
} from '@clerk/clerk-react'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar    from './components/Navbar'
import Landing   from './components/Landing'
import Dashboard from './components/Dashboard'

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Clerk-hosted sign-in / sign-up pages */}
        <Route
          path="/sign-in/*"
          element={
            <div className="clerk-page">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="clerk-page">
              <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
