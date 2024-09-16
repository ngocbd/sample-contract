import fs from "fs";

export const readAddresses = (network: string) => {
  try {
    return fs.readFileSync(`${__dirname}/deployed/contract-addresses-${network}.json`, "utf-8");
  } catch (error) {
    // Handle the case when the file doesn't exist yet
    return "[]";
  }
};

export type Address = { [key: string]: string };

export const writeAddresses = (addresses: Address, network: string) => {
  try {
    // Read existing data from the file
    let currentData = JSON.parse(readAddresses(network));

    if (currentData.addresses === undefined || currentData.addresses === null) {
      currentData = { addresses: {} };
    }

    // Append new data to the existing array
    Object.assign(currentData.addresses, addresses);

    // Write the updated data back to the file
    fs.writeFileSync(`${__dirname}/deployed/contract-addresses-${network}.json`, JSON.stringify(currentData, null, 2));

    console.log("Data appended to contract-addresses.json:", addresses);
  } catch (error) {
    console.error("Error writing addresses:", error);
  }
};

export const loadData = (network: string): { addresses: Address } => {
  const data = readAddresses(network);
  return JSON.parse(data);
};
