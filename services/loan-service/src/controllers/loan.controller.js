const axios = require('axios');
const Loan = require('../models/loan.model');

const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || 'http://account-service:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal_secret_key';
const internalHeaders = { 'x-internal-key': INTERNAL_API_KEY };

const LOAN_RATES = {
  personal: { rate: 12.5, maxTerm: 60 },
  home: { rate: 8.5, maxTerm: 360 },
  auto: { rate: 10.0, maxTerm: 84 },
  business: { rate: 14.0, maxTerm: 120 },
  education: { rate: 7.0, maxTerm: 120 },
};

const applyForLoan = async (req, res) => {
  try {
    const { account_id, loan_type, principal_amount, term_months, purpose } = req.body;
    const user_id = req.user.id;

    const loanConfig = LOAN_RATES[loan_type];
    if (!loanConfig) return res.status(400).json({ success: false, message: 'Invalid loan type' });
    if (term_months > loanConfig.maxTerm) {
      return res.status(400).json({ success: false, message: `Max term for ${loan_type} loan is ${loanConfig.maxTerm} months` });
    }

    const loan = await Loan.create({
      user_id, account_id, loan_type, principal_amount,
      interest_rate: loanConfig.rate, term_months, purpose,
    });

    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
      user_id,
      type: 'loan',
      title: 'Loan Application Received',
      message: `Your ${loan_type} loan application for $${principal_amount} has been received and is under review.`,
      metadata: { loan_id: loan.id },
    }, { headers: internalHeaders }).catch(() => {});

    return res.status(201).json({ success: true, data: loan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.findByUserId(req.user.id);
    return res.status(200).json({ success: true, data: loans });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return res.status(200).json({ success: true, data: loan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const approveLoan = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'pending') return res.status(400).json({ success: false, message: 'Loan is not in pending state' });

    const updated = await Loan.updateStatus(req.params.id, status, req.user.id);

    if (status === 'approved') {
      await axios.post(
        `${ACCOUNT_SERVICE_URL}/api/accounts/internal/credit`,
        { account_id: loan.account_id, amount: loan.principal_amount },
        { headers: internalHeaders }
      );
    }

    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
      user_id: loan.user_id,
      type: 'loan',
      title: `Loan ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: status === 'approved'
        ? `Your loan of $${loan.principal_amount} has been approved and disbursed.`
        : `Your loan application has been rejected.`,
      metadata: { loan_id: loan.id },
    }, { headers: internalHeaders }).catch(() => {});

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const repayLoan = async (req, res) => {
  try {
    const { amount, account_id } = req.body;
    const user_id = req.user.id;
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.user_id !== user_id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (loan.status !== 'approved') return res.status(400).json({ success: false, message: 'Loan is not active' });
    if (amount > loan.outstanding_amount) return res.status(400).json({ success: false, message: 'Amount exceeds outstanding' });

    await axios.post(
      `${ACCOUNT_SERVICE_URL}/api/accounts/internal/debit`,
      { account_id, amount },
      { headers: internalHeaders }
    );

    const result = await Loan.addRepayment(loan.id, user_id, amount, `LOAN-REPAY-${loan.id}-${Date.now()}`);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const msg = err.response?.data?.message || 'Repayment failed';
    return res.status(err.response?.status || 500).json({ success: false, message: msg });
  }
};

const getLoanRepayments = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const repayments = await Loan.getRepayments(req.params.id);
    return res.status(200).json({ success: true, data: repayments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.getAll();
    return res.status(200).json({ success: true, data: loans });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLoanTypes = async (req, res) => {
  return res.status(200).json({ success: true, data: LOAN_RATES });
};

module.exports = { applyForLoan, getMyLoans, getLoanById, approveLoan, repayLoan, getLoanRepayments, getAllLoans, getLoanTypes };
