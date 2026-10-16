import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
  Users,
  Phone,
  Mail,
  Lock,
  User,
} from 'lucide-react'

import './Register.css'

const API_URL = 'http://localhost:5000'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [role, setRole] = useState('CITIZEN')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            phone,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Registration failed'
        )
      }

      setSuccess(
        'Account created successfully! Redirecting to login...'
      )

      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      console.error('Registration error:', error)

      setError(
        error.message ||
          'Something went wrong during registration.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">

      {/* HEADER */}

      <header className="register-header">

        <button
          className="register-brand"
          onClick={() => navigate('/')}
        >
          <div className="register-brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong>RESQ</strong>
            <span>SMART RESPONSE</span>
          </div>
        </button>

        <button
          className="back-home"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>

      </header>


      {/* MAIN */}

      <main className="register-main">

        <div className="register-card">

          {/* LEFT */}

          <div className="register-info">

            <div className="register-info-icon">
              <UserPlus size={34} />
            </div>

            <span className="register-label">
              JOIN THE NETWORK
            </span>

            <h1>
              Create your
              <span> RESQ account.</span>
            </h1>

            <p>
              Join the smart disaster response network
              and stay connected when every second matters.
            </p>

            <div className="register-points">

              <div>
                <ShieldCheck size={19} />
                <span>Secure account access</span>
              </div>

              <div>
                <Users size={19} />
                <span>Connected response network</span>
              </div>

              <div>
                <UserPlus size={19} />
                <span>Fast emergency reporting</span>
              </div>

            </div>

          </div>


          {/* FORM */}

          <div className="register-form-area">

            <span className="form-label">
              CREATE ACCOUNT
            </span>

            <h2>Sign up to RESQ</h2>

            <p className="form-subtitle">
              Enter your details to create your account.
            </p>

            <form onSubmit={handleRegister}>

              {/* NAME */}

              <label htmlFor="name">
                Full name
              </label>

              <div className="input-wrapper">

                <User size={18} />

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />

              </div>


              {/* EMAIL */}

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

              </div>


              {/* PHONE */}

              <label htmlFor="phone">
                Phone number
              </label>

              <div className="input-wrapper">

                <Phone size={18} />

                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  required
                />

              </div>


              {/* PASSWORD */}

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <Lock size={18} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>


              {/* ROLE */}

              <label>
                Account type
              </label>

              <div className="register-role">

                <button
                  type="button"
                  className={
                    role === 'CITIZEN'
                      ? 'register-role-btn active'
                      : 'register-role-btn'
                  }
                  onClick={() =>
                    setRole('CITIZEN')
                  }
                >
                  <Users size={17} />
                  Citizen
                </button>

                <button
                  type="button"
                  className={
                    role === 'RESPONSE_TEAM'
                      ? 'register-role-btn active'
                      : 'register-role-btn'
                  }
                  onClick={() =>
                    setRole('RESPONSE_TEAM')
                  }
                >
                  <ShieldCheck size={17} />
                  Response Team
                </button>

              </div>


              {/* ERROR */}

              {error && (
                <div className="register-message error">
                  {error}
                </div>
              )}


              {/* SUCCESS */}

              {success && (
                <div className="register-message success">
                  {success}
                </div>
              )}


              {/* SUBMIT */}

              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create Account'}

                {!loading && (
                  <ArrowRight size={18} />
                )}
              </button>

            </form>


            {/* LOGIN */}

            <div className="already-account">

              <span>
                Already have an account?
              </span>

              <button
                onClick={() => navigate('/')}
              >
                Sign in
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}

export default Register