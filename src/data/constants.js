// Status constants for PCR (Petty Cash Request)
export const PCR_STATUS = {
  PENDING_GM: 'Pending GM',
  GM_REJECTED: 'GM Rejected',
  APPROVED: 'Approved',
  ACKNOWLEDGED: 'Acknowledged by AP',
  CLOSURE_REQUESTED: 'Closure Requested',
  CLOSURE_CONFIRMED: 'Closure Confirmed by AP',
  CLOSED: 'Closed',
};

// Status constants for PCC (Petty Cash Claim)
export const PCC_STATUS = {
  PENDING_PM: 'Pending PM',
  PENDING_AP: 'Pending AP',
  AP_REJECTED: 'AP Rejected',
  PENDING_GM: 'Pending GM',
  GM_REJECTED: 'GM Rejected',
  APPROVED: 'Approved',
  EDITING: 'Editing',
};
