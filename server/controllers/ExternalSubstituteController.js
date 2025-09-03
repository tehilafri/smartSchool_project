import ExternalSubstitute from '../models/ExternalSubstitute.js';

// הוספת ממלא מקום חדש
export const addExternalSubstitute = async (req, res) => {
  try {
    const { firstName, lastName, identityNumber, email, phone, subjects, availability } = req.body;

    const newSub = new ExternalSubstitute({
      firstName,
      lastName,
      identityNumber,
      email,
      phone,
      subjects,
      availability
    });

    await newSub.save();
    res.status(201).json({ message: 'External substitute added successfully', substitute: newSub });
  } catch (err) {
    console.error('Error adding substitute:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// מחיקת ממלא מקום לפי ID (Mongo ObjectId)
export const deleteExternalSubstitute = async (req, res) => {
  try {
    const { idNumber } = req.params;
    const deleted = await ExternalSubstitute.findOneAndDelete({ idNumber });
    if (!deleted) return res.status(404).json({ message: "External substitute not found" });
    res.json({ message: "External substitute deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// עדכון פרט של ממלא מקום
export const updateExternalSubstitute = async (req, res) => {
  try {
    const { identityNumber } = req.params;
    const updates = req.body;

    const updated = await ExternalSubstitute.findOneAndUpdate(
      { identityNumber },
      { $set: updates },
      { new: true } // מחזיר את המסמך אחרי העדכון
    );

    if (!updated) return res.status(404).json({ message: "External substitute not found" });
    res.json({ message: "External substitute updated successfully", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// קבלת כל ממלאי המקום
export const getAllExternalSubstitutes = async (req, res) => {
  try {
    const subs = await ExternalSubstitute.find();
    res.json(subs);
  } catch (err) {
    console.error('Error fetching substitutes:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// קבלת ממלא מקום לפי תעודת זהות
export const getExternalSubstituteByIdNumber = async (req, res) => {
  try {
    const { identityNumber } = req.params;
    const substitute = await ExternalSubstitute.findOne({ identityNumber });
    if (!substitute) return res.status(404).json({ message: "External substitute not found" });
    res.json(substitute);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};