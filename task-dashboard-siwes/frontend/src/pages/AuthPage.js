import React, { useState } from 'react';
import authBg from '../assest/login_signup.png';
import logo from '../assest/9cell_app-logo.png';

export default function AuthPage({
  mode,
  setMode,
  onBackToLanding,
  onSubmit,
  formData,
  setFormData,
  isSubmitting,
  oauthProvider,
  onOAuth,
  error,
}) {
  const isLogin = mode === 'login';
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="auth-page"
      style={{
        '--auth-background': `url(${authBg})`,
      }}
    >
      <button type="button" className="auth-back" onClick={onBackToLanding}>
        <span aria-hidden="true">&lt;-</span> Back to home
      </button>

      <main className="auth-split-card">
        <section className="auth-visual-panel">
          <div className="auth-visual-brand">
            <img src={logo} alt="" />
            <span>Task Dashboard</span>
          </div>
          <div className="auth-visual-copy">
            <p>{isLogin ? 'GOOD TO SEE YOU AGAIN' : 'YOUR WORK, IN ONE PLACE'}</p>
            <h1>{isLogin ? <>Welcome<br />back.</> : <>Create your<br />account.</>}</h1>
            <span>{isLogin ? 'Pick up where your best work begins.' : 'Bring your tasks into focus and move projects forward.'}</span>
          </div>
          <div className="auth-visual-footer"><span /> CLEAR YOUR HEAD. KEEP YOUR DAY IN VIEW.</div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-kicker">TASK DASHBOARD</p>
            <h2>{isLogin ? 'Welcome back' : 'Sign Up'}</h2>
            <p>{isLogin ? 'Sign in to continue to your workspace.' : 'Create your account and get started.'}</p>
          </div>

          <div className="auth-toggle" role="tablist" aria-label="Account type">
            <button type="button" className={isLogin ? 'active' : ''} role="tab" aria-selected={isLogin} onClick={() => setMode('login')}>
              Sign in
            </button>
            <button type="button" className={!isLogin ? 'active' : ''} role="tab" aria-selected={!isLogin} onClick={() => setMode('signup')}>
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {!isLogin && (
              <div className="auth-name-fields">
                <label className="auth-field">
                  <span className="sr-only">First name</span>
                  <input type="text" value={formData.firstName} onChange={(event) => setFormData((previous) => ({ ...previous, firstName: event.target.value }))} placeholder="First name" autoComplete="given-name" required />
                </label>
                <label className="auth-field">
                  <span className="sr-only">Last name</span>
                  <input type="text" value={formData.lastName} onChange={(event) => setFormData((previous) => ({ ...previous, lastName: event.target.value }))} placeholder="Last name" autoComplete="family-name" required />
                </label>
              </div>
            )}

            <label className="auth-field">
              <span className="sr-only">Email address</span>
              <input type="email" value={formData.email} onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))} placeholder="Email address" autoComplete="email" required />
            </label>

            <label className="auth-field auth-password-field">
              <span className="sr-only">Password</span>
              <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))} placeholder="Password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={6} required />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
            </label>

            {!isLogin && (
              <>
                <label className="auth-field">
                  <span className="sr-only">Confirm password</span>
                  <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(event) => setFormData((previous) => ({ ...previous, confirmPassword: event.target.value }))} placeholder="Confirm password" autoComplete="new-password" minLength={6} required />
                </label>
                <label className="auth-terms">
                  <input type="checkbox" checked={formData.acceptedTerms} onChange={(event) => setFormData((previous) => ({ ...previous, acceptedTerms: event.target.checked }))} required />
                  <span>I accept the <strong>Terms &amp; Conditions</strong></span>
                </label>
              </>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button type="submit" className="auth-submit" disabled={isSubmitting || Boolean(oauthProvider)}>
              {isSubmitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Join us'} <span aria-hidden="true">-&gt;</span>
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-socials">
            <button type="button" className="auth-social-btn" onClick={() => onOAuth('google')} disabled={isSubmitting || Boolean(oauthProvider)}>
              <span className="auth-google-mark" aria-hidden="true">G</span>
              {oauthProvider === 'google' ? 'Connecting...' : `${isLogin ? 'Sign in' : 'Sign up'} with Google`}
            </button>
            <button type="button" className="auth-social-btn" onClick={() => onOAuth('apple')} disabled={isSubmitting || Boolean(oauthProvider)}>
              <span className="auth-apple-mark" aria-hidden="true" />
              {oauthProvider === 'apple' ? 'Connecting...' : `${isLogin ? 'Sign in' : 'Sign up'} with Apple`}
            </button>
          </div>

          <p className="auth-switch-copy">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}
