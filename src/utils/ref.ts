import { createId } from "@paralleldrive/cuid2";

export default function generateOrderReference() {
  return `ORD_${createId()}`;
}
