export const ROLES = {
  AUTHOR: "author",
  OPERATIONS_EXECUTIVE: "operations_executive",
  ADMIN: "admin",
} as const;

export const TICKET_STATUS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  AWAITING_AUTHOR: "Awaiting Author",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
} as const;

export const TICKET_CATEGORY = {
  ROYALTY_PAYMENTS: "Royalty & Payments",
  ISBN_METADATA: "ISBN & Metadata Issues",
  PRINTING_QUALITY: "Printing & Quality",
  DISTRIBUTION_AVAILABILITY: "Distribution & Availability",
  BOOK_STATUS_PRODUCTION: "Book Status & Production Updates",
  GENERAL_INQUIRY: "General Inquiry",
} as const;

export const TICKET_PRIORITY = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

