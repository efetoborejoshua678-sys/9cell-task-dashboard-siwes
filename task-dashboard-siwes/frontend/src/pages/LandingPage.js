import React from 'react';
import landingBg from '../assest/landingpage.png.jpeg';
import appIcon from '../assest/9cel_app-icon.png';

const featureCards = [
  {
    title: 'Keep the day in one view',
    text: 'Bring task details, categories, priorities, and due dates into one focused workspace.',
  },
  {
    title: 'Know where work stands',
    text: 'Move tasks through clear stages and see what is waiting, underway, or complete.',
  },
  {
    title: 'Catch deadlines sooner',
    text: 'See upcoming and overdue task reminders in your dashboard while you work.',
  },
];

export default function LandingPage({ onStart, onLogin }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand-wrap">
          <img src={appIcon} alt="brand logo" className="brand-icon" />
          <span className="brand-name">Task Dashboard</span>
        </div>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#benefits">Benefits</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-header-actions">
          <button type="button" className="landing-login" onClick={onLogin}>Sign in</button>
          <button type="button" className="landing-btn-primary landing-btn-compact" onClick={onStart}>Get started</button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> Less chasing. More finishing.</p>
            <h1>Make room for the work <em>that matters.</em></h1>
            <p className="landing-hero-description">
              Bring priorities, deadlines, and progress into one clear view. Spend less time wondering what is next and more time moving it forward.
            </p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-btn-primary" onClick={onStart}>Start organizing <span aria-hidden="true">-&gt;</span></button>
              <a className="landing-text-link" href="#how-it-works">
                See how it works
                <span className="landing-play-icon" aria-hidden="true" />
              </a>
            </div>
            <p className="landing-hero-note">A calmer home for your day-to-day work.</p>
          </div>

          <div className="landing-visual">
            <img src={landingBg} alt="Task Dashboard board overview" />
          </div>
        </section>

        <section className="landing-audience" aria-label="Work areas">
          <span className="landing-audience-title">One workspace for</span>
          <span>PRODUCT</span><span>DESIGN</span><span>ENGINEERING</span><span>OPERATIONS</span><span>YOUR NEXT BIG THING</span>
        </section>

        <section className="landing-problem">
          <div className="landing-problem-inner">
            <div className="landing-problem-intro">
              <p className="landing-eyebrow landing-eyebrow-light">The problem</p>
              <h2>When everything feels urgent, the important work gets lost.</h2>
              <p>Scattered updates and shifting priorities make a busy day harder than it needs to be.</p>
            </div>
            <div className="landing-problem-list">
              <div><span>01</span><p>Deadlines slip between tools and conversations.</p></div>
              <div><span>02</span><p>Priority changes leave everyone guessing.</p></div>
              <div><span>03</span><p>Progress is difficult to see until the week is over.</p></div>
            </div>
          </div>
        </section>

        <section className="landing-solution">
          <div className="landing-section-copy">
            <p className="landing-eyebrow">The solution</p>
            <h2>A simple system that keeps the whole picture in reach.</h2>
            <p>Capture the task, make its next step clear, and keep its status visible to the people doing the work.</p>
            <a className="landing-text-link" href="#how-it-works">Find your rhythm <span aria-hidden="true">-&gt;</span></a>
          </div>
          <div className="landing-solution-list">
            <div><span className="landing-line-mark" /><div><h3>Know what matters</h3><p>Keep the most important work easy to spot.</p></div></div>
            <div><span className="landing-line-mark" /><div><h3>See what is moving</h3><p>Track progress without chasing another update.</p></div></div>
            <div><span className="landing-line-mark" /><div><h3>Catch what is next</h3><p>Keep due dates visible before they become surprises.</p></div></div>
          </div>
        </section>

        <section className="landing-principle">
          <p className="landing-eyebrow">A better way to work</p>
          <blockquote>“What matters, who owns it, and what happens next” should never be a mystery.</blockquote>
          <span>THE TASK DASHBOARD PRINCIPLE</span>
        </section>

        <section className="landing-benefits" id="benefits">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Features, with a purpose</p>
            <h2>Less mental load. More meaningful progress.</h2>
          </div>
          <div className="landing-benefit-grid">
            {featureCards.map((item, index) => (
              <article className="landing-benefit" key={item.title}>
                <span className="landing-benefit-number">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-how" id="how-it-works">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">How it works</p>
            <h2>Three steps from scattered to steady.</h2>
          </div>
          <div className="landing-steps">
            <article><span>01</span><h3>Gather the work</h3><p>Put tasks and useful context in one shared place.</p></article>
            <article><span>02</span><h3>Set the next move</h3><p>Choose a priority, status, and due date that make sense.</p></article>
            <article><span>03</span><h3>Move it forward</h3><p>Update progress and keep your attention on what is next.</p></article>
          </div>
        </section>

        <section className="landing-objections" id="faq">
          <div className="landing-section-copy">
            <p className="landing-eyebrow">Questions, answered</p>
            <h2>Simple to start. Flexible enough to keep.</h2>
          </div>
          <div className="landing-faq-list">
            <details><summary>Is this only for large teams?</summary><p>No. Use it to organize your own work or share a clear board with a team.</p></details>
            <details><summary>Can I change a task after I create it?</summary><p>Yes. Update its details, deadline, priority, category, or status whenever work changes.</p></details>
            <details><summary>Will I get reminders about due tasks?</summary><p>Upcoming and overdue tasks appear in the dashboard while you are signed in.</p></details>
          </div>
        </section>

        <section className="landing-final-cta">
          <p className="landing-eyebrow landing-eyebrow-light">Make today feel manageable</p>
          <h2>Give your next step a place to land.</h2>
          <p>Start with one task. Build a clearer rhythm from there.</p>
          <button type="button" className="landing-btn-primary landing-btn-light" onClick={onStart}>Get started <span aria-hidden="true">-&gt;</span></button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="brand-wrap">
          <img src={appIcon} alt="" className="brand-icon" />
          <span className="brand-name">Task Dashboard</span>
        </div>
        <p>Make space for focused work.</p>
        <span>© {new Date().getFullYear()} Task Dashboard</span>
      </footer>
    </div>
  );
}
