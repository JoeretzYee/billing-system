import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { collection, db, getDocs, query, where } from "./firebase";
import ListOfBills from "./ListOfBills";
import ViewExpenses from "./ViewExpenses";

function App() {
  // State for managing modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

  // State to hold fetched details and Waybill No options
  const [details, setDetails] = useState([]);
  const [waybillNos, setWaybillNos] = useState([]);
  const [selectedWaybillNo, setSelectedWaybillNo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle visibility for Add Form modal
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Toggle visibility for View Expenses modal
  const toggleExpensesModal = () =>
    setIsExpensesModalOpen(!isExpensesModalOpen);

  // Fetch data for Waybill Nos
  useEffect(() => {
    const fetchWaybillNos = async () => {
      const detailsRef = collection(db, "details_form");
      try {
        const querySnapshot = await getDocs(detailsRef);
        querySnapshot.forEach((doc) => {
          console.log(doc.id, doc.data()); // Check what is returned
        });
        const waybillList = querySnapshot.docs
          .map((doc) => doc.data().waybillNo)
          .filter((waybillNo) => waybillNo); // Filter out empty or undefined waybillNo
        setWaybillNos(waybillList);
      } catch (e) {
        console.error("Error fetching waybillNos: ", e);
      }
    };

    fetchWaybillNos(); // Call the fetch function here
  }, []); // Fetch once on component mount

  console.log("waybill nos: ", waybillNos);
  // Fetch details based on search query or selected Waybill No
  useEffect(() => {
    const fetchDetails = async () => {
      const detailsRef = collection(db, "details_form");
      const q = searchQuery
        ? query(detailsRef, where("waybillNo", "==", searchQuery))
        : detailsRef;

      try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => doc.data());
        setDetails(data);
      } catch (e) {
        console.error("Error fetching documents: ", e);
      }
    };

    fetchDetails();
  }, [searchQuery]); // Fetch data when search query changes

  // Helper function to extract true modes from an object
  const getTrueModes = (modeObject) => {
    if (modeObject && typeof modeObject === "object") {
      return Object.entries(modeObject)
        .filter(([key, value]) => value === true)
        .map(([key]) => key)
        .join(", ");
    }
    return "";
  };

  // Calculate total charges
  const calculateTotalCharges = (charges, others, rows) => {
    let total = 0;

    if (charges) {
      total += parseFloat(charges.documentation || 0);
      if (charges.freight && rows && rows[0].volume) {
        total += parseFloat(charges.freight) * parseFloat(rows[0].volume); // Multiply freight by volume
      } else {
        total += parseFloat(charges.freight || 0);
      }

      total += parseFloat(charges.handling || 0);
      total += parseFloat(charges.valuation || 0);
    }

    if (others) {
      total += others.reduce(
        (sum, other) => sum + parseFloat(other.amount || 0),
        0
      );
    }

    return total;
  };

  return (
    <div className="app">
      <header className="bg-dark text-white py-3">
        <div className="container">
          <h1 className="text-center mb-0">ES Tablante Cargo Services</h1>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ListOfBills />} />
          <Route path="/view-expense" element={<ViewExpenses />} />
        </Routes>
      </main>

      <footer className="bg-dark text-white py-3">
        <div className="container text-center">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Management System. All Rights
            Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
