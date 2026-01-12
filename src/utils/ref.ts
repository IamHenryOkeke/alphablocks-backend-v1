import { createId } from "@paralleldrive/cuid2";

export default function generateTrxReference() {
  return `COHORT_TICKET_${createId()}`;
}
