import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import BillForm from "./BillForm";
import {
  collection,
  db,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
  orderBy,
  query,
} from "./firebase";
import ViewExpensesModal from "./ViewExpensesModal";

function ListOfBills() {
  const navigate = useNavigate();
  // State for managing modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDetail, setEditDetail] = useState(null);

  // State to hold fetched details and Waybill No options
  const [allDetails, setAllDetails] = useState([]); // Store ALL documents
  const [filteredDetails, setFilteredDetails] = useState([]); // Store filtered results
  const [waybillNos, setWaybillNos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle visibility for Add Form modal
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Toggle visibility for View Expenses modal
  const toggleExpensesModal = () =>
    setIsExpensesModalOpen(!isExpensesModalOpen);

  // Toggle visibility for Edit Billing modal
  const toggleEditModal = () => setIsEditModalOpen(!isEditModalOpen);

  // Fetch ALL details
  const fetchAllData = async () => {
    try {
      const detailsRef = collection(db, "details_form");
      const q = query(detailsRef, orderBy("waybillNo"));
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllDetails(data);
      setFilteredDetails(data); // Initially show all

      // Extract unique waybillNos
      const waybills = Array.from(new Set(data.map((item) => item.waybillNo)));
      setWaybillNos(waybills);
    } catch (e) {
      console.error("Error fetching documents: ", e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter details based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredDetails(allDetails);
      return;
    }

    const queryLower = searchQuery.toLowerCase();
    const filtered = allDetails.filter(
      (detail) =>
        detail.waybillNo && detail.waybillNo.toLowerCase().includes(queryLower)
    );

    setFilteredDetails(filtered);
  }, [searchQuery, allDetails]);

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
      const documentation =
        parseFloat(
          (charges.documentation || "0").toString().replace(/,/g, "")
        ) || 0;
      const handling =
        parseFloat((charges.handling || "0").toString().replace(/,/g, "")) || 0;
      const valuation =
        parseFloat((charges.valuation || "0").toString().replace(/,/g, "")) ||
        0;
      const freightValue =
        parseFloat((charges.freight || "0").toString().replace(/,/g, "")) || 0;

      // Sum all volumes
      let totalVolume = 0;
      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          const vol =
            parseFloat((row.volume || "0").toString().replace(/,/g, "")) || 0;
          totalVolume += vol;
        });
      }

      // Charges
      total += documentation;
      total += freightValue * totalVolume; // per-volume calculation
      total += handling;
      total += valuation;
    }

    if (Array.isArray(others)) {
      total += others.reduce(
        (sum, other) =>
          sum +
          (parseFloat((other.amount || "0").toString().replace(/,/g, "")) || 0),
        0
      );
    }

    return total;
  };

  const navigateToViewExpenses = () => {
    navigate("/view-expense");
  };

  // Function to handle edit button click
  const handleEdit = (detail) => {
    setEditDetail(detail);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (editDetail) {
      try {
        // Update the document's structure
        const updatedDetail = {
          ...editDetail,
          charges: {
            documentation: editDetail.charges?.documentation || 0,
            freight: editDetail.charges?.freight || 0,
            handling: editDetail.charges?.handling || 0,
            valuation: editDetail.charges?.valuation || 0,
          },
          modeOfService: {
            ...editDetail.modeOfService,
          },
          modeOfTransport: {
            ...editDetail.modeOfTransport,
          },
          others: editDetail.others || [],
          rows: editDetail.rows || [],
          shipmentDetails: {
            ...editDetail.shipmentDetails,
          },
          shipperName: editDetail.shipperName || "",
          waybillNo: editDetail.waybillNo || "",
        };

        const docRef = doc(db, "details_form", editDetail.id);
        await updateDoc(docRef, updatedDetail);

        // Update local state
        const updatedDetails = allDetails.map((item) =>
          item.id === editDetail.id ? { ...item, ...updatedDetail } : item
        );

        setAllDetails(updatedDetails);
        setIsEditModalOpen(false);
        alert("Changes saved successfully!");
      } catch (error) {
        console.error("Error updating document: ", error);
        alert("Error saving changes. Please try again.");
      }
    }
  };

  const getSelectedModes = (modeObject) => {
    return (
      Object.entries(modeObject)
        .filter(([key, value]) => value === true)
        .map(([key]) => key.replace(/([A-Z])/g, " $1").trim())
        .join(", ") || "No mode selected"
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, "details_form", id));

        // Update state without reloading
        const updatedDetails = allDetails.filter((detail) => detail.id !== id);
        setAllDetails(updatedDetails);

        alert("Record deleted successfully!");
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Error deleting the record. Please try again.");
      }
    }
  };

  // Pass this to BillForm to refresh data after new entry
  const handleNewBillAdded = () => {
    fetchAllData();
    toggleModal();
  };

  return (
    <div>
      <div className="container d-flex flex-row align-items-center justify-content-between">
        <button
          className="btn btn-md btn-primary mt-2"
          onClick={toggleExpensesModal}
        >
          View Expenses
        </button>
        <div>
          <button className="btn btn-md btn-primary mt-2" onClick={toggleModal}>
            Add Billing
          </button>
        </div>
      </div>
      <br />
      {/* Search field to filter by Waybill No */}
      <div className="container mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Waybill No (partial match)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* View Expenses Modal */}
      <ViewExpensesModal
        isOpen={isExpensesModalOpen}
        onClose={toggleExpensesModal}
        waybillNos={waybillNos}
      />

      {/* Add Form Modal */}
      {isModalOpen && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Bill Form
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={toggleModal}
                ></button>
              </div>
              <div className="modal-body">
                <BillForm onSuccess={handleNewBillAdded} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="container-fluid">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Waybill No</th>
              <th>Shipper Name</th>
              <th>Charges</th>
              <th>Mode of Transport</th>
              <th>Mode of Service</th>
              <th>Others</th>
              <th>Name of Consignee, Origin, Destination</th>
              <th>Quantity, Description, Volume</th>
              <th>Volume</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDetails.map((detail, index) => {
              const totalCharges = calculateTotalCharges(
                detail.charges,
                detail.others,
                detail.rows
              );
              return (
                <tr key={index}>
                  <td>{detail.waybillNo}</td>
                  <td>{detail.shipperName}</td>
                  <td>
                    {detail.charges &&
                      Object.entries(detail.charges).map(
                        ([key, value], idx) => (
                          <div key={idx}>
                            {key}: {value}
                          </div>
                        )
                      )}
                  </td>
                  <td>{getTrueModes(detail.modeOfTransport)}</td>
                  <td>{getTrueModes(detail.modeOfService)}</td>
                  <td>
                    {detail.others &&
                      detail.others.map((other, idx) => (
                        <div key={idx}>
                          {other.amount} - {other.description}
                        </div>
                      ))}
                  </td>
                  <td>
                    {detail.shipmentDetails
                      ? `Consignee: ${detail.shipmentDetails.consigneeName}, ${detail.shipmentDetails.origin} to ${detail.shipmentDetails.destination}`
                      : ""}
                  </td>
                  <td>
                    {detail.rows &&
                      detail.rows.map((row, idx) => (
                        <div key={idx}>
                          {row.description}: {row.quantity}
                        </div>
                      ))}
                  </td>
                  <td>
                    {detail.rows &&
                      detail.rows.map((row, idx) => (
                        <div key={idx}>{row.volume}</div>
                      ))}
                  </td>
                  <td>{totalCharges.toLocaleString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(detail)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(detail.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Edit Billing Modal */}
      <div
        className={`modal fade ${isEditModalOpen ? "show" : ""}`}
        tabIndex="-1"
        style={{ display: isEditModalOpen ? "block" : "none" }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Billing</h5>
              <button
                type="button"
                className="btn-close"
                onClick={toggleEditModal}
              ></button>
            </div>
            <div className="modal-body">
              {editDetail ? (
                <>
                  {/* Waybill No */}
                  <div className="form-group">
                    <label htmlFor="editWaybillNo">Waybill No</label>
                    <input
                      type="text"
                      id="editWaybillNo"
                      className="form-control"
                      value={editDetail.waybillNo}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          waybillNo: e.target.value,
                        });
                      }}
                    />
                  </div>

                  {/* Shipper Name */}
                  <div className="form-group">
                    <label htmlFor="editShipperName">Shipper Name</label>
                    <input
                      type="text"
                      id="editShipperName"
                      className="form-control"
                      value={editDetail.shipperName || ""}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          shipperName: e.target.value,
                        });
                      }}
                    />
                  </div>

                  {/* Charges - Documentation */}
                  <div className="form-group">
                    <label htmlFor="editChargesDocumentation">
                      Documentation Charge
                    </label>
                    <input
                      type="number"
                      id="editChargesDocumentation"
                      className="form-control"
                      value={editDetail.charges?.documentation || 0}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          charges: {
                            ...editDetail.charges,
                            documentation: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>

                  {/* Charges - Freight */}
                  <div className="form-group">
                    <label htmlFor="editChargesFreight">Freight Charge</label>
                    <input
                      type="number"
                      id="editChargesFreight"
                      className="form-control"
                      value={editDetail.charges?.freight || 0}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          charges: {
                            ...editDetail.charges,
                            freight: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>

                  {/* Charges - Handling */}
                  <div className="form-group">
                    <label htmlFor="editChargesHandling">Handling Charge</label>
                    <input
                      type="number"
                      id="editChargesHandling"
                      className="form-control"
                      value={editDetail.charges?.handling || 0}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          charges: {
                            ...editDetail.charges,
                            handling: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>

                  {/* Charges - Valuation */}
                  <div className="form-group">
                    <label htmlFor="editChargesValuation">
                      Valuation Charge
                    </label>
                    <input
                      type="number"
                      id="editChargesValuation"
                      className="form-control"
                      value={editDetail.charges?.valuation || 0}
                      onChange={(e) => {
                        setEditDetail({
                          ...editDetail,
                          charges: {
                            ...editDetail.charges,
                            valuation: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>

                  {/* Other Charges */}
                  <div className="form-group">
                    <label htmlFor="editOtherCharges">Other Charges</label>
                    {editDetail.others?.map((other, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between gap-2 mb-2"
                      >
                        <input
                          type="number"
                          className="form-control"
                          value={other.amount || 0}
                          onChange={(e) => {
                            const updatedOthers = [...editDetail.others];
                            updatedOthers[index].amount = e.target.value;
                            setEditDetail({
                              ...editDetail,
                              others: updatedOthers,
                            });
                          }}
                          placeholder="Amount"
                        />
                        <input
                          type="text"
                          className="form-control"
                          value={other.description || ""}
                          onChange={(e) => {
                            const updatedOthers = [...editDetail.others];
                            updatedOthers[index].description = e.target.value;
                            setEditDetail({
                              ...editDetail,
                              others: updatedOthers,
                            });
                          }}
                          placeholder="Description"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Shipment Details */}
                  <div className="form-group">
                    <label>Shipment Details</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editDetail.shipmentDetails?.consigneeName || ""}
                        onChange={(e) => {
                          setEditDetail({
                            ...editDetail,
                            shipmentDetails: {
                              ...editDetail.shipmentDetails,
                              consigneeName: e.target.value,
                            },
                          });
                        }}
                        placeholder="Consignee Name"
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={editDetail.shipmentDetails?.origin || ""}
                        onChange={(e) => {
                          setEditDetail({
                            ...editDetail,
                            shipmentDetails: {
                              ...editDetail.shipmentDetails,
                              origin: e.target.value,
                            },
                          });
                        }}
                        placeholder="Origin"
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={editDetail.shipmentDetails?.destination || ""}
                        onChange={(e) => {
                          setEditDetail({
                            ...editDetail,
                            shipmentDetails: {
                              ...editDetail.shipmentDetails,
                              destination: e.target.value,
                            },
                          });
                        }}
                        placeholder="Destination"
                      />
                    </div>
                  </div>

                  {/* Quantity, Description, Volume */}
                  <div className="form-group">
                    <label>Quantity, Description, Volume</label>
                    {editDetail.rows?.map((row, index) => (
                      <div key={index} className="mb-3">
                        <div className="d-flex gap-2 mb-2">
                          <input
                            type="number"
                            className="form-control"
                            value={row.quantity || 0}
                            onChange={(e) => {
                              const updatedRows = [...editDetail.rows];
                              updatedRows[index].quantity = e.target.value;
                              setEditDetail({
                                ...editDetail,
                                rows: updatedRows,
                              });
                            }}
                            placeholder="Quantity"
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={row.description || ""}
                            onChange={(e) => {
                              const updatedRows = [...editDetail.rows];
                              updatedRows[index].description = e.target.value;
                              setEditDetail({
                                ...editDetail,
                                rows: updatedRows,
                              });
                            }}
                            placeholder="Description"
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <input
                            type="number"
                            className="form-control"
                            value={row.volume || 0}
                            onChange={(e) => {
                              const updatedRows = [...editDetail.rows];
                              updatedRows[index].volume = e.target.value;
                              setEditDetail({
                                ...editDetail,
                                rows: updatedRows,
                              });
                            }}
                            placeholder="Volume"
                          />
                          <input
                            type="number"
                            className="form-control"
                            value={row.weight || 0}
                            onChange={(e) => {
                              const updatedRows = [...editDetail.rows];
                              updatedRows[index].weight = e.target.value;
                              setEditDetail({
                                ...editDetail,
                                rows: updatedRows,
                              });
                            }}
                            placeholder="Weight"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="form-group">
                    <label>Total</label>
                    <input
                      type="text"
                      className="form-control"
                      value={calculateTotalCharges(
                        editDetail.charges,
                        editDetail.others,
                        editDetail.rows
                      ).toLocaleString()}
                      readOnly
                    />
                  </div>

                  <button
                    className="btn btn-primary mt-3"
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <p>No details available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListOfBills;
