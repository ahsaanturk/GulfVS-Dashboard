
import { MongoClient } from 'mongodb';

async function check() {
    const client = new MongoClient('mongodb+srv://student:1234@cluster0.n94ki.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    await client.connect();
    const db = client.db('gulfvs_db');
    const user = await db.collection('users').findOne({ username: 'ahsaan' });
    console.log('User Role:', user ? user.role : 'User not found');
    await client.close();
}
check();
