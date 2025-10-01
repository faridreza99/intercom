import axios from "axios";

const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const INTERCOM_API_URL = "https://api.intercom.io/contacts";

export async function fetchContactDetails(contactId: string) {
  try {
    const response = await axios.get(`${INTERCOM_API_URL}/${contactId}`, {
      headers: {
        Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        Accept: "application/json",
      },
    });

    const contact = response.data;

    console.log("✅ Contact Found:");
    console.log("Name:", contact.name);
    console.log("Email:", contact.email);
    console.log("Phone:", contact.phone);
    console.log("ID:", contact.id);
    console.log("Created at:", new Date(contact.created_at * 1000).toLocaleString());

    return contact;

  } catch (error: any) {
    console.error("❌ Failed to fetch contact details:", error.response?.data || error.message);
    return null;
  }
}
