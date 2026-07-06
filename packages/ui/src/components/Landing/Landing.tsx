import { useNavigate } from 'react-router-dom'
import { CircuitDecor } from './components/CircuitDecor/CircuitDecor'
import styles from './Landing.module.css'

export const Landing = (): JSX.Element => {
  const navigate = useNavigate()

  return (
    <div className={styles.landing}>
      <div className={`${styles.circuitWrap} ${styles.circuitLeft}`}>
        <CircuitDecor />
      </div>
      <div className={`${styles.circuitWrap} ${styles.circuitRight}`}>
        <CircuitDecor />
      </div>

      <main className={styles.hero}>
        <h1 className={styles.solidTitle}>ARK SYSTEMS</h1>
        <div className={styles.outlineTitle}>SUPPORT AI AGENT</div>

        <p className={styles.lede}>
          Ark Systems Support AI is an AI customer-support agent. It answers from an approved knowledge
          base, applies deterministic business rules before any model call, personalizes with live
          customer context, and escalates to a human when the rules require it.
        </p>
        <p className={styles.lede}>
          Each message runs one pipeline: retrieval, then a deterministic rules engine that decides whether
          to answer, route, or escalate — only an “answer” reaches the LLM, with high-stakes calls like
          refund eligibility computed in code. Every request emits a full decision trace you can replay in
          the Dashboard.
        </p>
        <p className={styles.ledeNote}>
          Salesforce and Zendesk are mocked at the integration boundary — swappable for the real APIs
          without touching business logic.
        </p>

        <button className={styles.cta} onClick={() => navigate('/chat')}>ENTER CONSOLE</button>
      </main>
    </div>
  )
}
