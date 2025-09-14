import express from "express";
import SubstituteRequest from "../models/SubstituteRequest.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { absenceCode } = req.query;
    if (!absenceCode) return res.status(400).send("Missing absenceCode");

    const request = await SubstituteRequest.findOne({ absenceCode });
    if (!request) {
      return res.status(404).send("<h3>בקשה לא נמצאה</h3>");
    }

    if (request.status === "accepted") {
      return res.send("<h2 style='color:red'>העניין טופל, תודה רבה!</h2>");
    }

    // מפנים לטופס Google המקורי (עם פרמטר הקוד). החלק הזה ישמור על הפרמטר entry.XXXXX
    const googleFormBase = "https://docs.google.com/forms/d/e/1FAIpQLSeO337WglTzh5-IXXVxyzA7MthOGBPGIVha3u_FmuWzZ-HLvg/viewform";
    const redirectUrl = `${googleFormBase}?usp=pp_url&entry.915764786=${encodeURIComponent(absenceCode)}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("form route error:", err);
    return res.status(500).send("Server error");
  }
});

export default router;
