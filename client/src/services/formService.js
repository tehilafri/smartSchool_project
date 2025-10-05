import api from "./api";

// קבלת לינק לטופס (קיים אצלך)
export const getFormRedirect = async (absenceCode) => {
  try {
    const response = await api.get(`/form?absenceCode=${absenceCode}`, {
      responseType: "text",
    });
    return response.data; 
  } catch (error) {
    throw error.response?.data || "שגיאה בעת בקשת הטופס";
  }
};