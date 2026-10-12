import RecordPage from "../components/RecordPage";

function Inventory() {
  return <RecordPage config={{
    collection: "products",
    title: "Inventory",
    singular: "Product",
    action: "Add product",
    description: "See what is in stock and catch low inventory early.",
    nameKey: "name",
    fields: [
      { key: "name", label: "Product name", required: true },
      { key: "category", label: "Category", options: ["General", "Electronics", "Food & beverage", "Clothing", "Furniture", "Other"] },
      { key: "stock", label: "Quantity in stock", type: "number", required: true },
      { key: "price", label: "Unit price (₹)", type: "number", required: true },
    ],
    columns: [
      { key: "name", label: "Product", strong: true },
      { key: "category", label: "Category" },
      { key: "stock", label: "In stock", stock: true },
      { key: "price", label: "Price", money: true },
    ],
  }} />;
}

export default Inventory;
