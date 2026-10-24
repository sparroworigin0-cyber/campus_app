const MSG: Record<string, string> = {
  CANNOT_MODIFY_SELF: "You can't change your own account here.",
  CANNOT_MODIFY_ADMIN: "Admin accounts can't be changed from this screen.",
  HAS_ACTIVE_ORDERS: "This user has unfinished orders. Cancel or release them first.",
  ORDER_FINAL: "That order is already finished.",
  NOT_CLAIMED: "That order isn't assigned to an agent.",
  NOT_IN_DELIVERY: "Only accepted or out-for-delivery orders can be marked delivered.",
  INVALID_FEE: "Enter a charge between 0 and 1000.",
};
export const adminError = (code?: string) => (code ? MSG[code] ?? code : null);
