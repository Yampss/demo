import React, { useState, useEffect } from 'react';
import { loanAPI, accountAPI } from '../api';
import Sidebar from '../components/Sidebar';

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loanTypes, setLoanTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-loans');
  const [applyForm, setApplyForm] = useState({ account_id: '', loan_type: 'personal', principal_amount: '', term_months: '', purpose: '' });
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState('');
  const [repaying, setRepaying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loanRes, accRes, typesRes] = await Promise.all([
        loanAPI.getMyLoans(),
        accountAPI.getMyAccounts(),
        loanAPI.getTypes(),
      ]);
      setLoans(loanRes.data.data);
      setAccounts(accRes.data.data);
      setLoanTypes(typesRes.data.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setMessage(null);
    try {
      await loanAPI.apply({
        ...applyForm,
        account_id: parseInt(applyForm.account_id),
        principal_amount: parseFloat(applyForm.principal_amount),
        term_months: parseInt(applyForm.term_months),
      });
      setMessage({ type: 'success', text: 'Loan application submitted successfully!' });
      setApplyForm({ account_id: '', loan_type: 'personal', principal_amount: '', term_months: '', purpose: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Application failed' });
    } finally {
      setApplying(false);
    }
  };

  const handleRepay = async (loanId) => {
    if (!repayAmount || !repayAccount) return;
    setRepaying(true);
    try {
      await loanAPI.repay(loanId, { amount: parseFloat(repayAmount), account_id: parseInt(repayAccount) });
      setSelectedLoan(null);
      setRepayAmount('');
      setRepayAccount('');
      loadData();
    } catch (err) {
    } finally {
      setRepaying(false);
    }
  };

  const calcMonthly = () => {
    if (!applyForm.principal_amount || !applyForm.loan_type || !applyForm.term_months) return null;
    const rate = loanTypes[applyForm.loan_type]?.rate;
    if (!rate) return null;
    const principal = parseFloat(applyForm.principal_amount);
    const monthlyRate = rate / 100 / 12;
    const n = parseInt(applyForm.term_months);
    const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return isNaN(monthly) ? null : monthly.toFixed(2);
  };

  const monthly = calcMonthly();

  const statusColor = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', closed: 'badge-info' };

  return (
    <div style={styles.pageLayout}>
      <Sidebar active="loans" />
      <div style={styles.content} className="fade-in">
        <h1 style={styles.pageTitle}>Loans</h1>

        <div style={styles.tabs}>
          {[{ id: 'my-loans', label: 'My Loans' }, { id: 'apply', label: 'Apply for Loan' }].map((tab) => (
            <button key={tab.id} style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }} onClick={() => { setActiveTab(tab.id); setMessage(null); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'my-loans' && (
          <div>
            {loading ? (
              <div style={styles.center}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : loans.length === 0 ? (
              <div className="card" style={styles.emptyState}>
                <div style={styles.emptyIcon}>🏦</div>
                <p style={{ marginBottom: '16px' }}>No loans yet</p>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('apply')}>Apply for a Loan</button>
              </div>
            ) : (
              <div style={styles.loanGrid}>
                {loans.map((loan) => (
                  <div key={loan.id} className="card" style={styles.loanCard}>
                    <div style={styles.loanHeader}>
                      <div>
                        <div style={styles.loanType}>{loan.loan_type.toUpperCase()} LOAN</div>
                        <div style={styles.loanId}>ID #{loan.id}</div>
                      </div>
                      <span className={`badge ${statusColor[loan.status]}`}>{loan.status}</span>
                    </div>

                    <div style={styles.loanAmount}>${parseFloat(loan.principal_amount).toLocaleString()}</div>
                    <div style={styles.loanSub}>Principal Amount</div>

                    <div style={styles.loanStats}>
                      <div style={styles.loanStat}>
                        <div style={styles.loanStatLabel}>Interest Rate</div>
                        <div style={styles.loanStatValue}>{loan.interest_rate}%</div>
                      </div>
                      <div style={styles.loanStat}>
                        <div style={styles.loanStatLabel}>Term</div>
                        <div style={styles.loanStatValue}>{loan.term_months}mo</div>
                      </div>
                      <div style={styles.loanStat}>
                        <div style={styles.loanStatLabel}>Monthly EMI</div>
                        <div style={styles.loanStatValue}>${parseFloat(loan.monthly_payment).toLocaleString()}</div>
                      </div>
                    </div>

                    {loan.status === 'approved' && (
                      <div style={styles.repayProgress}>
                        <div style={styles.progressLabel}>
                          <span>Outstanding</span>
                          <span className="text-warning">${parseFloat(loan.outstanding_amount).toLocaleString()}</span>
                        </div>
                        <div style={styles.progressBar}>
                          <div style={{
                            ...styles.progressFill,
                            width: `${((1 - loan.outstanding_amount / loan.total_payable) * 100).toFixed(1)}%`
                          }} />
                        </div>
                      </div>
                    )}

                    {loan.status === 'approved' && (
                      <button className="btn btn-primary btn-sm" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedLoan(loan)}>
                        Make Repayment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'apply' && (
          <div style={styles.formWrap}>
            <div className="card" style={styles.formCard}>
              <h3 style={styles.formTitle}>Loan Application</h3>

              {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

              <form onSubmit={handleApply} style={styles.form}>
                <div className="input-group">
                  <label>Disbursement Account</label>
                  <select value={applyForm.account_id} onChange={(e) => setApplyForm({ ...applyForm, account_id: e.target.value })} required>
                    <option value="">Select account...</option>
                    {accounts.filter(a => a.status === 'active').map(a => (
                      <option key={a.id} value={a.id}>{a.account_type} - {a.account_number}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Loan Type</label>
                  <select value={applyForm.loan_type} onChange={(e) => setApplyForm({ ...applyForm, loan_type: e.target.value })}>
                    {Object.entries(loanTypes).map(([type, info]) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} — {info.rate}% p.a., max {info.maxTerm} months
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Loan Amount (USD)</label>
                    <input type="number" min="100" step="100" placeholder="10000" value={applyForm.principal_amount} onChange={(e) => setApplyForm({ ...applyForm, principal_amount: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Term (Months)</label>
                    <input type="number" min="1" placeholder="12" value={applyForm.term_months} onChange={(e) => setApplyForm({ ...applyForm, term_months: e.target.value })} required />
                  </div>
                </div>

                {monthly && (
                  <div style={styles.emiCard}>
                    <div style={styles.emiLabel}>Estimated Monthly EMI</div>
                    <div style={styles.emiAmount}>${monthly}</div>
                  </div>
                )}

                <div className="input-group">
                  <label>Purpose</label>
                  <input type="text" placeholder="What's this loan for?" value={applyForm.purpose} onChange={(e) => setApplyForm({ ...applyForm, purpose: e.target.value })} />
                </div>

                <button className="btn btn-primary" style={{ padding: '14px' }} disabled={applying}>
                  {applying ? <span className="spinner" /> : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        )}

        {selectedLoan && (
          <div style={styles.modal} onClick={() => setSelectedLoan(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="fade-in">
              <h3 style={styles.modalTitle}>Loan Repayment</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Outstanding: <strong className="text-warning">${parseFloat(selectedLoan.outstanding_amount).toLocaleString()}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>Repay from Account</label>
                  <select value={repayAccount} onChange={(e) => setRepayAccount(e.target.value)}>
                    <option value="">Select account...</option>
                    {accounts.filter(a => a.status === 'active').map(a => (
                      <option key={a.id} value={a.id}>{a.account_type} - {a.account_number} (${parseFloat(a.balance).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Amount</label>
                  <input type="number" min="1" step="0.01" placeholder="0.00" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleRepay(selectedLoan.id)} disabled={repaying}>
                    {repaying ? <span className="spinner" /> : 'Pay Now'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageLayout: { display: 'flex', minHeight: '100vh' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' },
  pageTitle: { fontSize: '26px', fontWeight: '700', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content', border: '1px solid var(--border-color)' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'var(--accent-primary)', color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  center: { display: 'flex', justifyContent: 'center', padding: '40px' },
  emptyState: { textAlign: 'center', padding: '48px', color: 'var(--text-muted)' },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  loanGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  loanCard: { padding: '24px' },
  loanHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  loanType: { fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '1px' },
  loanId: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' },
  loanAmount: { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  loanSub: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' },
  loanStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
  loanStat: { textAlign: 'center' },
  loanStatLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' },
  loanStatValue: { fontSize: '15px', fontWeight: '700' },
  repayProgress: { marginTop: '16px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' },
  progressBar: { height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px', transition: 'width 0.5s' },
  formWrap: { display: 'flex', justifyContent: 'center' },
  formCard: { width: '100%', maxWidth: '520px', padding: '36px' },
  formTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  emiCard: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  emiLabel: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' },
  emiAmount: { fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '32px', width: '420px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '12px' },
};

export default LoansPage;
