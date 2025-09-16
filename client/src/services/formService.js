import api from "./api";

// קבלת לינק לטופס (או הודעה שהקוד טופל/לא נמצא)
export const getFormRedirect = async (absenceCode) => {
  try {
    const response = await api.get(`/form?absenceCode=${absenceCode}`, {
      // חשוב לקבל את התשובה כטקסט, לא כ־JSON
      responseType: "text",
    });

    return response.data; 
  } catch (error) {
    throw error.response?.data || "שגיאה בעת בקשת הטופס";
  }
};
