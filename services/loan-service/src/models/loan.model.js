const pool = require('../db');

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      loan_type VARCHAR(30) NOT NULL DEFAULT 'personal',
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(5,2) NOT NULL,
      term_months INTEGER NOT NULL,
      monthly_payment DECIMAL(15,2) NOT NULL,
      total_payable DECIMAL(15,2) NOT NULL,
      amount_paid DECIMAL(15,2) DEFAULT 0.00,
      outstanding_amount DECIMAL(15,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      purpose TEXT,
      approved_by INTEGER,
      approved_at TIMESTAMP,
      disbursed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS loan_repayments (
      id SERIAL PRIMARY KEY,
      loan_id INTEGER NOT NULL REFERENCES loans(id),
      user_id INTEGER NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      transaction_reference VARCHAR(100),
      status VARCHAR(20) DEFAULT 'completed'
    )
  `);
};

const calculateLoan = (principal, rate, termMonths) => {
  const monthlyRate = rate / 100 / 12;
  const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  const total = monthly * termMonths;
  return { monthly: parseFloat(monthly.toFixed(2)), total: parseFloat(total.toFixed(2)) };
};

const create = async ({ user_id, account_id, loan_type, principal_amount, interest_rate, term_months, purpose }) => {
  const { monthly, total } = calculateLoan(principal_amount, interest_rate, term_months);
  const result = await pool.query(
    `INSERT INTO loans (user_id, account_id, loan_type, principal_amount, interest_rate, term_months, monthly_payment, total_payable, outstanding_amount, purpose)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [user_id, account_id, loan_type, principal_amount, interest_rate, term_months, monthly, total, total, purpose]
  );
  return result.rows[0];
};

const findByUserId = async (user_id) => {
  const result = await pool.query('SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query('SELECT * FROM loans WHERE id = $1', [id]);
  return result.rows[0];
};

const updateStatus = async (id, status, approved_by) => {
  const result = await pool.query(
    `UPDATE loans SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [status, approved_by, id]
  );
  return result.rows[0];
};

const addRepayment = async (loan_id, user_id, amount, transaction_reference) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const repayment = await client.query(
      `INSERT INTO loan_repayments (loan_id, user_id, amount, transaction_reference) VALUES ($1, $2, $3, $4) RETURNING *`,
      [loan_id, user_id, amount, transaction_reference]
    );
    const updated = await client.query(
      `UPDATE loans SET amount_paid = amount_paid + $1, outstanding_amount = outstanding_amount - $1,
       updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [amount, loan_id]
    );
    const loan = updated.rows[0];
    if (loan.outstanding_amount <= 0) {
      await client.query(`UPDATE loans SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [loan_id]);
    }
    await client.query('COMMIT');
    return { repayment: repayment.rows[0], loan };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getRepayments = async (loan_id) => {
  const result = await pool.query('SELECT * FROM loan_repayments WHERE loan_id = $1 ORDER BY payment_date DESC', [loan_id]);
  return result.rows;
};

const getAll = async () => {
  const result = await pool.query('SELECT * FROM loans ORDER BY created_at DESC');
  return result.rows;
};

module.exports = { initDB, create, findByUserId, findById, updateStatus, addRepayment, getRepayments, getAll };
