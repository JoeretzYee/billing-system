// ViewExpenses.js
import React from "react";

function ViewExpenses({ details }) {
  return (
    <div>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Waybill No</th>
            <th>Shipper Name</th>
            <th>Charges</th>
            <th>Mode of Transport</th>
            <th>Mode of Service</th>
            <th>Others</th>
            <th>Consignee, Origin, Destination</th>
            <th>Quantity, Description, Volume</th>
            <th>Volume</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, index) => (
            <tr key={index}>
              <td>{detail.waybillNo}</td>
              <td>{detail.shipperName}</td>
              <td>{/* Display charges */}</td>
              <td>{/* Display mode of transport */}</td>
              <td>{/* Display mode of service */}</td>
              <td>{/* Display others */}</td>
              <td>{/* Display consignee, origin, destination */}</td>
              <td>{/* Display quantity, description, volume */}</td>
              <td>{/* Display volume */}</td>
              <td>{/* Display total charges */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewExpenses;
