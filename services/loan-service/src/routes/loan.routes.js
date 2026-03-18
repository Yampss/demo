const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/auth.middleware');

router.get('/types', loanController.getLoanTypes);
router.post('/apply', authenticate, loanController.applyForLoan);
router.get('/my', authenticate, loanController.getMyLoans);
router.get('/all', authenticate, authorizeAdmin, loanController.getAllLoans);
router.get('/:id', authenticate, loanController.getLoanById);
router.patch('/:id/approve', authenticate, authorizeAdmin, loanController.approveLoan);
router.post('/:id/repay', authenticate, loanController.repayLoan);
router.get('/:id/repayments', authenticate, loanController.getLoanRepayments);

module.exports = router;
