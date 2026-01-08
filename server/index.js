
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.VITE_MONGO_URI || '';
if (!MONGO_URI) {
  console.error('MONGO_URI not set. Please set it in .env');
}

const app = express();
app.use(cors());
app.use(express.json());

const DB_NAME = 'gulfvs_db';

let dbClient;
let db;
let collections = {
  contacts: null,
  logs: null,
  users: null
};

let connectionPromise = null;

async function connect() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      dbClient = new MongoClient(MONGO_URI);
      await dbClient.connect();
      db = dbClient.db(DB_NAME);

      // Initialize specific collections
      collections.contacts = db.collection('contacts');
      collections.logs = db.collection('logs');
      collections.users = db.collection('users');

      // Ensure unique indexes on IDs
      await collections.contacts.createIndex({ id: 1 }, { unique: true });
      await collections.logs.createIndex({ id: 1 }, { unique: true });
      await collections.users.createIndex({ id: 1 }, { unique: true });
      await collections.users.createIndex({ username: 1 }, { unique: true });

      // Seed default admin if no users exist
      const userCount = await collections.users.countDocuments();
      if (userCount === 0) {
        console.log("Seeding default admin user...");
        const hashedPassword = await bcrypt.hash('1123', 10);
        await collections.users.insertOne({
          id: crypto.randomUUID(),
          username: 'nehmat',
          password: hashedPassword,
          role: 'admin',
          createdAt: Date.now()
        });
      }
      console.log('Connected to MongoDB');
    } catch (e) {
      connectionPromise = null; // Reset on failure
      dbClient = null;
      console.error('Failed to connect to MongoDB', e);
      throw e;
    }
  })();

  return connectionPromise;
}

// Ping/Health check
app.get('/api/ping', async (req, res) => {
  try {
    await connect();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Contacts Endpoints
app.get('/api/contacts', async (req, res) => {
  await connect();
  const docs = await collections.contacts.find({}).toArray();
  res.json(docs);
});

app.post('/api/contacts', async (req, res) => {
  await connect();
  const payload = req.body;
  if (!payload.id) payload.id = crypto.randomUUID();
  await collections.contacts.updateOne({ id: payload.id }, { $set: payload }, { upsert: true });
  res.json({ id: payload.id });
});

app.delete('/api/contacts/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  await collections.contacts.deleteOne({ id });
  // Also remove associated logs
  await collections.logs.deleteMany({ companyId: id });
  res.json({ ok: true });
});

// Logs Endpoints
app.get('/api/logs', async (req, res) => {
  await connect();
  const docs = await collections.logs.find({}).toArray();
  res.json(docs);
});

app.post('/api/logs', async (req, res) => {
  await connect();
  const payload = req.body;
  if (!payload.id) payload.id = crypto.randomUUID();
  await collections.logs.updateOne({ id: payload.id }, { $set: payload }, { upsert: true });
  res.json({ id: payload.id });
});

app.delete('/api/logs/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  await collections.logs.deleteOne({ id });
  res.json({ ok: true });
});

app.patch('/api/logs/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  await collections.logs.updateOne({ id }, { $set: updates });
  res.json({ ok: true });
});

// Users Endpoints
app.get('/api/users', async (req, res) => {
  await connect();
  const docs = await collections.users.find({}).project({ password: 0 }).toArray();
  res.json(docs);
});

app.post('/api/users', async (req, res) => {
  await connect();
  const payload = { ...req.body };
  delete payload._id;
  if (!payload.id) payload.id = crypto.randomUUID();
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }
  await collections.users.updateOne({ id: payload.id }, { $set: payload }, { upsert: true });
  res.json({ id: payload.id });
});

app.patch('/api/users/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  await collections.users.updateOne({ id }, { $set: updates });
  res.json({ ok: true });
});

app.delete('/api/users/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  await collections.users.deleteOne({ id });
  res.json({ ok: true });
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for:', username);
  await connect();
  const user = await collections.users.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });

  if (!user) {
    console.log('User not found in DB');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const pwMatch = await bcrypt.compare(password, user.password);
  console.log('Password match:', pwMatch);

  if (!pwMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const safe = { ...user };
  delete safe.password;
  res.json({ user: safe });
});

// Full Batch Sync (Push from client)
app.post('/api/sync', async (req, res) => {
  const { contacts, logs, users } = req.body;
  await connect();

  try {
    if (contacts && Array.isArray(contacts)) {
      const ops = contacts.map(c => {
        const doc = { ...c };
        delete doc._id;
        return {
          updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true }
        };
      });
      if (ops.length > 0) await collections.contacts.bulkWrite(ops);
    }

    if (logs && Array.isArray(logs)) {
      const ops = logs.map(l => {
        const doc = { ...l };
        delete doc._id;
        return {
          updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true }
        };
      });
      if (ops.length > 0) await collections.logs.bulkWrite(ops);
    }

    // We don't usually sync users from client for security, but keeping it for completeness if needed
    // In this app, users are managed via admin, let's keep it safe.

    res.json({ ok: true });
  } catch (e) {
    console.error("Sync error:", e);
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  try {
    // Cascading delete: Remove contact AND all associated logs
    await collections.contacts.deleteOne({ id });
    await collections.logs.deleteMany({ companyId: id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  await connect();
  const { id } = req.params;
  try {
    await collections.logs.deleteOne({ id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Batch Fetch (Pull to client after login)
app.get('/api/sync/all', async (req, res) => {
  await connect();
  const [contacts, logs] = await Promise.all([
    collections.contacts.find({}).toArray(),
    collections.logs.find({}).toArray()
  ]);
  res.json({ contacts, logs });
});

const port = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

export default app;
