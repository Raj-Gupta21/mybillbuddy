import RecordPage from "../components/RecordPage";

function Customers() {
  return <RecordPage config={{
    collection: "customers",
    title: "Customers",
    singular: "Customer",
    action: "Add customer",
    description: "Keep customer contact details and outstanding balances together.",
    nameKey: "name",
    fields: [
      { key: "name", label: "Customer or business name", required: true },
      { key: "phone", label: "Mobile number", type: "tel", placeholder: "+91 98765 43210", required: true },
      { key: "email", label: "Email address", type: "email", required: false },
      { key: "address", label: "Billing address", required: false },
      { key: "gstin", label: "GSTIN (optional)", required: false },
    ],
    columns: [
      { key: "name", label: "Name", strong: true },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "totalDue", label: "Total due", money: true },
    ],
  }} />;
}

export default Customers;
