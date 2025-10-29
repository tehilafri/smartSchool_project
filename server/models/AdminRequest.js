import mongoose from 'mongoose';

const AdminRequestSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true }, // no unique constraint
  phone: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  userId: { type: String, required: true },
  approvalToken: { type: String, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  tatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

const AdminRequest = mongoose.models.AdminRequest || mongoose.model('AdminRequest', AdminRequestSchema);

// When the DB connection opens, try to drop a legacy unique index on email (if present).
// This is safe: if index does not exist or permissions are missing we ignore errors.
function tryDropEmailUniqueIndex() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    // wait for connection
    mongoose.connection.once('open', async () => {
      try {
        const coll = mongoose.connection.db.collection('adminrequests');
        const indexes = await coll.indexes();
        const emailUniqueIndex = indexes.find(idx => idx.key && idx.key.email === 1 && idx.unique);
        if (emailUniqueIndex) {
          await coll.dropIndex(emailUniqueIndex.name || 'email_1');
          console.log('Dropped unique index on adminrequests.email (allow duplicate emails).');
        }
      } catch (err) {
        // ignore errors (no permission / index missing / connection issues)
        console.warn('Could not drop adminrequests.email index (ignored):', err.message || err);
      }
    });
  } else {
    (async () => {
      try {
        const coll = mongoose.connection.db.collection('adminrequests');
        const indexes = await coll.indexes();
        const emailUniqueIndex = indexes.find(idx => idx.key && idx.key.email === 1 && idx.unique);
        if (emailUniqueIndex) {
          await coll.dropIndex(emailUniqueIndex.name || 'email_1');
          console.log('Dropped unique index on adminrequests.email (allow duplicate emails).');
        }
      } catch (err) {
        console.warn('Could not drop adminrequests.email index (ignored):', err.message || err);
      }
    })();
  }
}

tryDropEmailUniqueIndex();

export default AdminRequest;