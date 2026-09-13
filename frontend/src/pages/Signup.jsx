import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  User,
} from 'lucide-react'
import './Signup.css'

const API_URL = 'http://localhost:5000'

function Signup() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CITIZEN',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      setError('Please fill all required fields.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
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
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-page">

      <div className="signup-background">
        <div className="signup-glow signup-glow-one"></div>
        <div className="signup-glow signup-glow-two"></div>
      </div>

      <div className="signup-container">

        {/* BRAND */}

        <div className="signup-brand">

          <div className="signup-logo">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1>RESQ</h1>
            <span>
              Smart Disaster Response
            </span>
          </div>

        </div>

        {/* SIGNUP CARD */}

        <div className="signup-card">

          <div className="signup-header">

            <div className="signup-icon">
              <UserPlus size={25} />
            </div>

            <h2>
              Create your account
            </h2>

            <p>
              Join RESQ and help build a faster
              disaster response network.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            {/* NAME */}

            <div className="signup-field">

              <label>
                Full Name
              </label>

              <div className="signup-input-wrapper">

                <User size={18} />

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>
            </div>

            {/* EMAIL */}

            <div className="signup-field">

              <label>
                Email Address
              </label>

              <div className="signup-input-wrapper">

                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>
            </div>

            {/* PHONE */}

            <div className="signup-field">

              <label>
                Phone Number
              </label>

              <div className="signup-input-wrapper">

                <Phone size={18} />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />

              </div>
            </div>

            {/* PASSWORD */}

            <div className="signup-field">

              <label>
                Password
              </label>

              <div className="signup-input-wrapper">

                <Lock size={18} />

                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

              </div>
            </div>

            {/* ROLE */}

            <div className="signup-field">

              <label>
                Register as
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >

                <option value="CITIZEN">
                  Citizen
                </option>

                <option value="RESPONSE_TEAM">
                  Response Team
                </option>

                <option value="ADMIN">
                  Admin
                </option>

              </select>

            </div>

            {/* ERROR */}

            {error && (
              <div className="signup-message signup-error">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="signup-message signup-success">
                {success}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="signup-submit"
              disabled={isLoading}
            >
              {isLoading
                ? 'Creating account...'
                : 'Create Account'}
            </button>

          </form>

          {/* LOGIN */}

          <div className="signup-login">

            Already have an account?

            <button
              type="button"
              onClick={() => navigate('/')}
            >
              Login
            </button>

          </div>

        </div>

        {/* BACK */}

        <Link
          to="/"
          className="signup-back"
        >
          <ArrowLeft size={17} />
          Back to RESQ
        </Link>

      </div>
    </div>
  )
}

export default Signup