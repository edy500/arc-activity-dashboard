import { useEffect } from "react";
import { fetchAddressTransactions } from "../services/arcscan";

const ADDRESS = "0x1b12948DEb4405324546F4c6eE90f2aF178505bd";

useEffect(() => {
  fetchAddressTransactions(ADDRESS)
    .then(data => {
      console.log("Arc transactions:", data);
    })
    .catch(err => {
      console.error(err);
    });
}, []);
