import { useNavigate } from 'react-router-dom'
import { CircuitDecor } from './components/CircuitDecor/CircuitDecor'
import { AppButton } from '@components/AppButton/AppButton'
import styles from './Landing.module.css'

export const Landing = (): JSX.Element => {
  const navigate = useNavigate()

  return (
    <div className={styles.landing}>
      <div className={styles.circuitWrap}>
        <CircuitDecor />
      </div>

      <main className={styles.hero}>
        <h1 className={styles.solidTitle}>ARK SYSTEMS</h1>
        <div className={styles.outlineTitle}>SUPPORT AI AGENT</div>

        <p className={styles.lede}>
          Ark Systems is a global, fictional B2B and B2C technology company — building consumer and
          business laptops, enterprise servers and storage, the ArkCloud platform, and a full line of
          peripherals — for customers ranging from individual buyers to enterprise and VIP contract
          accounts.
        </p>
        <p className={styles.lede}>
          A production-grade support agent built on a deterministic orchestration pipeline: RAG-based
          retrieval feeds a rules engine that decides whether to answer, route, or escalate. The LLM sits
          behind a guarded boundary — invoked only for approved answers, with high-stakes logic like refund
          eligibility computed in code. Customer context flows from CRM/ticketing behind a swappable
          integration boundary, escalation is policy-enforced, and every request emits a full, replayable
          decision trace.
        </p>
        <p className={styles.ledeNote}>
          Salesforce and Zendesk are mocked at the integration boundary — swappable for the real APIs
          without touching business logic.
        </p>

        <AppButton variant="cta" onClick={() => navigate('/chat')} className={styles.cta}>ENTER CONSOLE</AppButton>
      </main>

      <div className={`${styles.circuitWrap} ${styles.circuitRight}`}>
        <CircuitDecor />
      </div>
    </div>
  )
}
