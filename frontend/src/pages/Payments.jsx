import RecordPage from "../components/RecordPage";
import { useLocalCollection } from "../services/localData";

function Payments() {
  const [invoices] = useLocalCollection("invoices");
  const invoiceOptions = [...new Set(invoices.map((invoice) => invoice.invoiceNumber).filter(Boolean))];
  return <RecordPage config={{
    collection: "payments",
    title: "Payments",
    singular: "Payment",
    action: "Record payment",
    description: "Record incoming money and see which invoices are settled.",
    nameKey: "customerName",
    statusOptions: ["Completed", "Pending", "Refunded"],
    fields: [
      { key: "customerName", label: "Customer", required: true, readOnly: true },
      { key: "invoiceNumber", label: "Invoice number", required: true, placeholder: "Choose an invoice", options: invoiceOptions },
      { key: "amount", label: "Amount received (₹)", type: "number", required: true },
      { key: "method", label: "Payment method", options: ["UPI", "Cash", "Bank transfer", "Card", "Other"] },
      { key: "status", label: "Status", options: ["Completed", "Pending", "Refunded"] },
      { key: "date", label: "Payment date", type: "date", required: true },
    ],
    columns: [
      { key: "customerName", label: "Customer", strong: true },
      { key: "invoiceNumber", label: "Invoice" },
      { key: "amount", label: "Amount", money: true },
      { key: "method", label: "Method" },
      { key: "status", label: "Status", status: true },
      { key: "date", label: "Date" },
    ],
  }} />;
}

export default Payments;
