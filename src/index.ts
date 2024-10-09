import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { ClientEncryption, MongoClient, Binary, AutoEncryptionOptions } from 'mongodb';

dotenv.config();

const app = express();
app.use(express.json());

const requiredEnvVars = ['MONGO_URI', 'MASTER_KEY'];

requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`${varName} is not set in the environment variables`);
        process.exit(1);
    }
});

const masterKey = Buffer.from(process.env.MASTER_KEY!, 'base64');
const keyVaultNamespace = 'encryption.__keyVault';
const kmsProviders = { local: { key: masterKey } };

const schemaMap = {
    "queryable_encryption.users": {
        bsonType: "object",
        encryptMetadata: {
            keyId: [new Binary(Buffer.from(process.env.KEY_ID!, 'base64'), 4)]
        },
        properties: {
            email: {
                encrypt: {
                    bsonType: "string",
                    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
                }
            },
            password: {
                encrypt: {
                    bsonType: "string",
                    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
                }
            },
            ssn: {
                encrypt: {
                    bsonType: "string",
                    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
                }
            }
        }
    }
};

async function createKey() {
    const client = new MongoClient(process.env.MONGO_URI!);
    await client.connect();
    const encryption = new ClientEncryption(client, { keyVaultNamespace, kmsProviders });
    const keyId = await encryption.createDataKey('local');
    await client.close();
    return keyId.toString('base64');
}

async function createEncryptedClient() {
    const autoEncryptionOpts: AutoEncryptionOptions = {
        keyVaultNamespace,
        kmsProviders,
        schemaMap,
    };

    return new MongoClient(process.env.MONGO_URI!, {
        autoEncryption: autoEncryptionOpts,
        serverSelectionTimeoutMS: 5000,
    });
}

async function connectWithEncryption() {
    const encryptedClient = await createEncryptedClient();
    await encryptedClient.connect();
    return encryptedClient;
}

app.post('/api/register', async (req: Request, res: Response) => {
    let client;
    try {
        const { name, email, password, ssn } = req.body;
        client = await connectWithEncryption();
        const db = client.db('queryable_encryption');

        const result = await db.collection('users').insertOne({ name, email, password, ssn });
        res.json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (error: any) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) await client.close();
    }
});

app.get('/api/user/:email', async (req: Request, res: Response) => {
    let client;
    try {
        client = await connectWithEncryption();
        const db = client.db('queryable_encryption');
        const user = await db.collection('users').findOne({ email: req.params.email });
        if (user) {
            const { password, ssn, ...safeUser } = user;
            res.json(safeUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) await client.close();
    }
});

const PORT = process.env.PORT || 8000;

if (!process.env.KEY_ID) {
    createKey()
        .then((keyId) => {
            console.log(`Add this KEY_ID to your .env file: ${keyId}`);
            process.exit(0);
        })
        .catch((err) => console.error(err));
} else {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
