import RecordPage from "../components/RecordPage";

function Inventory() {
  return <RecordPage config={{
    collection: "products",
    title: "Inventory",
    singular: "Product",
    action: "Add product",
    description: "Track each size or pack size as its own product row, set reorder alerts, and review stock changes.",
    nameKey: "name",
    fields: [
      { key: "name", label: "Product name", required: true },
      { key: "category", label: "Category", options: ["General", "Electronics", "Food & beverage", "Clothing", "Furniture", "Other"] },
      { key: "variant", label: "Variant (size / weight / flavor)", required: false },
      { key: "stock", label: "Quantity in stock", type: "number", step: 1, required: true },
      { key: "reorderLevel", label: "Alert me when stock reaches", type: "number", step: 1, defaultValue: 10, required: false },
      { key: "price", label: "Unit price (₹)", type: "number", required: true },
    ],
    columns: [
      { key: "name", label: "Product", strong: true },
      { key: "variant", label: "Variant" },
      { key: "category", label: "Category" },
      { key: "stock", label: "In stock", stock: true },
      { key: "reorderLevel", label: "Low stock alert at" },
      { key: "price", label: "Price", money: true },
    ],
  }} />;
}

export default Inventory;
